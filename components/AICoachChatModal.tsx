import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Send, Mic, MicOff, Bot, User, Sparkles, Zap, Brain, BookOpen, RefreshCw, AlertCircle } from 'lucide-react';
import { chatWithGemini, transcribeAudioBlob, AudioRecorder, ChatMessage } from '../geminiService';
import { sound } from '../soundManager';
import { SUPPORTED_LANGUAGES } from '../constants';
import { isRtlLang } from '../ui';

interface AICoachChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  learningLanguage?: string;
  guideLanguage?: string;
  uiLanguage?: string;
  isRTL?: boolean;
}

interface CoachLocaleStrings {
  title: string;
  subtitle: (targetLang: string) => string;
  welcome: (targetLang: string) => string;
  speedLabel: string;
  speedFast: string;
  speedGeneral: string;
  speedComplex: string;
  modelLabel: string;
  thinking: string;
  transcribing: string;
  inputPlaceholder: string;
  recordingPlaceholder: string;
  micStartTitle: string;
  micStopTitle: string;
  sendLabel: string;
  closeLabel: string;
  resetLabel: string;
  errorPrefix: string;
  micPermissionError: string;
  transcribeErrorPrefix: string;
  quickPrompts: (targetLang: string, guideLangName: string) => Array<{ label: string; prompt: string }>;
}

