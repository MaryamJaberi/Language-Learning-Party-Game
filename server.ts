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
  const ai = new GoogleGenAI();

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
        model: 'gemini-3.5-flash',
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
  app.post('/api/ai/search-phrase', authenticateUser, async (req, res) => {
    try {
      const { phrase, language, targetLanguage } = req.body;
      if (!phrase) {
        return res.status(400).json({ success: false, error: 'عبارت جهت جستجو الزامی است' });
      }

      const prompt = `Research the current real-world usage, cultural context, authentic everyday dialogues, and common idioms around the term: "${phrase}" in ${targetLanguage || 'the learning language'} (explained clearly for a language learner speaking ${language || 'Persian'}). Provide authentic examples and verifiable sources.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
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
  app.post('/api/ai/chat', authenticateUser, async (req, res) => {
    try {
      const { messages, taskType = 'general', learningLanguage = 'English', guideLanguage = 'Persian' } = req.body;
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ success: false, error: 'تاریخچه پیام‌ها الزامی است' });
      }

      let modelName = 'gemini-3.5-flash';
      if (taskType === 'fast') {
        modelName = 'gemini-3.1-flash-lite';
      } else if (taskType === 'complex') {
        modelName = 'gemini-3.1-pro-preview';
      }

      const systemInstruction = `شما «مربی هوشمند و داور بازی دور (Dour AI Coach & Referee)» هستید.
نقش شما:
1. داوری سریع و حل اختلاف بر سر ترجمه‌ها، تلفظ‌ها و حدس کلمات در بازی.
2. آموزش کلمات و گرامر در زبان هدف (${learningLanguage}) به زبان راهنما (${guideLanguage}).
3. ارائه مثال‌های صمیمانه و جذاب با طنز و انرژی مثبت برای مهمانی‌ها و بازی‌های دوستانه.
4. پاسخ‌های مختصر و ساخت‌یافته بدهید تا بازیکنان بتوانند بلافاصله بازی را ادامه دهند.`;

      // Format conversation history for @google/genai
      const contents = messages.map((m: { role: 'user' | 'assistant' | 'model'; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction,
        },
      });

      res.json({
        success: true,
        text: response.text || '',
        model: modelName,
      });
    } catch (error: any) {
      console.error('Error in /api/ai/chat:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'خطا در ارتباط با مربی هوشمند جمینای',
      });
    }
  });

  // 4. Audio Transcription Endpoint (model: gemini-3.5-transcribe)
  // Transcribes recorded microphone audio for voice answers, pronunciation tests, and voice chat
  app.post('/api/ai/transcribe', authenticateUser, async (req, res) => {
    try {
      const { audioBase64, mimeType = 'audio/webm', targetLanguage } = req.body;
      if (!audioBase64) {
        return res.status(400).json({ success: false, error: 'داده صوتی ارسال نشده است' });
      }

      const promptText = targetLanguage
        ? `Transcribe this spoken audio accurately in ${targetLanguage}. Return ONLY the exact spoken transcription without commentary or punctuation embellishment.`
        : `Transcribe this spoken audio accurately. Return ONLY the transcribed text.`;

      const audioPart = {
        inlineData: {
          mimeType,
          data: audioBase64,
        },
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            audioPart,
            { text: promptText },
          ],
        },
      });

      res.json({
        success: true,
        text: (response.text || '').trim(),
      });
    } catch (error: any) {
      console.error('Error in /api/ai/transcribe:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'خطا در رونویسی صوت با gemini-3.5-transcribe',
      });
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
