/**
 * Client service for Gemini AI features:
 * - Google Maps Grounding for Local Meetups & Venues (Admin feature)
 * - Google Search Grounding for Real-Time Phrase Context & Etymology
 * - Multi-turn AI Coach & Game Referee Chatbot
 * - Audio Transcription via gemini-3.5-transcribe
 */

import { auth } from './firebase';

export interface MapPlace {
  title: string;
  uri: string;
  reviewSnippets?: string[];
}

export interface WebSource {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  modelUsed?: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      return { Authorization: `Bearer ${token}` };
    }
  } catch (err) {
    console.warn('Could not retrieve Firebase auth token for API request:', err);
  }
  return {};
}

export async function searchVenuesWithMaps(
  location?: string,
  latLng?: { latitude: number; longitude: number },
  query?: string
): Promise<{ text: string; places: MapPlace[] }> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch('/api/meetups/search-venues', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...authHeaders
    },
    body: JSON.stringify({ location, latLng, query }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'خطا در ارتباط با سرویس Google Maps');
  }

  return {
    text: data.text,
    places: data.places || [],
  };
}

export async function searchPhraseWithGoogle(
  phrase: string,
  language = 'fa',
  targetLanguage = 'en'
): Promise<{ text: string; sources: WebSource[] }> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch('/api/ai/search-phrase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ phrase, language, targetLanguage }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'خطا در جستجوی آنلاین');
  }

  return {
    text: data.text,
    sources: data.sources || [],
  };
}

export async function chatWithGemini(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  taskType: 'fast' | 'general' | 'complex' = 'general',
  learningLanguage = 'English',
  guideLanguage = 'Persian'
): Promise<{ text: string; model: string }> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ messages, taskType, learningLanguage, guideLanguage }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'خطا در ارتباط با مربی هوشمند');
  }

  return {
    text: data.text,
    model: data.model,
  };
}

export async function transcribeAudioBlob(
  audioBlob: Blob,
  targetLanguage?: string
): Promise<string> {
  // Convert blob to base64
  const arrayBuffer = await audioBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const audioBase64 = btoa(binary);
  const mimeType = audioBlob.type || 'audio/webm';

  const authHeaders = await getAuthHeaders();
  const res = await fetch('/api/ai/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ audioBase64, mimeType, targetLanguage }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'خطا در تبدیل صوت به متن');
  }

  return data.text;
}

// MediaRecorder audio capture helper with automatic Voice Activity / Silence Detection (VAD)
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private vadInterval: number | null = null;
  private maxDurationTimer: number | null = null;

  async start(existingStream?: MediaStream, onSilenceDetected?: () => void): Promise<void> {
    this.audioChunks = [];
    this.cleanupVad();

    if (existingStream && existingStream.active) {
      this.stream = existingStream;
    } else {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch {
        // Fallback to unconstrained audio if specific constraints fail on Windows/Bluetooth drivers
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    }

    // Choose mimeType supported by browser
    const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
    let selectedMimeType = '';
    if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
      for (const mt of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mt)) {
          selectedMimeType = mt;
          break;
        }
      }
    }

    try {
      this.mediaRecorder = selectedMimeType
        ? new MediaRecorder(this.stream, { mimeType: selectedMimeType })
        : new MediaRecorder(this.stream);
    } catch {
      this.mediaRecorder = new MediaRecorder(this.stream);
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(150); // 150ms slice for responsive short words

    if (onSilenceDetected && this.stream) {
      this.setupVoiceActivityDetection(this.stream, onSilenceDetected);
    }
  }

  private setupVoiceActivityDetection(stream: MediaStream, onSilenceDetected: () => void): void {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx: AudioContext = new AudioCtx();
        this.audioContext = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let hasSpoken = false;
        let silenceStart = 0;
        const startedAt = Date.now();

        this.vadInterval = window.setInterval(() => {
          if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
            this.cleanupVad();
            return;
          }
          analyser.getByteTimeDomainData(dataArray);
          let sumSquares = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const norm = (dataArray[i] - 128) / 128;
            sumSquares += norm * norm;
          }
          const rms = Math.sqrt(sumSquares / dataArray.length);
          const now = Date.now();

          if (rms > 0.025) {
            hasSpoken = true;
            silenceStart = 0;
          } else if (hasSpoken) {
            if (!silenceStart) {
              silenceStart = now;
            } else if (now - silenceStart >= 1100) {
              this.cleanupVad();
              onSilenceDetected();
              return;
            }
          } else if (now - startedAt >= 4500) {
            this.cleanupVad();
            onSilenceDetected();
            return;
          }
        }, 100);
      }
    } catch {
      // Fallback if Web Audio API is unavailable
    }

    this.maxDurationTimer = window.setTimeout(() => {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.cleanupVad();
        onSilenceDetected();
      }
    }, 6500);
  }

  private cleanupVad(): void {
    if (this.vadInterval !== null) {
      clearInterval(this.vadInterval);
      this.vadInterval = null;
    }
    if (this.maxDurationTimer !== null) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
  }

  stop(): Promise<Blob> {
    this.cleanupVad();
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        this.cleanupStream();
        return reject(new Error('ضبط‌کننده صوت فعال نیست'));
      }

      const recorder = this.mediaRecorder;
      const mimeType = (recorder.mimeType || 'audio/webm').split(';')[0].trim() || 'audio/webm';

      if (recorder.state === 'inactive') {
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        this.cleanupStream();
        this.mediaRecorder = null;
        return resolve(audioBlob);
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        this.cleanupStream();
        this.mediaRecorder = null;
        resolve(audioBlob);
      };

      try {
        if (recorder.state === 'recording' && typeof recorder.requestData === 'function') {
          recorder.requestData();
        }
        recorder.stop();
      } catch (err) {
        this.cleanupStream();
        this.mediaRecorder = null;
        reject(err);
      }
    });
  }

  cancel(): void {
    this.cleanupVad();
    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.onstop = null;
        this.mediaRecorder.stop();
      }
    } catch {}
    this.cleanupStream();
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  private cleanupStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      this.stream = null;
    }
  }

  isRecording(): boolean {
    return this.mediaRecorder !== null && this.mediaRecorder.state === 'recording';
  }
}