const COACH_LOCALES: Record<string, CoachLocaleStrings> = {
  fa: {
    title: 'مربی هوشمند و داور بازی دور',
    subtitle: (target) => `حل اختلاف ترجمه‌ها، تحلیل گرامر و تمرین تعاملی زبان ${target}`,
    welcome: (target) =>
      `سلام! من مربی هوشمند و داور رسمی بازی «دور» هستم.\nمی‌توانید برای رفع اختلاف حدس کلمات، تحلیل گرامر، تمرین مکالمه به زبان ${target} یا هر سوالی از من کمک بگیرید. همچنین می‌توانید با دکمه میکروفون صدایتان را ضبط کنید تا با مدل هوش مصنوعی برایتان رونویسی شود.`,
    speedLabel: 'سرعت و دقت مدل:',
    speedFast: 'سریع (Flash Lite)',
    speedGeneral: 'عمومی و مکالمه (3.5 Flash)',
    speedComplex: 'عمیق و گرامر (3.1 Pro)',
    modelLabel: 'مدل:',
    thinking: 'مربی در حال اندیشیدن و تدوین پاسخ...',
    transcribing: 'در حال رونویسی صدای شما با مدل هوش مصنوعی...',
    inputPlaceholder: 'از مربی هوشمند بپرسید یا واژه‌ای را ترجمه و داوری کنید...',
    recordingPlaceholder: 'در حال ضبط صدایتان... دوباره کلیک کنید تا تمام شود',
    micStartTitle: 'صحبت با میکروفون (رونویسی با هوش مصنوعی)',
    micStopTitle: 'توقف ضبط',
    sendLabel: 'ارسال',
    closeLabel: 'بستن',
    resetLabel: 'شروع مجدد گفتگو',
    errorPrefix: 'متاسفانه در دریافت پاسخ خطایی رخ داد:',
    micPermissionError: 'لطفاً دسترسی به میکروفون را در مرورگر مجاز بفرمایید.',
    transcribeErrorPrefix: 'خطا در رونویسی صوت:',
    quickPrompts: (target) => [
      {
        label: 'داوری پاسخ در بازی',
        prompt: `در دور بازی، هم‌تیمی من یک پاسخ نزدیک به کلمه کارت (${target}) گفت؛ چطور منصفانه داوری کنیم که آیا قابل قبول است یا خیر؟`,
      },
      {
        label: 'راهنمای گرامر و مثال',
        prompt: `یک توضیح کوتاه و بسیار شفاف از یک ساختار گرامری مهم در زبان ${target} با ۳ مثال کاربردی بده.`,
      },
      {
        label: 'مکالمه تمرینی کوتاه',
        prompt: `بیا یک مکالمه دونفره سریع برای سفارش غذا در رستوران به زبان ${target} تمرین کنیم. تو شروع کن.`,
      },
      {
        label: 'اصطلاحات عامیانه و کاربردی',
        prompt: `۳ تا از جذاب‌ترین و به‌روزترین اصطلاحات عامیانه در زبان ${target} با معنی فارسی برایم بگو.`,
      },
    ],
  },
  en: {
    title: 'Turn AI Coach & Game Referee',
    subtitle: (target) => `Settle translation disputes, grammar analysis & interactive ${target} practice`,
    welcome: (target) =>
      `Hi! I'm your official Turn AI Coach & Referee.\nAsk me to settle word-guessing disputes, explain grammar rules, practice ${target} conversation, or answer any question. You can also tap the microphone button to record your voice for AI transcription.`,
    speedLabel: 'Model Speed & Depth:',
    speedFast: 'Fast (Flash Lite)',
    speedGeneral: 'General & Chat (3.5 Flash)',
    speedComplex: 'Deep & Grammar (3.1 Pro)',
    modelLabel: 'Model:',
    thinking: 'AI Coach is thinking and crafting a response...',
    transcribing: 'Transcribing your voice with Gemini AI...',
    inputPlaceholder: 'Ask your AI Coach, translate a phrase, or referee a game answer...',
    recordingPlaceholder: 'Recording your voice... Tap again to finish',
    micStartTitle: 'Speak with microphone (AI Transcription)',
    micStopTitle: 'Stop recording',
    sendLabel: 'Send',
    closeLabel: 'Close',
    resetLabel: 'Reset conversation',
    errorPrefix: 'Sorry, an error occurred while getting a response:',
    micPermissionError: 'Please allow microphone access in your browser settings.',
    transcribeErrorPrefix: 'Audio transcription error:',
    quickPrompts: (target, guide) => [
      {
        label: 'Referee Game Answer',
        prompt: `In our round, my teammate gave a close synonym for a ${target} card. How should we fairly judge if it counts?`,
      },
      {
        label: 'Grammar Tip & Examples',
        prompt: `Give me a short, crystal-clear explanation of an essential grammar pattern in ${target} with 3 practical examples (explained in ${guide}).`,
      },
      {
        label: 'Quick Roleplay Chat',
        prompt: `Let's do a quick 2-person roleplay ordering food at a restaurant in ${target}. You start!`,
      },
      {
        label: 'Everyday Idioms',
        prompt: `Share 3 popular, natural everyday idioms in ${target} with their meaning and usage in ${guide}.`,
      },
    ],
  },
  nl: {
    title: 'AI-Taalcoach & Scheidsrechter',
    subtitle: (target) => `Los vertaaldiscussies op, grammatica-analyse & interactieve ${target}-oefening`,
    welcome: (target) =>
      `Hoi! Ik ben je officiële AI-Coach & Scheidsrechter.\nVraag me om woordraad-discussies te beslechten, grammatica uit te leggen of een gesprek in het ${target} te oefenen. Je kunt ook op de microfoon tikken om je stem op te nemen.`,
    speedLabel: 'Modelsnelheid:',
    speedFast: 'Snel (Flash Lite)',
    speedGeneral: 'Algemeen & Chat (3.5 Flash)',
    speedComplex: 'Diep & Grammatica (3.1 Pro)',
    modelLabel: 'Model:',
    thinking: 'AI-Coach denkt na...',
    transcribing: 'Spraak wordt getranscribeerd met AI...',
    inputPlaceholder: 'Stel een vraag aan de AI-Coach of laat een antwoord beoordelen...',
    recordingPlaceholder: 'Aan het opnemen... Tik nogmaals om te stoppen',
    micStartTitle: 'Spreek via microfoon (AI-transcriptie)',
    micStopTitle: 'Opname stoppen',
    sendLabel: 'Verzenden',
    closeLabel: 'Sluiten',
    resetLabel: 'Gesprek wissen',
    errorPrefix: 'Er is een fout opgetreden:',
    micPermissionError: 'Geef toestemming voor de microfoon in je browser.',
    transcribeErrorPrefix: 'Fout bij spraaktranscriptie:',
    quickPrompts: (target) => [
      {
        label: 'Antwoord Beoordelen',
        prompt: `Mijn teamgenoot gaf een bijna-goed antwoord voor een kaart in het ${target}. Hoe beoordelen we dit eerlijk?`,
      },
      {
        label: 'Grammatica & Voorbeelden',
        prompt: `Geef een korte, duidelijke uitleg van een belangrijke grammaticale regel in het ${target} met 3 praktische voorbeelden.`,
      },
      {
        label: 'Kort Rollenspel',
        prompt: `Laten we een kort gesprek oefenen voor het bestellen in een restaurant in het ${target}. Jij begint!`,
      },
      {
        label: 'Populaire Uitdrukkingen',
        prompt: `Leer me 3 leuke, veelgebruikte uitdrukkingen in het ${target} met Nederlandse betekenis.`,
      },
    ],
  },
  de: {
    title: 'KI-Sprachcoach & Schiedsrichter',
    subtitle: (target) => `Übersetzungsfragen klären, Grammatikanalyse & interaktives ${target}-Training`,
    welcome: (target) =>
      `Hallo! Ich bin dein offizieller KI-Coach & Spielschiedsrichter.\nFrag mich bei Wortrate-Diskussionen, Grammatikfragen oder zum Üben von ${target}-Dialogen. Du kannst auch das Mikrofon für die Spracheingabe nutzen.`,
    speedLabel: 'Modell & Tempo:',
    speedFast: 'Schnell (Flash Lite)',
    speedGeneral: 'Allgemein & Chat (3.5 Flash)',
    speedComplex: 'Tief & Grammatik (3.1 Pro)',
    modelLabel: 'Modell:',
    thinking: 'KI-Coach überlegt...',
    transcribing: 'Sprache wird mit KI transkribiert...',
    inputPlaceholder: 'Frag den KI-Coach oder lass eine Antwort prüfen...',
    recordingPlaceholder: 'Aufnahme läuft... Zum Beenden erneut tippen',
    micStartTitle: 'Mit Mikrofon sprechen',
    micStopTitle: 'Aufnahme stoppen',
    sendLabel: 'Senden',
    closeLabel: 'Schließen',
    resetLabel: 'Chat zurücksetzen',
    errorPrefix: 'Ein Fehler ist aufgetreten:',
    micPermissionError: 'Bitte erlaube den Mikrofonzugriff im Browser.',
    transcribeErrorPrefix: 'Transkriptionsfehler:',
    quickPrompts: (target) => [
      {
        label: 'Spielantwort prüfen',
        prompt: `Mein Mitspieler hat im Spiel eine ähnliche Antwort für eine ${target}-Karte gegeben. Wie werten wir das fair?`,
      },
      {
        label: 'Grammatik & Beispiele',
        prompt: `Gib mir eine kurze, klare Erklärung einer wichtigen Grammatikregel in ${target} mit 3 praktischen Beispielen.`,
      },
      {
        label: 'Kurzes Rollenspiel',
        prompt: `Lass uns ein kurzes Gespräch im Restaurant auf ${target} üben. Du fängst an!`,
      },
      {
        label: 'Redewendungen',
        prompt: `Zeig mir 3 moderne, nützliche Redewendungen auf ${target} mit deutscher Erklärung.`,
      },
    ],
  },
  fr: {
    title: 'Coach IA & Arbitre du Jeu',
    subtitle: (target) => `Arbitrage des traductions, grammaire et pratique interactive (${target})`,
    welcome: (target) =>
      `Salut ! Je suis votre Coach IA et Arbitre officiel.\nDemandez-moi de trancher un mot deviné, d'expliquer la grammaire ou de pratiquer la conversation en ${target}. Vous pouvez aussi utiliser le microphone.`,
    speedLabel: 'Modèle & Vitesse :',
    speedFast: 'Rapide (Flash Lite)',
    speedGeneral: 'Général & Chat (3.5 Flash)',
    speedComplex: 'Approfondi & Grammaire (3.1 Pro)',
    modelLabel: 'Modèle :',
    thinking: 'Le Coach IA réfléchit...',
    transcribing: 'Transcription vocale IA en cours...',
    inputPlaceholder: 'Posez une question au Coach IA ou faites arbitrer une réponse...',
    recordingPlaceholder: 'Enregistrement en cours... Appuyez à nouveau pour terminer',
    micStartTitle: 'Parler avec le microphone',
    micStopTitle: "Arrêter l'enregistrement",
    sendLabel: 'Envoyer',
    closeLabel: 'Fermer',
    resetLabel: 'Réinitialiser la conversation',
    errorPrefix: 'Désolé, une erreur est survenue :',
    micPermissionError: "Veuillez autoriser l'accès au microphone dans votre navigateur.",
    transcribeErrorPrefix: 'Erreur de transcription :',
    quickPrompts: (target) => [
      {
        label: 'Arbitrer une réponse',
        prompt: `Mon coéquipier a donné une réponse proche pour une carte en ${target}. Comment juger équitablement ?`,
      },
      {
        label: 'Grammaire & Exemples',
        prompt: `Donne-moi une explication courte et claire d'une règle de grammaire essentielle en ${target} avec 3 exemples pratiques.`,
      },
      {
        label: 'Dialogue rapide',
        prompt: `Faisons un court jeu de rôle au restaurant en ${target}. Tu commences !`,
      },
      {
        label: 'Expressions courantes',
        prompt: `Donne-moi 3 expressions idiomatiques populaires en ${target} avec leur sens en français.`,
      },
    ],
  },
  es: {
    title: 'Entrenador IA y Árbitro del Juego',
    subtitle: (target) => `Resuelve dudas de traducción, gramática y práctica interactiva de ${target}`,
    welcome: (target) =>
      `¡Hola! Soy tu Entrenador IA y Árbitro oficial.\nPídeme resolver dudas sobre palabras del juego, analizar gramática o practicar conversación en ${target}. También puedes grabar tu voz con el micrófono.`,
    speedLabel: 'Velocidad del modelo:',
    speedFast: 'Rápido (Flash Lite)',
    speedGeneral: 'General y Chat (3.5 Flash)',
    speedComplex: 'Profundo y Gramática (3.1 Pro)',
    modelLabel: 'Modelo:',
    thinking: 'El Entrenador IA está pensando...',
    transcribing: 'Transcribiendo tu voz con IA...',
    inputPlaceholder: 'Pregunta al Entrenador IA o pide arbitrar una traducción...',
    recordingPlaceholder: 'Grabando tu voz... Toca de nuevo para terminar',
    micStartTitle: 'Hablar con micrófono',
    micStopTitle: 'Detener grabación',
    sendLabel: 'Enviar',
    closeLabel: 'Cerrar',
    resetLabel: 'Reiniciar chat',
    errorPrefix: 'Lo sentimos, ocurrió un error:',
    micPermissionError: 'Por favor permite el acceso al micrófono en tu navegador.',
    transcribeErrorPrefix: 'Error de transcripción:',
    quickPrompts: (target) => [
      {
        label: 'Arbitrar respuesta',
        prompt: `En la ronda, mi compañero dijo una respuesta parecida para una tarjeta en ${target}. ¿Cómo decidimos si es válida?`,
      },
      {
        label: 'Gramática y Ejemplos',
        prompt: `Dame una explicación breve y clara de una estructura gramatical importante en ${target} con 3 ejemplos prácticos.`,
      },
      {
        label: 'Conversación corta',
        prompt: `Practiquemos un diálogo corto pidiendo comida en un restaurante en ${target}. ¡Tú empiezas!`,
      },
      {
        label: 'Modismos cotidianos',
        prompt: `Dime 3 expresiones coloquiales muy usadas en ${target} con su significado en español.`,
      },
    ],
  },
  ar: {
    title: 'المدرب الذكي وحكم اللعبة',
    subtitle: (target) => `الفصل في الترجمات، تحليل القواعد والتدريب التفاعلي للغة ${target}`,
    welcome: (target) =>
      `مرحباً! أنا المدرب الذكي والحكم الرسمي للعبة.\nيمكنك الاستعانة بي للفصل في تخمين الكلمات، شرح القواعد، أو ممارسة المحادثة باللغة ${target}. يمكنك أيضاً الضغط على زر الميكروفون لتسجيل صوتك.`,
    speedLabel: 'سرعة ودقة النموذج:',
    speedFast: 'سريع (Flash Lite)',
    speedGeneral: 'عام ومحادثة (3.5 Flash)',
    speedComplex: 'عميق وقواعد (3.1 Pro)',
    modelLabel: 'النموذج:',
    thinking: 'المدرب الذكي يفكر ويكتب الإجابة...',
    transcribing: 'جاري تحويل صوتك إلى نص بالذكاء الاصطناعي...',
    inputPlaceholder: 'اسأل المدرب الذكي أو اطلب تحكيم ترجمة...',
    recordingPlaceholder: 'جاري تسجيل صوتك... اضغط مرة أخرى للإنهاء',
    micStartTitle: 'التحدث بالميكروفون',
    micStopTitle: 'إيقاف التسجيل',
    sendLabel: 'إرسال',
    closeLabel: 'إغلاق',
    resetLabel: 'إعادة ضبط المحادثة',
    errorPrefix: 'عذراً، حدث خطأ أثناء جلب الرد:',
    micPermissionError: 'يرجى السماح بالوصول إلى الميكروفون في المتصفح.',
    transcribeErrorPrefix: 'خطأ في تحويل الصوت إلى نص:',
    quickPrompts: (target) => [
      {
        label: 'تحكيم إجابة باللعبة',
        prompt: `في جولة اللعب، قال زميلي إجابة قريبة للكلمة باللغة ${target}. كيف نحكم بإنصاف؟`,
      },
      {
        label: 'شرح قواعد وأمثلة',
        prompt: `أعطني شرحاً مبسطاً لقاعدة مهمة في اللغة ${target} مع 3 أمثلة عملية.`,
      },
      {
        label: 'محادثة تدريبية قصيرة',
        prompt: `لنتدرب على حوار قصير لطلب الطعام في مطعم باللغة ${target}. ابدأ أنت!`,
      },
      {
        label: 'تعابير شائعة',
        prompt: `اذكر لي 3 تعابير يومية شائعة في اللغة ${target} مع معناها بالعربية.`,
      },
    ],
  },
  tr: {
    title: 'Yapay Zeka Koçu ve Oyun Hakemi',
    subtitle: (target) => `Çeviri hakemliği, dilbilgisi analizi ve interaktif ${target} pratiği`,
    welcome: (target) =>
      `Merhaba! Ben resmi Yapay Zeka Koçunuz ve Oyun Hakeminizim.\nKelime tahmin anlaşmazlıklarını çözmek, dilbilgisi kurallarını öğrenmek veya ${target} konuşma pratiği yapmak için bana sorabilirsiniz. Mikrofon düğmesiyle sesinizi de kaydedebilirsiniz.`,
    speedLabel: 'Model Hızı ve Derinliği:',
    speedFast: 'Hızlı (Flash Lite)',
    speedGeneral: 'Genel ve Sohbet (3.5 Flash)',
    speedComplex: 'Derin ve Dilbilgisi (3.1 Pro)',
    modelLabel: 'Model:',
    thinking: 'Yapay Zeka Koçu düşünüyor...',
    transcribing: 'Sesiniz yazıya dönüştürülüyor...',
    inputPlaceholder: 'Yapay Zeka Koçuna sorun veya bir cevabı hakemliğe sunun...',
    recordingPlaceholder: 'Sesiniz kaydediliyor... Bitirmek için tekrar dokunun',
    micStartTitle: 'Mikrofonla konuş',
    micStopTitle: 'Kaydı durdur',
    sendLabel: 'Gönder',
    closeLabel: 'Kapat',
    resetLabel: 'Sohbeti sıfırla',
    errorPrefix: 'Üzgünüz, yanıt alınırken bir hata oluştu:',
    micPermissionError: 'Lütfen tarayıcınızda mikrofon izni verin.',
    transcribeErrorPrefix: 'Ses dönüştürme hatası:',
    quickPrompts: (target) => [
      {
        label: 'Oyun Cevabını Hakemle',
        prompt: `Oyun turunda takım arkadaşım ${target} kartı için yakın bir cevap verdi. Bunu adilce nasıl değerlendirelim?`,
      },
      {
        label: 'Dilbilgisi ve Örnekler',
        prompt: `${target} dilinde önemli bir dilbilgisi kuralını 3 pratik örnekle kısaca açıkla.`,
      },
      {
        label: 'Kısa Diyalog Pratiği',
        prompt: `${target} dilinde restoranda yemek siparişi verme üzerine kısa bir diyalog yapalım. Sen başla!`,
      },
      {
        label: 'Günlük Deyimler',
        prompt: `${target} dilinde en sık kullanılan 3 havalı günlük deyimi Türkçe anlamlarıyla paylaş.`,
      },
    ],
  },
};

