import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { initializeApp as initAdminApp, getApps as getAdminApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Firebase Admin SDK for server-side token verification
const adminApp = !getAdminApps().length
  ? initAdminApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'ai-studio-languagelearning-8e9edc5e-f81c-4f7b-b5a5-7514d76890c8'
    })
  : getAdminApps()[0];
const adminAuth = getAdminAuth(adminApp);

// In-memory sliding window rate limiter: 40 requests/min per user
const userRateLimits = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(uid: string, limit = 40, windowMs = 60000): boolean {
  const now = Date.now();
  const rec = userRateLimits.get(uid);
  if (!rec || now > rec.resetTime) {
    userRateLimits.set(uid, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (rec.count >= limit) return false;
  rec.count++;
  return true;
}

// Authenticate user via Authorization Bearer token & verify with Firebase Admin
async function authenticateUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid Authorization Bearer token' });
    }
    const idToken = authHeader.substring(7).trim();
    if (!idToken) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Empty token' });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    (req as any).user = decoded;

    if (!checkRateLimit(decoded.uid, 40, 60000)) {
      return res.status(429).json({ success: false, error: 'Too Many Requests: Rate limit exceeded. Please wait a minute.' });
    }

    next();
  } catch (err: any) {
    console.error('Authentication error:', err?.message || err);
    return res.status(401).json({ success: false, error: 'Unauthorized: Token verification failed' });
  }
}

// Optional auth middleware for gameplay AI features (voice transcription, phrase lookup, AI referee)
// Verifies Firebase token if present, or falls back to IP-based guest rate limiting so guest players can use the microphone
async function optionalAuthenticateUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  let rateLimitKey = req.ip || 'guest-player';
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.substring(7).trim();
      if (idToken) {
        const decoded = await adminAuth.verifyIdToken(idToken);
        (req as any).user = decoded;
        rateLimitKey = decoded.uid || rateLimitKey;
      }
    }
  } catch {
    // Proceed with guest rate limit key in preview/guest mode
  }

  if (!checkRateLimit(rateLimitKey, 60, 60000)) {
    return res.status(429).json({ success: false, error: 'Too Many Requests: Rate limit exceeded. Please wait a minute.' });
  }

  next();
}

