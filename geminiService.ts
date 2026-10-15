/**
 * Client service for Gemini AI features:
 * - Google Maps Grounding for Local Meetups & Venues (Admin feature)
 * - Google Search Grounding for Real-Time Phrase Context & Etymology
 * - Multi-turn AI Coach & Game Referee Chatbot
 * - Audio Transcription via gemini-3.5-transcribe
 */

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

export async function searchVenuesWithMaps(
  location?: string,
  latLng?: { latitude: number; longitude: number },
  query?: string
): Promise<{ text: string; places: MapPlace[] }> {
  const res = await fetch('/api/meetups/search-venues', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  const res = await fetch('/api/ai/search-phrase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

  const res = await fetch('/api/ai/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioBase64, mimeType, targetLanguage }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'خطا در تبدیل صوت به متن');
  }

  return data.text;
}

// MediaRecorder audio capture helper
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  async start(): Promise<void> {
    this.audioChunks = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Choose mimeType supported by browser
    const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
    let selectedMimeType = '';
    for (const mt of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mt)) {
        selectedMimeType = mt;
        break;
      }
    }

    this.mediaRecorder = selectedMimeType ? new MediaRecorder(stream, { mimeType: selectedMimeType }) : new MediaRecorder(stream);
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(200); // 200ms slice
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        return reject(new Error('ضبط‌کننده صوت فعال نیست'));
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        
        // Stop audio tracks
        this.mediaRecorder?.stream.getTracks().forEach(track => track.stop());
        this.mediaRecorder = null;
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder !== null && this.mediaRecorder.state === 'recording';
  }
}