function findLanguageInfo(rawCodeOrName: string) {
  if (!rawCodeOrName) return undefined;
  const trimmed = rawCodeOrName.trim().toLowerCase();
  return (
    SUPPORTED_LANGUAGES.find((l) => l.code.toLowerCase() === trimmed) ||
    SUPPORTED_LANGUAGES.find((l) => l.name.toLowerCase() === trimmed) ||
    SUPPORTED_LANGUAGES.find((l) => l.persianName === rawCodeOrName.trim()) ||
    (trimmed === 'english' ? SUPPORTED_LANGUAGES.find((l) => l.code === 'en-US') : undefined) ||
    (trimmed === 'persian' ? SUPPORTED_LANGUAGES.find((l) => l.code === 'fa') : undefined)
  );
}

function resolveUiLangKey(uiLanguage?: string, guideLanguage?: string, isRTL?: boolean): string {
  const candidate = uiLanguage || guideLanguage || (isRTL ? 'fa' : 'en');
  const info = findLanguageInfo(candidate);
  const code = info ? info.code : candidate.toLowerCase();
  if (code === 'en-us' || code === 'en-gb' || code === 'en') return 'en';
  if (COACH_LOCALES[code]) return code;
  return isRtlLang(code) ? 'fa' : 'en';
}

function getLocalizedLanguageDisplayName(rawLang: string, uiLangKey: string): string {
  const info = findLanguageInfo(rawLang);
  if (!info) return rawLang;
  if (uiLangKey === 'fa') {
    return info.persianName;
  }
  return info.name.replace(' (Beta - Limited)', '');
}