// Admin authorization check: requires admin claim or admin uid/verified email
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = (req as any).user;
  const isAdmin = user && (
    user.admin === true ||
    user.role === 'admin' ||
    user.uid === 'admin-m-jaberi' ||
    (user.email === 'm.jaberi1212@gmail.com' && user.email_verified === true)
  );

  if (!isAdmin) {
    return res.status(403).json({ success: false, error: 'Forbidden: Admin privileges required' });
  }
  next();
}

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json({ limit: '30mb' }));

  // Initializing Google GenAI client (reads GEMINI_API_KEY from environment)
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // 1. Google Maps Grounding Endpoint (gemini-3.5-flash with googleMaps tool)
  // Used for Admin local game meetups, board game cafes, and finding community play spots
  app.post('/api/meetups/search-venues', authenticateUser, requireAdmin, async (req, res) => {
    try {

      const { query, location, latLng } = req.body;
      const searchQuery = query || (location ? `Find the best cozy board game cafes, language exchange venues, or social game spaces in ${location} where friends can gather and play the party game 'Dour'. List specific venue names and vibes.` : `Best board game cafes and friendly hangout venues nearby to play party games and language games.`);

      const config: any = {
        tools: [{ googleMaps: {} }],
      };

      if (latLng && typeof latLng.latitude === 'number' && typeof latLng.longitude === 'number') {
        config.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: latLng.latitude,
              longitude: latLng.longitude,
            },
          },
        };
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: searchQuery,
        config,
      });

      const text = response.text || '';
      
      // Extract Google Maps URLs from grounding chunks as mandated by Maps Grounding spec
      const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const places: Array<{ title: string; uri: string; reviewSnippets?: string[] }> = [];

      for (const chunk of rawChunks as any[]) {
        if (chunk?.maps?.uri) {
          places.push({
            title: chunk.maps.title || 'مکان در Google Maps',
            uri: chunk.maps.uri,
            reviewSnippets: chunk.maps.placeAnswerSources?.reviewSnippets || [],
          });
        }
      }

      res.json({
        success: true,
        text,
        places,
      });
    } catch (error: any) {
      console.error('Error in /api/meetups/search-venues:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'خطا در جستجوی مکان‌های بازی با Google Maps',
      });
    }
  });

  // 2. Google Search Grounding Endpoint (gemini-3.5-flash with googleSearch tool)
  // Used for real-time phrase research, authentic cultural usage, etymology, and modern slang verification
  app.post('/api/ai/search-phrase', optionalAuthenticateUser, async (req, res) => {
    try {
      const { phrase, language, targetLanguage } = req.body;
      if (!phrase) {
        return res.status(400).json({ success: false, error: 'عبارت جهت جستجو الزامی است' });
      }

      const prompt = `Research the current real-world usage, cultural context, authentic everyday dialogues, and common idioms around the term: "${phrase}" in ${targetLanguage || 'the learning language'} (explained clearly for a language learner speaking ${language || 'Persian'}). Provide authentic examples and verifiable sources.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || '';
      const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources: Array<{ title: string; uri: string }> = [];

      for (const chunk of rawChunks as any[]) {
        if (chunk?.web?.uri) {
          sources.push({
            title: chunk.web.title || 'منبع وب',
            uri: chunk.web.uri,
          });
        }
      }

      res.json({
        success: true,
        text,
        sources,
      });
    } catch (error: any) {
      console.error('Error in /api/ai/search-phrase:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'خطا در جستجوی آنلاین عبارت با Google Search',
      });
    }
  });

  // 3. Multi-Turn Gemini Chatbot Endpoint
  // Supports gemini-3.1-flash-lite (fast), gemini-3.5-flash (general), and gemini-3.1-pro-preview (complex)
  app.post('/api/ai/chat', optionalAuthenticateUser, async (req, res) => {
    try {
      const { messages, taskType = 'general', learningLanguage = 'English', guideLanguage = 'Persian' } = req.body;
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ success: false, error: 'Message history is required / تاریخچه پیام‌ها الزامی است' });
      }

      let modelName = 'gemini-3.1-flash-lite';
      let fallbackModelName = 'gemini-3.8-flash';
      if (taskType === 'fast') {
        modelName = 'gemini-3.1-flash-lite';
        fallbackModelName = 'gemini-3.8-flash';
      } else if (taskType === 'complex') {
        modelName = 'gemini-3.8-flash';
        fallbackModelName = 'gemini-3.1-flash-lite';
      }

      const systemInstruction = `You are the official "Turn / Dour AI Language Coach & Game Referee".
Your role:
1. Quickly and fairly referee translation, pronunciation, and word-guessing disputes during the party game.
2. Teach vocabulary, idioms, and grammar for the target learning language (${learningLanguage}) explained clearly in the user's selected app language (${guideLanguage}).
3. Provide engaging, friendly, and practical examples suitable for a lively party & language learning game.
4. Keep responses concise, structured, and easy to scan so players can quickly resume their game.
CRITICAL LANGUAGE RULE: Always write your explanations, greetings, and referee decisions in ${guideLanguage} (the user's selected app language), while showing target-language examples/phrases in ${learningLanguage}.`;

      // Format conversation history for @google/genai
      const contents = messages.map((m: { role: 'user' | 'assistant' | 'model'; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      let response;
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
          },
        });
      } catch (primaryErr: any) {
        response = await ai.models.generateContent({
          model: fallbackModelName,
          contents,
          config: {
            systemInstruction,
          },
        });
      }

      res.json({
        success: true,
        text: response.text || '',
        model: modelName,
      });
    } catch (error: any) {
      console.error('Error in /api/ai/chat:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error communicating with Gemini AI Coach',
      });
    }
  });

  // Helper to extract transcription text from both gemini-3.5-transcribe (audioTranscription part) and standard text parts
  function extractTranscriptionText(resp: any): string {
    if (!resp) return '';
    const parts = resp.candidates?.[0]?.content?.parts || [];
    const fromParts = parts
      .map((p: any) => p?.audioTranscription?.text || p?.text || '')
      .filter(Boolean)
      .join(' ')
      .trim();
    if (fromParts) return fromParts;
    try {
      return String(resp.text || '').trim();
    } catch {
      return '';
    }
  }

  // 4. Audio Transcription Endpoint (model: gemini-3.5-transcribe with gemini-3.1-flash-lite fallback)
  // Transcribes recorded microphone audio for voice answers, pronunciation tests, and voice chat
  app.post('/api/ai/transcribe', optionalAuthenticateUser, async (req, res) => {
    try {
      const { audioBase64, mimeType = 'audio/webm', targetLanguage, expectedHint } = req.body;
      if (!audioBase64) {
        return res.status(400).json({ success: false, error: 'Audio data is required' });
      }

      const langNameMap: Record<string, string> = {
        en: 'English',
        'en-US': 'English',
        fa: 'Persian (Farsi)',
        nl: 'Dutch',
        de: 'German',
        fr: 'French',
        es: 'Spanish',
        it: 'Italian',
        ar: 'Arabic',
        tr: 'Turkish',
        ru: 'Russian',
        pt: 'Portuguese',
        zh: 'Chinese',
        ja: 'Japanese',
        ko: 'Korean',
        hi: 'Hindi',
        sv: 'Swedish',
        pl: 'Polish',
        uk: 'Ukrainian',
      };
      const cleanMime = String(mimeType || 'audio/webm').split(';')[0].trim() || 'audio/webm';
      const langLabel = targetLanguage ? (langNameMap[targetLanguage] || targetLanguage) : '';
      const contextHint = expectedHint ? ` (The speaker is answering a language card in ${langLabel || 'the target language'}.)` : '';

      const promptText = langLabel
        ? `Transcribe the spoken words in this audio accurately in ${langLabel}.${contextHint} Output ONLY the exact spoken words or sentence without quotes, markdown, or extra explanation. If the audio is completely silent, return an empty string.`
        : `Transcribe the spoken words in this audio accurately. Output ONLY the exact spoken words or sentence without quotes or explanations.`;

      const audioPart = {
        inlineData: {
          mimeType: cleanMime,
          data: audioBase64,
        },
      };

      const modelsToTry = ['gemini-3.5-transcribe', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
      let transcribedText = '';
      let lastErr: any = null;

      for (const m of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: m,
            contents: {
              parts: [
                audioPart,
                { text: promptText },
              ],
            },
          });
          const extracted = extractTranscriptionText(response)
            .replace(/^["'«»`]+|["'«»`]+$/g, '')
            .trim();
          if (extracted) {
            transcribedText = extracted;
            break;
          }
        } catch (err: any) {
          lastErr = err;
        }
      }

      if (!transcribedText && lastErr) {
        throw lastErr;
      }

      res.json({
        success: true,
        text: transcribedText,
      });
    } catch (error: any) {
      console.error('Error in /api/ai/transcribe:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error transcribing audio',
      });
    }
  });

  // Helper: Convert raw 16-bit signed little-endian mono PCM (24kHz) from Gemini TTS into standard WAV buffer
  function pcm16ToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmBuffer.length;
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);
    return Buffer.concat([header, pcmBuffer]);
  }

  // In-memory TTS audio cache for instant 0ms repeat playback
  const ttsAudioCache = new Map<string, { buffer: Buffer; contentType: string }>();
  const ttsInFlight = new Map<string, Promise<{ buffer: Buffer; contentType: string } | null>>();

  function setCachedTts(key: string, value: { buffer: Buffer; contentType: string }) {
    if (ttsAudioCache.size >= 600) {
      const oldestKey = ttsAudioCache.keys().next().value;
      if (oldestKey) ttsAudioCache.delete(oldestKey);
    }
    ttsAudioCache.set(key, value);
  }

  async function generateGeminiTtsWav(text: string, langCode: string): Promise<{ buffer: Buffer; contentType: string } | null> {
    const cacheKey = `${langCode}:${text}`;
    const existing = ttsInFlight.get(cacheKey);
    if (existing) return existing;

    const langNames: Record<string, string> = {
      fa: 'Persian (Farsi)',
      ku: 'Kurdish',
      az: 'Azerbaijani',
      hy: 'Armenian',
      ka: 'Georgian',
      en: 'English',
      ar: 'Arabic',
      tr: 'Turkish',
    };
    const langLabel = langNames[langCode] || langCode;

    const promise = (async () => {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Say clearly in ${langLabel}: ${text}`,
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          },
        });
        const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (inlineData?.data) {
          const rawBuffer = Buffer.from(inlineData.data, 'base64');
          const mime = (inlineData.mimeType || '').toLowerCase();
          const hasRiffHeader = rawBuffer.length > 44 && rawBuffer.subarray(0, 4).toString('ascii') === 'RIFF';
          const wavBuffer = !hasRiffHeader && (mime.includes('pcm') || mime.includes('l16'))
            ? pcm16ToWav(rawBuffer, 24000, 1, 16)
            : rawBuffer;
          const result = {
            buffer: wavBuffer,
            contentType: mime.includes('mpeg') || mime.includes('mp3') ? 'audio/mpeg' : 'audio/wav',
          };
          setCachedTts(cacheKey, result);
          return result;
        }
      } catch (err) {
        // Ignore and allow fallback
      } finally {
        ttsInFlight.delete(cacheKey);
      }
      return null;
    })();

    ttsInFlight.set(cacheKey, promise);
    return promise;
  }

  async function fetchGoogleTranslateTts(text: string, tl: string): Promise<{ buffer: Buffer; contentType: string } | null> {
    try {
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(tl)}&q=${encodeURIComponent(text)}`;
      const upstream = await fetch(ttsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': 'https://translate.google.com/'
        }
      });
      if (!upstream.ok) return null;
      const arrayBuffer = await upstream.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength === 0) return null;
      return {
        buffer: Buffer.from(arrayBuffer),
        contentType: 'audio/mpeg'
      };
    } catch {
      return null;
    }
  }

  // 5. Server-side TTS Audio Proxy Endpoint (avoids browser CORS & missing OS voice issues for Persian/38+ languages)
  app.get('/api/tts', async (req, res) => {
    try {
      const q = String(req.query.q || '').trim().slice(0, 200);
      const tl = String(req.query.tl || 'en').trim().split('-')[0].toLowerCase();
      if (!q) {
        return res.status(400).end();
      }

      const cacheKey = `${tl}:${q}`;
      const cached = ttsAudioCache.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', cached.contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(cached.buffer);
      }

      // Languages not supported directly by Google Translate TTS: fa, ku, az, hy, ka
      const unsupportedOnGoogleTranslate = new Set(['fa', 'ku', 'az', 'hy', 'ka']);
      // Closest phonetic script voices on Google Translate for instant fallback if Gemini TTS is slow
      const googleFallbackMap: Record<string, string> = {
        fa: 'ur', // Perso-Arabic script (supports پ چ ژ گ ک ی)
        ku: 'ur',
        az: 'tr', // Turkic phonetic cousin
        hy: 'ru',
        ka: 'ru'
      };

      if (!unsupportedOnGoogleTranslate.has(tl)) {
        const directResult = await fetchGoogleTranslateTts(q, tl);
        if (directResult) {
          setCachedTts(cacheKey, directResult);
          res.setHeader('Content-Type', directResult.contentType);
          res.setHeader('Cache-Control', 'public, max-age=86400');
          return res.send(directResult.buffer);
        }
      }

      // For Persian (fa) and other languages missing from Google Translate TTS:
      // Race Gemini TTS (1800ms window) so native neural voice is returned when fast,
      // while still warming the cache in the background if fallback is used first.
      const geminiPromise = generateGeminiTtsWav(q, tl);
      const timeoutPromise = new Promise<null>(resolve => setTimeout(() => resolve(null), 1800));
      const geminiQuickResult = await Promise.race([geminiPromise, timeoutPromise]);

      if (geminiQuickResult) {
        res.setHeader('Content-Type', geminiQuickResult.contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(geminiQuickResult.buffer);
      }

      // Instant fallback via closest phonetic Google TTS voice so audio never fails or hangs
      const fallbackTl = googleFallbackMap[tl] || 'en';
      const fallbackResult = await fetchGoogleTranslateTts(q, fallbackTl);
      if (fallbackResult) {
        res.setHeader('Content-Type', fallbackResult.contentType);
        res.setHeader('Cache-Control', 'no-cache');
        return res.send(fallbackResult.buffer);
      }

      // Final wait on Gemini TTS if fallback also didn't return
      const finalGemini = await geminiPromise;
      if (finalGemini) {
        res.setHeader('Content-Type', finalGemini.contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(finalGemini.buffer);
      }

      return res.status(502).end();
    } catch (err) {
      console.error('TTS proxy error:', err);
      res.status(500).end();
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'dour-language-party' });
  });

  // Dev mode Vite middlewares vs Production static build
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    const indexPath = path.resolve(distPath, 'index.html');
    app.use(express.static(distPath));
    app.use((req, res) => {
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.sendFile(path.resolve(__dirname, 'index.html'));
      }
    });
  }

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