function getEnglishLanguageNameForPrompt(rawLang: string, fallback: string): string {
  const info = findLanguageInfo(rawLang);
  if (!info) return rawLang || fallback;
  return info.name.replace(' (Beta - Limited)', '');
}

export const AICoachChatModal: React.FC<AICoachChatModalProps> = ({
  isOpen,
  onClose,
  learningLanguage = 'English',
  guideLanguage = 'Persian',
  uiLanguage,
  isRTL,
}) => {
  const uiLangKey = useMemo(
    () => resolveUiLangKey(uiLanguage, guideLanguage, isRTL),
    [uiLanguage, guideLanguage, isRTL]
  );

  const effectiveIsRTL = useMemo(
    () => (typeof isRTL === 'boolean' ? isRTL : isRtlLang(uiLanguage || uiLangKey)),
    [isRTL, uiLanguage, uiLangKey]
  );

  const copy = COACH_LOCALES[uiLangKey] || COACH_LOCALES.en;

  const learningLangDisplay = useMemo(
    () => getLocalizedLanguageDisplayName(learningLanguage, uiLangKey),
    [learningLanguage, uiLangKey]
  );

  const learningLangForAPI = useMemo(
    () => getEnglishLanguageNameForPrompt(learningLanguage, 'English'),
    [learningLanguage]
  );

  const guideLangForAPI = useMemo(
    () => getEnglishLanguageNameForPrompt(uiLanguage || guideLanguage, effectiveIsRTL ? 'Persian' : 'English'),
    [uiLanguage, guideLanguage, effectiveIsRTL]
  );

  const welcomeText = useMemo(
    () => copy.welcome(learningLangDisplay),
    [copy, learningLangDisplay]
  );

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-1',
      role: 'assistant',
      content: welcomeText,
      timestamp: Date.now(),
      modelUsed: 'gemini-3.5-flash',
    },
  ]);

  // Keep the welcome message synchronized with the app's UI language and target language
  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) => (m.id === 'welcome-1' ? { ...m, content: welcomeText } : m))
    );
  }, [welcomeText]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [taskType, setTaskType] = useState<'fast' | 'general' | 'complex'>('general');
  const [inlineError, setInlineError] = useState<string | null>(null);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recorderRef = useRef<AudioRecorder | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleResetChat = () => {
    sound.playClick();
    setInlineError(null);
    setMessages([
      {
        id: 'welcome-1',
        role: 'assistant',
        content: welcomeText,
        timestamp: Date.now(),
        modelUsed: 'gemini-3.5-flash',
      },
    ]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || input).trim();
    if (!content || loading) return;

    sound.playClick();
    setInlineError(null);
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      // Send conversation history to server-side Gemini chat
      const formattedHistory = newHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await chatWithGemini(
        formattedHistory,
        taskType,
        learningLangForAPI,
        guideLangForAPI
      );

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: res.text,
        timestamp: Date.now(),
        modelUsed: res.model,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      sound.playSuccess();
    } catch (err: any) {
      sound.playError();
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `${copy.errorPrefix} ${err.message || ''}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Microphone toggle & audio transcription via gemini-3.5-transcribe
  const handleToggleRecording = async () => {
    setInlineError(null);
    if (isRecording) {
      // Stop recording and transcribe
      if (!recorderRef.current) return;
      setIsRecording(false);
      setIsTranscribing(true);
      sound.playClick();

      try {
        const audioBlob = await recorderRef.current.stop();
        const transcribedText = await transcribeAudioBlob(audioBlob, learningLangForAPI);
        if (transcribedText) {
          setInput((prev) => (prev ? `${prev} ${transcribedText}` : transcribedText));
          sound.playSuccess();
        }
      } catch (err: any) {
        console.error('Audio transcription error:', err);
        sound.playError();
        setInlineError(`${copy.transcribeErrorPrefix} ${err.message || ''}`);
      } finally {
        setIsTranscribing(false);
      }
    } else {
      // Start recording
      sound.playClick();
      try {
        recorderRef.current = new AudioRecorder();
        await recorderRef.current.start();
        setIsRecording(true);
      } catch (err: any) {
        console.error('Mic access error:', err);
        sound.playError();
        setInlineError(copy.micPermissionError);
      }
    }
  };

  const quickPrompts = copy.quickPrompts(learningLangDisplay, guideLangForAPI);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-md animate-fade-in"
      dir={effectiveIsRTL ? 'rtl' : 'ltr'}
      onClick={() => {
        sound.playClick();
        onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl h-[86dvh] max-h-[720px] flex flex-col bg-[var(--panel)] border border-[var(--line)] rounded-[24px] shadow-2xl overflow-hidden text-[var(--ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[var(--panel)] border-b border-[var(--line)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--saffron)]/15 border border-[var(--saffron)]/30 flex items-center justify-center text-[var(--saffron)] shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-[var(--ink)] truncate">
                  {copy.title}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--saffron)]/15 text-[var(--saffron)] border border-[var(--saffron)]/30 shrink-0">
                  Gemini AI
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted)] truncate">
                {copy.subtitle(learningLangDisplay)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {messages.length > 1 && (
              <button
                type="button"
                onClick={handleResetChat}
                className="w-8 h-8 rounded-full bg-[var(--bg)] hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-[var(--line)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                title={copy.resetLabel}
                aria-label={copy.resetLabel}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-[var(--bg)] hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-[var(--line)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
              aria-label={copy.closeLabel}
              title={copy.closeLabel}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Model Speed Tabs */}
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg)] border-b border-[var(--line)] text-xs shrink-0 gap-2">
          <span className="text-[var(--muted)] text-[11px] font-bold hidden sm:inline shrink-0">
            {copy.speedLabel}
          </span>
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-start overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setTaskType('fast');
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all shrink-0 cursor-pointer border ${
                taskType === 'fast'
                  ? 'bg-[var(--turq)] text-white border-[var(--turq)] shadow-sm'
                  : 'bg-[var(--panel)] text-[var(--muted)] border-[var(--line)] hover:text-[var(--ink)]'
              }`}
            >
              <Zap className="w-3 h-3" />
              {copy.speedFast}
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setTaskType('general');
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all shrink-0 cursor-pointer border ${
                taskType === 'general'
                  ? 'bg-[var(--lapis)] text-white border-[var(--lapis)] shadow-sm'
                  : 'bg-[var(--panel)] text-[var(--muted)] border-[var(--line)] hover:text-[var(--ink)]'
              }`}
            >
              <Brain className="w-3 h-3" />
              {copy.speedGeneral}
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setTaskType('complex');
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-all shrink-0 cursor-pointer border ${
                taskType === 'complex'
                  ? 'bg-[var(--saffron)] text-white border-[var(--saffron)] shadow-sm'
                  : 'bg-[var(--panel)] text-[var(--muted)] border-[var(--line)] hover:text-[var(--ink)]'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              {copy.speedComplex}
            </button>
          </div>
        </div>

        {/* Inline Error Notification */}
        {inlineError && (
          <div className="px-4 py-2 bg-rose-500/10 border-b border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{inlineError}</span>
            </div>
            <button
              type="button"
              onClick={() => setInlineError(null)}
              className="p-1 rounded-lg hover:bg-rose-500/10 cursor-pointer"
              aria-label={copy.closeLabel}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Scrollable Conversation Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[var(--bg)]/50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-[var(--saffron)]/15 border border-[var(--saffron)]/30 flex items-center justify-center text-[var(--saffron)] shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-sm text-start ${
                  m.role === 'user'
                    ? 'bg-[var(--lapis)] text-white rounded-ee-none'
                    : 'bg-[var(--panel)] text-[var(--ink)] rounded-es-none border border-[var(--line)]'
                }`}
              >
                {m.content}
                {m.modelUsed && (
                  <div className={`mt-2 pt-1.5 border-t flex items-center justify-between text-[10px] gap-3 ${
                    m.role === 'user' ? 'border-white/20 text-white/70' : 'border-[var(--line)] text-[var(--muted)]'
                  }`}>
                    <span>
                      {copy.modelLabel} {m.modelUsed}
                    </span>
                    <span>
                      {new Date(m.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </div>

              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-[var(--lapis)]/15 border border-[var(--lapis)]/30 flex items-center justify-center text-[var(--lapis)] shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5 justify-start animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-[var(--saffron)]/15 border border-[var(--saffron)]/30 flex items-center justify-center text-[var(--saffron)] shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-[var(--panel)] border border-[var(--line)] text-xs text-[var(--muted)] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--saffron)] animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-[var(--saffron)] animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-[var(--saffron)] animate-bounce [animation-delay:0.4s]" />
                <span>{copy.thinking}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3.5 py-2.5 bg-[var(--panel)] border-t border-[var(--line)] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(qp.prompt)}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-[var(--bg)] hover:bg-[var(--lapis)]/10 hover:text-[var(--lapis)] hover:border-[var(--lapis)]/30 text-[11px] font-bold text-[var(--ink)] border border-[var(--line)] transition-all cursor-pointer"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Transcribing Indicator */}
        {isTranscribing && (
          <div className="px-4 py-1.5 bg-[var(--turq)]/10 text-[var(--turq)] text-xs font-bold flex items-center justify-center gap-2 border-t border-[var(--turq)]/20 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            {copy.transcribing}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 bg-[var(--panel)] border-t border-[var(--line)] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Microphone Button */}
            <button
              type="button"
              onClick={handleToggleRecording}
              disabled={loading || isTranscribing}
              title={isRecording ? copy.micStopTitle : copy.micStartTitle}
              aria-label={isRecording ? copy.micStopTitle : copy.micStartTitle}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer border ${
                isRecording
                  ? 'bg-rose-600 text-white border-rose-600 animate-pulse ring-4 ring-rose-600/25'
                  : 'bg-[var(--bg)] hover:bg-slate-200/70 dark:hover:bg-slate-800 text-[var(--muted)] hover:text-[var(--ink)] border-[var(--line)]'
              }`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isRecording ? copy.recordingPlaceholder : copy.inputPlaceholder}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] text-xs sm:text-sm focus:border-[var(--lapis)] outline-none transition-colors"
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-[var(--lapis)] text-white font-bold hover:brightness-110 disabled:opacity-40 transition-all shadow-sm flex items-center justify-center cursor-pointer"
              aria-label={copy.sendLabel}
              title={copy.sendLabel}
            >
              <Send className={`w-5 h-5 ${effectiveIsRTL ? 'rotate-180' : ''}`} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

