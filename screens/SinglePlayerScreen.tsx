import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Language, 
  LanguageCard, 
  SinglePlayerSettings, 
  SinglePlayerCardResult, 
  SinglePlayerSessionReport,
  SinglePlayerDisplayMode,
  CEFRLevel 
} from '../types';
import { sound } from '../soundManager';
import { tUI, isRtlLang } from '../ui';
import { FlagIcon } from '../components/FlagIcon';
import { SUPPORTED_LANGUAGES } from '../constants';
import { evaluateAnswer, EvaluationResult } from '../answerEvaluator';
import { markCardsAsSeen, saveWeakCards, getPersonalRecords, updatePersonalRecords, getUniqueCardsForSession } from '../contentEngine';
import { recordMistake, recordMistakeSuccess } from '../mistakeReviewService';
import { feedbackDirector } from '../feedbackDirector';
import { SoundHeaderButton } from '../components/SoundHeaderButton';
import ExitConfirmModal from '../components/ExitConfirmModal';
import { PracticeTourModal } from '../components/PracticeTourModal';
import { generateChallengingReflexOptions } from '../utils/testQuestionEngine';
import { getPronunciationHint } from '../pronunciationService';
import { 
  Mic, 
  MicOff, 
  Square,
  Loader2,
  Volume2, 
  Volume1,
  VolumeX, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ArrowRight, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Flame, 
  Settings2, 
  Headphones, 
  FileText,
  AlertTriangle,
  Trophy,
  ShieldAlert,
  X,
  Languages,
  ArrowRightLeft,
  Lightbulb,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  KeyRound,
  Target,
  Zap,
  BookOpen,
  Layers,
  Clock,
  SkipForward,
  PenTool,
  Award,
  Star,
  Pause
} from 'lucide-react';
import { transcribeAudioBlob, AudioRecorder } from '../geminiService';

interface Props {
  initialCards: LanguageCard[];
  initialSettings: SinglePlayerSettings;
  uiLanguage: Language;
  onFinish: (report: SinglePlayerSessionReport) => void;
  onExit: () => void;
  onExitHome?: () => void;
  onExitSetup?: () => void;
  onOpenLeaderboard?: () => void;
}

// BCP-47 Speech recognition language code mapping
const SPEECH_LANG_MAP: Record<string, string> = {
  'en': 'en-GB',
  'en-US': 'en-US',
  'nl': 'nl-NL',
  'de': 'de-DE',
  'fr': 'fr-FR',
  'es': 'es-ES',
  'it': 'it-IT',
  'fa': 'fa-IR',
  'ar': 'ar-SA',
  'tr': 'tr-TR',
  'pl': 'pl-PL',
  'uk': 'uk-UA',
  'pt': 'pt-PT',
  'zh': 'zh-CN',
  'ja': 'ja-JP',
  'ko': 'ko-KR',
  'hi': 'hi-IN'
};

// Convert numbers to Persian digits if in RTL/Persian
const toPersian = (n: number | string, isRTL: boolean) => {
  const str = String(n);
  if (!isRTL) return str;
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/\d/g, (d) => persianDigits[Number(d)] ?? d);
};

const SinglePlayerScreen: React.FC<Props> = ({
  initialCards,
  initialSettings,
  uiLanguage,
  onFinish,
  onExit,
  onExitHome,
  onExitSetup,
  onOpenLeaderboard
}) => {
  const t = tUI(uiLanguage);
  const isRTL = isRtlLang(uiLanguage);

  const [cards, setCards] = useState<LanguageCard[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [settings, setSettings] = useState<SinglePlayerSettings>(initialSettings);
  
  // Input State & Mode Switcher (Speech vs Text)
  const [userInput, setUserInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [inputMode, setInputMode] = useState<'speech' | 'text'>('text');
  const textInputRef = useRef<HTMLInputElement | null>(null);

  // Random Lightbulb Hint State
  const [randomHintMessage, setRandomHintMessage] = useState<string | null>(null);
  const [showRandomHint, setShowRandomHint] = useState<boolean>(false);
  
  // Microphone Permission Request & Interactive Troubleshooter State
  const [showMicPermissionModal, setShowMicPermissionModal] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
  const [micErrorReason, setMicErrorReason] = useState<'denied' | 'no_device' | 'in_use' | 'iframe_blocked' | null>(null);
  const [micTestSuccess, setMicTestSuccess] = useState(false);
  const [copiedDirectUrl, setCopiedDirectUrl] = useState(false);
  const [showQuickChoicesFallback, setShowQuickChoicesFallback] = useState(false);
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const [actionableError, setActionableError] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  // Game progress & evaluation state
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [attempts, setAttempts] = useState(1);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showHintSection, setShowHintSection] = useState(false);
  const [revealedLettersCount, setRevealedLettersCount] = useState(1);
  const [results, setResults] = useState<SinglePlayerCardResult[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // Skipped card educational review state (shows correct answer before moving to next card)
  const [skippedCardInfo, setSkippedCardInfo] = useState<{
    card: LanguageCard;
    targetText: string;
    translation: string;
    pronunciation?: string;
    grammarPoint?: string;
    hint?: string;
  } | null>(null);

  // Delightful focus & ergonomic learning controls
  const [isZenMode, setIsZenMode] = useState<boolean>(initialSettings.zenMode || false);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(initialSettings.autoAdvance || false);
  const autoAdvanceTimerRef = useRef<number | null>(null);

  // User Onboarding Tour & Progressive Disclosure States (Anti-Cognitive Overload)
  const [showTourModal, setShowTourModal] = useState<boolean>(false);
  const [showMoreDetails, setShowMoreDetails] = useState<boolean>(false);
  const [showSkippedDetails, setShowSkippedDetails] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Initial mount: Silence BGM during study and check if onboarding tour is needed
  useEffect(() => {
    sound.stopBGM();
    try {
      const tourSeen = localStorage.getItem('dor_practice_tour_seen');
      if (!tourSeen) {
        setShowTourModal(true);
      }
    } catch {}
  }, []);

  // Active Recall & Options State
  const [revealedOptions, setRevealedOptions] = useState<boolean>(initialSettings.hideOptionsByDefault !== true);
  const [activeHintType, setActiveHintType] = useState<'none' | 'letters' | 'word' | 'options' | 'audio'>('none');

  // Timed Match vs Fixed Card Count
  const isTimedMatch = settings.matchMode === 'timed_match' || (settings.totalMatchSeconds || 0) > 0;
  const initialMatchSeconds = settings.totalMatchSeconds || (settings.matchMode === 'timed_match' ? 60 : 0);
  const [matchRemainingSeconds, setMatchRemainingSeconds] = useState<number>(initialMatchSeconds);
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState<number>(0);
  const sessionStartTimeRef = useRef<number>(Date.now());
  const matchTimerRef = useRef<number | null>(null);
  const resultsRef = useRef<SinglePlayerCardResult[]>(results);
  resultsRef.current = results;
  const isFinishedRef = useRef<boolean>(false);

  // Smart Voice Input & Audio Transcription State (Manual start & stop for clear voice-to-text)
  const [isTranscribingWithGemini, setIsTranscribingWithGemini] = useState(false);
  const [isGeminiRecording, setIsGeminiRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const geminiRecorderRef = useRef<AudioRecorder | null>(null);
  const recordingTimerRef = useRef<number | null>(null);

  // Untimed relaxed study for cards (user has unlimited time per card in single-player card mode)
  const startTimeRef = useRef<number>(Date.now());
  const recognitionRef = useRef<any>(null);
  const isUserSpeakingRef = useRef<boolean>(false);
  const liveTranscriptRef = useRef<string>('');

  // Personal Records
  const [personalRecords] = useState(getPersonalRecords());
  const fastestAnswerRef = useRef<number>(999);
  const [isNewRecordAlert, setIsNewRecordAlert] = useState(false);

  const currentCard: LanguageCard | undefined = cards[currentIndex];

  // Keep settings in sync when initialSettings changes
  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);



  // 4 Smart multiple-choice options powered by pedagogical test question engine
  const quickQuizOptions = useMemo(() => {
    if (!currentCard) return [];
    const targetLang = settings.displayMode === 'translate_to_native'
      ? (currentCard.nativeLanguage || settings.nativeLanguage || (isRTL ? 'fa' : 'en'))
      : (currentCard.targetLanguage || settings.targetLanguage || 'en');
    return generateChallengingReflexOptions(currentCard, cards, targetLang);
  }, [currentCard, cards, settings.displayMode, settings.nativeLanguage, settings.targetLanguage, isRTL]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      const isReverseToNative = settings.displayMode === 'translate_to_native';
      const nativeCode = currentCard?.nativeLanguage || settings.nativeLanguage || (isRTL ? 'fa' : 'en');
      const nativeInfo = SUPPORTED_LANGUAGES.find(l => l.code === nativeCode);
      const targetLang = currentCard?.targetLanguage || settings.targetLanguage || 'en';
      const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === targetLang);

      const langCode = isReverseToNative
        ? (nativeInfo?.speechCode || SPEECH_LANG_MAP[nativeCode] || (nativeCode === 'fa' ? 'fa-IR' : 'en-US'))
        : (langInfo?.speechCode || SPEECH_LANG_MAP[targetLang] || 'en-US');
      recognition.lang = langCode;

      recognition.onstart = () => {
        setIsListening(true);
        setActionableError(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        const clean = transcript.trim();
        if (clean) {
          liveTranscriptRef.current = clean;
          setUserInput(clean);
          setActionableError(null);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        // Never overwrite AudioRecorder (getUserMedia) or show false iframe errors if MediaDevices is available
        if (geminiRecorderRef.current?.isRecording() || (typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia)) {
          return;
        }
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setIsListening(false);
          isUserSpeakingRef.current = false;
          const inIframe = typeof window !== 'undefined' && window.self !== window.top;
          setMicErrorReason(inIframe ? 'iframe_blocked' : 'denied');
          setActionableError(
            isRTL
              ? 'دسترسی به میکروفون مسدود است. از آیکون کنار آدرس مرورگر، میکروفون را Allow کنید و صفحه را رفرش نمایید.'
              : 'Microphone access is blocked. Allow microphone in your browser address bar and reload.'
          );
        }
      };

      recognition.onend = () => {
        // Keep listening state active if AudioRecorder is still recording
        if (geminiRecorderRef.current?.isRecording()) {
          return;
        }
        setIsListening(false);
        isUserSpeakingRef.current = false;
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Could not start speech recognition:', e);
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [currentCard?.targetLanguage, settings.targetLanguage]);

  // Handle Card Setup & Audio (Cards are untimed in single-player card mode)
  useEffect(() => {
    if (!currentCard) return;

    if (geminiRecorderRef.current) {
      geminiRecorderRef.current.cancel();
      geminiRecorderRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setRecordingSeconds(0);
    setIsListening(false);
    setIsGeminiRecording(false);
    setIsTranscribingWithGemini(false);

    setUserInput('');
    setEvaluation(null);
    setAttempts(1);
    setIsRevealed(false);
    setSkippedCardInfo(null);
    setShowHintSection(false);
    setShowRandomHint(false);
    setRandomHintMessage(null);
    setRevealedOptions(settings.hideOptionsByDefault !== true);
    setActiveHintType('none');
    setRevealedLettersCount(1);
    setShowMoreDetails(false);
    setShowSkippedDetails(false);
    setIsPlayingAudio(false);
    startTimeRef.current = Date.now();

    // In single-player card game, cards are relaxed and untimed (no countdown expiring cards)

    // Preload card audio into memory cache so clicking Play Audio / Slow is instant
    sound.preloadTTS(currentCard.targetText, currentCard.targetLanguage);

    // Audio is an on-demand hint in translation/reading modes.
    // Only in audio_only mode (where text is hidden for listening challenge) does it play automatically.
    if (settings.displayMode === 'audio_only') {
      sound.speakNative(currentCard.targetText, currentCard.targetLanguage);
    }

  }, [currentIndex, currentCard?.id, settings.displayMode, settings.hideOptionsByDefault]);

  // Global Timed Match Session Countdown Timer
  useEffect(() => {
    if (!isTimedMatch) return;
    isFinishedRef.current = false;

    matchTimerRef.current = window.setInterval(() => {
      setMatchRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(matchTimerRef.current!);
          if (!isFinishedRef.current) {
            isFinishedRef.current = true;
            sound.playRoundEnd();
            finishSession(resultsRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (matchTimerRef.current) clearInterval(matchTimerRef.current);
    };
  }, [isTimedMatch]);

  // Stopwatch timer for Fixed Card Count mode
  useEffect(() => {
    if (isTimedMatch) return;
    const interval = window.setInterval(() => {
      setSessionElapsedSeconds(Math.max(1, Math.round((Date.now() - sessionStartTimeRef.current) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimedMatch]);

  const stopMicAndTranscribeToInput = async (shouldSubmitAfter = false) => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setRecordingSeconds(0);
    isUserSpeakingRef.current = false;
    setIsListening(false);
    setIsGeminiRecording(false);

    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }

    if (geminiRecorderRef.current) {
      const recorder = geminiRecorderRef.current;
      geminiRecorderRef.current = null;

      setIsTranscribingWithGemini(true);
      try {
        const audioBlob = await recorder.stop();
        if (audioBlob && audioBlob.size > 50) {
          const isReverseToNative = settings.displayMode === 'translate_to_native';
          const targetLang = isReverseToNative
            ? (currentCard?.nativeLanguage || settings.nativeLanguage || (isRTL ? 'fa' : 'en'))
            : (currentCard?.targetLanguage || settings.targetLanguage || 'en');
          const contextHint = isReverseToNative ? currentCard?.translation : currentCard?.targetText;

          const transcribed = await transcribeAudioBlob(audioBlob, targetLang, contextHint);
          if (transcribed && transcribed.trim()) {
            const cleanText = transcribed.trim();
            liveTranscriptRef.current = cleanText;
            setUserInput(cleanText);
            setActionableError(null);
            sound.playClick();
            if (shouldSubmitAfter) {
              submitAnswer(cleanText);
            }
            return;
          }
        }
        setActionableError(
          isRTL
            ? 'صدایی در فایل ضبط‌شده تشخیص داده نشد. لطفاً نزدیک‌تر به میکروفون صحبت کرده و دوباره «پایان ضبط» را بزنید، یا پاسخ را تایپ نمایید.'
            : 'No clear speech detected in recorded audio. Please speak closer to the microphone and tap Stop Recording again, or type your answer.'
        );
      } catch (err: any) {
        console.warn('Gemini audio transcribe fallback:', err);
        setActionableError(
          isRTL
            ? 'خطا در تبدیل فایل صوتی به متن. لطفاً دوباره روی «شروع ضبط» بزنید یا پاسخ را تایپ کنید.'
            : 'Error transcribing audio. Please tap Start Recording again or type your answer.'
        );
      } finally {
        setIsTranscribingWithGemini(false);
      }
    }
  };

  const toggleListening = async () => {
    sound.playClick();

    if (isListening || isGeminiRecording || isUserSpeakingRef.current) {
      // User manually stopped recording: transcribe the captured audio file
      await stopMicAndTranscribeToInput(false);
    } else {
      // User manually starts recording: records continuously until user taps "پایان ضبط"
      liveTranscriptRef.current = '';
      setUserInput('');
      setActionableError(null);
      setRecordingSeconds(0);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      let recorderStarted = false;
      let caughtErrorName = '';
      try {
        if (geminiRecorderRef.current) {
          geminiRecorderRef.current.cancel();
        }
        const recorder = new AudioRecorder();
        // Start recording WITHOUT automatic silence detection cutoff so user controls when to stop
        await recorder.start();
        geminiRecorderRef.current = recorder;
        recorderStarted = true;
        isUserSpeakingRef.current = true;
        setIsGeminiRecording(true);
        setIsListening(true);
        setActionableError(null);
        setMicErrorReason(null);

        // Start elapsed duration timer
        recordingTimerRef.current = window.setInterval(() => {
          setRecordingSeconds(prev => prev + 1);
        }, 1000);
      } catch (err: any) {
        console.warn('Audio recorder mic start error:', err);
        caughtErrorName = `${err?.name || ''} ${err?.message || ''}`;
        geminiRecorderRef.current = null;
      }

      if (!recorderStarted) {
        isUserSpeakingRef.current = false;
        setIsListening(false);
        setIsGeminiRecording(false);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }

        const inIframe = typeof window !== 'undefined' && window.self !== window.top;

        if (caughtErrorName.includes('NotFound') || caughtErrorName.includes('DevicesNotFound')) {
          setMicErrorReason('no_device');
          setActionableError(
            isRTL
              ? 'هیچ میکروفونی روی دستگاه شما شناسایی نشد. میکروفون یا هندزفری را متصل کنید یا پاسخ را تایپ نمایید.'
              : 'No microphone was detected on your device. Connect a microphone or type your answer.'
          );
        } else if (caughtErrorName.includes('NotReadable') || caughtErrorName.includes('TrackStart')) {
          setMicErrorReason('in_use');
          setActionableError(
            isRTL
              ? 'میکروفون در حال حاضر توسط برنامه یا تب دیگری اشغال شده است. برنامه‌های دیگر را ببندید و دوباره تست کنید.'
              : 'Your microphone is currently busy in another app or tab. Close other apps and retry.'
          );
        } else if (inIframe) {
          setMicErrorReason('iframe_blocked');
          setActionableError(
            isRTL
              ? 'پس از روشن کردن میکروفون در مرورگر، یک‌بار روی «بارگذاری مجدد پیش‌نمایش» بزنید یا بازی را با آیکون 🔗 (بالای پیش‌نمایش) در تب جدید باز کنید.'
              : 'After enabling Microphone in Chrome, reload the preview frame or open the app in a new tab via the 🔗 icon above the preview.'
          );
        } else {
          setMicErrorReason('denied');
          setActionableError(
            isRTL
              ? 'دسترسی به میکروفون مسدود است. پس از روشن کردن Microphone در آیکون کنار آدرس مرورگر، یک‌بار صفحه را رفرش کنید.'
              : 'Microphone access is blocked. After enabling Microphone in the browser address bar, reload the page.'
          );
        }
      }
    }
  };

  const handleGrantPermissionAndStart = async () => {
    sound.playClick();
    setIsRequestingMic(true);
    setMicPermissionError(null);
    setMicTestSuccess(false);

    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('NotSupportedError');
      }

      // Acquire stream directly inside the user click gesture and pass it straight to AudioRecorder with VAD!
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      if (geminiRecorderRef.current) {
        geminiRecorderRef.current.cancel();
      }
      const recorder = new AudioRecorder();
      await recorder.start(stream);
      geminiRecorderRef.current = recorder;
      setRecordingSeconds(0);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      if (speechSupported && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {}
      }

      isUserSpeakingRef.current = true;
      setIsGeminiRecording(true);
      setIsListening(true);
      setMicTestSuccess(true);
      setMicErrorReason(null);
      setActionableError(null);
      setMicPermissionError(null);
      setShowMicPermissionModal(false);
      sound.playCorrect();
    } catch (err: any) {
      console.warn('Microphone permission request error:', err);
      const errName = `${err?.name || ''} ${err?.message || ''}`;
      const inIframe = typeof window !== 'undefined' && window.self !== window.top;
      setShowQuickChoicesFallback(true);

      if (errName.includes('NotFound') || errName.includes('DevicesNotFound')) {
        setMicErrorReason('no_device');
        setMicPermissionError(
          isRTL
            ? 'میکروفونی به دستگاه شما متصل نیست یا در تنظیمات ویندوز غیرفعال است.'
            : 'No microphone hardware found or disabled in OS settings.'
        );
      } else if (errName.includes('NotReadable') || errName.includes('TrackStart')) {
        setMicErrorReason('in_use');
        setMicPermissionError(
          isRTL
            ? 'میکروفون توسط برنامه دیگری درگیر است. سایر برنامه‌های صوتی را ببندید.'
            : 'Microphone is busy in another application.'
        );
      } else if (inIframe) {
        setMicErrorReason('iframe_blocked');
        setMicPermissionError(
          isRTL
            ? 'مرورگر کروم دسترسی میکروفون را داخل قاب پیش‌نمایش (Preview) اعمال نکرده است. راه‌حل قطعی: ۱) روی دکمه «بارگذاری مجدد پیش‌نمایش» در پایین بزنید، یا ۲) روی آیکون 🔗 در نوار بالای پیش‌نمایش کلیک کنید تا بازی در تب مستقل باز شود.'
            : 'Chrome has not applied microphone access to the embedded Preview frame yet. Fix: 1) Click "Reload Preview" below, or 2) Click the 🔗 icon at the top of the preview bar to open in a full tab.'
        );
      } else {
        setMicErrorReason('denied');
        setMicPermissionError(
          isRTL 
            ? 'پس از روشن کردن تیک Microphone در نوار آدرس مرورگر، حتماً یک‌بار صفحه را رفرش (F5) کنید تا تغییر اعمال شود.'
            : 'After turning Microphone ON in your browser address bar, please reload the page (F5) to apply the change.'
        );
      }
    } finally {
      setIsRequestingMic(false);
    }
  };

  const handlePlayAudio = () => {
    if (!currentCard) return;
    sound.playClick();
    setIsPlayingAudio(true);
    sound.speakNative(currentCard.targetText, currentCard.targetLanguage, {
      onEnd: () => setIsPlayingAudio(false)
    });
    // Fallback timer to reset playing state
    window.setTimeout(() => setIsPlayingAudio(false), 3000);
  };

  const handlePlaySlowAudio = () => {
    if (!currentCard) return;
    sound.playClick();
    setIsPlayingAudio(true);
    sound.speakSlow(currentCard.targetText, currentCard.targetLanguage, {
      onEnd: () => setIsPlayingAudio(false)
    });
    // Fallback timer to reset playing state
    window.setTimeout(() => setIsPlayingAudio(false), 4500);
  };

  // Keyboard ergonomics for desktop / tablet flow state (1-4 choices, Space audio, S slow, H hint, Z zen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';

      if (isInput) {
        if (e.key === 'Enter') {
          handleCheckAnswer();
        }
        return;
      }

      if (e.key === '1' && quickQuizOptions[0]) {
        submitAnswer(quickQuizOptions[0]);
      } else if (e.key === '2' && quickQuizOptions[1]) {
        submitAnswer(quickQuizOptions[1]);
      } else if (e.key === '3' && quickQuizOptions[2]) {
        submitAnswer(quickQuizOptions[2]);
      } else if (e.key === '4' && quickQuizOptions[3]) {
        submitAnswer(quickQuizOptions[3]);
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handlePlayAudio();
      } else if (e.key.toLowerCase() === 's') {
        handlePlaySlowAudio();
      } else if (e.key.toLowerCase() === 'h') {
        setShowHintSection(prev => !prev);
      } else if (e.key.toLowerCase() === 'z') {
        setIsZenMode(prev => !prev);
      } else if (e.key === 'Enter') {
        if (evaluation?.isCorrect) {
          handleNextCard(false);
        } else if (evaluation && !evaluation.isCorrect) {
          handleTryAgain();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickQuizOptions, evaluation, currentCard, userInput]);

  const submitAnswer = (rawAnswer: string) => {
    if (!currentCard) return;

    const answer = rawAnswer.trim();
    if (!answer) {
      setActionableError(
        isRTL 
          ? 'پاسخی وارد نشده است. راه‌حل: کلمه را در کادر متنی بنویسید، با میکروفون تلفظ کنید یا از سرنخ و حروف کمکی استفاده کنید.'
          : 'No answer provided. Fix: Type your answer, speak using the microphone, or use the letter clues.'
      );
      return;
    }
    setUserInput(answer);
    setActionableError(null);

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    }

    const timeRatio = 1.0;

    const isReverseToNative = settings.displayMode === 'translate_to_native';
    const evalResult = evaluateAnswer(
      currentCard,
      answer,
      attempts,
      timeRatio,
      uiLanguage,
      isReverseToNative ? currentCard.translation : currentCard.targetText
    );

    setEvaluation(evalResult);

    if (evalResult.isCorrect) {
      sound.playCorrect();
      sound.hapticFeedback('success');
      recordMistakeSuccess(currentCard.id);
      const challengeBonus = currentCard.isChallenge ? (currentCard.challengeBonus || 2) : 0;
      const creativeBonus = currentCard.isCreative ? 35 : 0;
      const points = evalResult.pointsAwarded + challengeBonus + creativeBonus;
      const newScore = totalScore + points;
      setTotalScore(newScore);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);

      // Sound feedback for score & streak
      if (newStreak >= 3) {
        sound.playMilestoneGlow();
      } else if (newStreak >= 2) {
        sound.playPowerUp();
      } else {
        sound.playScoreTick(newStreak);
      }

      // --- GAME FEEL LAYERS 1, 2, 3 ---
      feedbackDirector.triggerScoreGained({
        points,
        combo: newStreak,
        label: currentCard.isCreative
          ? `+${points} خلاقانه (${currentCard.cefrLevel})`
          : currentCard.isChallenge 
            ? `+${points} چالش (${currentCard.cefrLevel})` 
            : newStreak > 1 ? `+${points} ×${newStreak} (${currentCard.cefrLevel})` : `+${points} ${t.pointsUnit || (isRTL ? 'امتیاز' : 'PTS')} (${currentCard.cefrLevel})`
      });

      // Record fastest answer time for personal records
      const timeSpent = Math.max(0.5, Math.round(((Date.now() - startTimeRef.current) / 1000) * 10) / 10);
      if (timeSpent < fastestAnswerRef.current) {
        fastestAnswerRef.current = timeSpent;
      }

      // Layer 3: Poetic In-World Fantasy Toast for Milestones & Records (Non-intrusive)
      if (newScore > personalRecords.highestScore && !isNewRecordAlert && personalRecords.highestScore > 0) {
        setIsNewRecordAlert(true);
        feedbackDirector.triggerLeaderboardDelta({
          type: 'personal_best',
          subText: `ثبت رکورد نو: ${newScore} امتیاز`
        });
      } else if (newStreak === 3 || newStreak === 5 || newStreak === 10) {
        feedbackDirector.triggerLeaderboardDelta({
          type: 'threshold',
          subText: `تسلط بر ${newStreak} کلمه پیاپی`
        });
      }

      // Record result
      const resEntry: SinglePlayerCardResult = {
        card: currentCard,
        userAnswer: answer,
        isCorrect: true,
        attempts,
        timeSpentSeconds: timeSpent,
        pointsEarned: points,
        similarityScore: evalResult.similarity,
        aiFeedback: evalResult.feedbackMessage
      };
      setResults(prev => [...prev, resEntry]);

      // Smooth Auto-Advance if enabled (1.15s reading pause before next card)
      if (autoAdvance) {
        if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = window.setTimeout(() => {
          handleNextCard(false);
        }, 1150);
      }
    } else {
      sound.playPass();
      sound.hapticFeedback('error');
      setStreak(0);
      setAttempts(prev => prev + 1);
      // Persist mistake into Mistake Bank for review
      recordMistake(currentCard, answer, 'single_player');
    }
  };

  const handleCheckAnswer = () => {
    if (isListening || isGeminiRecording || isUserSpeakingRef.current) {
      void stopMicAndTranscribeToInput(true);
      return;
    }
    submitAnswer(userInput);
  };

  const handleTryAgain = () => {
    sound.playClick();
    setEvaluation(null);
    setUserInput('');
  };

  const handleTriggerRandomHint = () => {
    if (!currentCard) return;
    sound.playPowerUp();

    const isReverse = settings.displayMode === 'translate_to_native';
    const isReadingMode = settings.displayMode === 'text_and_audio';
    const expectedText = (isReverse ? currentCard.translation : currentCard.targetText || '').trim();
    const words = expectedText.split(/\s+/).filter(Boolean);

    const hintsPool: string[] = [];

    if (!isReadingMode && expectedText) {
      if (words.length >= 2) {
        // Show the first word(s) and mask the rest of the expected answer
        const revealCount = Math.max(1, Math.ceil(words.length / 2));
        const revealedPart = words.slice(0, revealCount).join(' ');
        const hiddenPart = words.slice(revealCount).map(w => '___').join(' ');
        const label = isRTL ? 'شروع پاسخ:' : 'Answer starts with:';
        hintsPool.push(`${label} «${revealedPart} ${hiddenPart}»`);
      } else if (words.length === 1 && words[0].length > 2) {
        const cleanWord = words[0];
        const firstTwo = cleanWord.slice(0, Math.min(2, cleanWord.length - 1));
        const label = isRTL ? 'حروف اول پاسخ:' : 'First letters:';
        hintsPool.push(`${label} «${firstTwo}...» (${cleanWord.length} ${isRTL ? 'حرف' : 'letters'})`);
      }
    }

    // Add phonetic pronunciation hint when user needs to say/type targetText
    if (!isReverse) {
      if (currentCard.pronunciation) {
        const pronLabel = isRTL ? 'راهنمای تلفظ:' : 'Pronunciation:';
        hintsPool.push(`${pronLabel} /${currentCard.pronunciation}/`);
      } else {
        const pron = getPronunciationHint(
          currentCard.targetText,
          currentCard.targetLanguage,
          isRTL ? 'fa' : 'en',
          currentCard.pronunciation
        );
        if (pron) {
          hintsPool.push(pron);
        }
      }
    }

    // In reading/audio modes, also offer meaning if not already shown
    if ((isReadingMode || settings.displayMode === 'audio_only') && currentCard.translation) {
      const meaningLabel = isRTL ? 'معنی عبارت:' : 'Meaning:';
      hintsPool.push(`${meaningLabel} ${currentCard.translation}`);
    }

    if (hintsPool.length === 0) {
      const fallbackText = isReverse ? currentCard.translation : currentCard.targetText;
      const fallbackLabel = isRTL ? 'راهنمایی:' : 'Clue:';
      hintsPool.push(`${fallbackLabel} ${fallbackText.slice(0, Math.max(2, Math.floor(fallbackText.length / 2)))}...`);
    }

    const chosen = hintsPool[Math.floor(Math.random() * hintsPool.length)];
    setRandomHintMessage(chosen);
    setShowRandomHint(true);
  };

  // Skip card: User sees the correct answer first before proceeding to the next card!
  const handleSkip = () => {
    if (!currentCard) return;
    sound.playPass();
    if (isListening || isUserSpeakingRef.current) {
      isUserSpeakingRef.current = false;
      setIsListening(false);
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
    }
    if (geminiRecorderRef.current) {
      try {
        geminiRecorderRef.current.stop();
      } catch {}
      geminiRecorderRef.current = null;
    }
    setIsGeminiRecording(false);
    setShowSkippedDetails(false);
    setSkippedCardInfo({
      card: currentCard,
      targetText: currentCard.targetText,
      translation: currentCard.translation,
      pronunciation: currentCard.pronunciation,
      grammarPoint: currentCard.grammarPoint,
      hint: currentCard.hint
    });
  };

  const handleConfirmSkipAndNext = () => {
    setSkippedCardInfo(null);
    handleNextCard(true);
  };

  const handleNextCard = (skipCurrent: boolean = false) => {
    if (!currentCard) return;
    sound.playClick();

    if (skipCurrent && !evaluation?.isCorrect) {
      // Mark as skipped/failed
      const timeSpent = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
      const resEntry: SinglePlayerCardResult = {
        card: currentCard,
        userAnswer: userInput || '(Skipped)',
        isCorrect: false,
        attempts,
        timeSpentSeconds: timeSpent,
        pointsEarned: 0,
        similarityScore: 0,
        aiFeedback: 'Card skipped'
      };
      setResults(prev => [...prev, resEntry]);

      // Re-queue missed card to repeat later so user masters it (70/30 Pedagogical Rule)
      setCards(prev => [...prev, { ...currentCard }]);
    }

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      if (isTimedMatch && matchRemainingSeconds > 0) {
        // Timed match: dynamically supply more cards so player can keep answering!
        const moreCards = getUniqueCardsForSession(
          settings.targetLanguage,
          settings.nativeLanguage,
          settings.cefrLevel,
          settings.selectedCategories,
          10,
          false
        );
        setCards(prev => [...prev, ...moreCards]);
        setCurrentIndex(prev => prev + 1);
      } else {
        // Finished all cards! Build report
        finishSession([...results, ...(evaluation?.isCorrect ? [] : [{
          card: currentCard,
          userAnswer: userInput,
          isCorrect: evaluation?.isCorrect || false,
          attempts,
          timeSpentSeconds: Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000)),
          pointsEarned: evaluation?.pointsAwarded || 0,
          similarityScore: evaluation?.similarity || 0,
          aiFeedback: evaluation?.feedbackMessage
        }])]);
      }
    }
  };

  const finishSession = (finalResults: SinglePlayerCardResult[]) => {
    const total = finalResults.length;
    const correctFirst = finalResults.filter(r => r.isCorrect && r.attempts === 1).length;
    const corrected = finalResults.filter(r => r.isCorrect && r.attempts > 1).length;
    const failed = finalResults.filter(r => !r.isCorrect).length;
    const accuracy = total > 0 ? Math.round(((correctFirst + corrected) / total) * 100) : 0;

    const weakCards = finalResults.filter(r => !r.isCorrect || r.attempts > 1).map(r => r.card);

    // Save seen cards and weak cards to content engine
    markCardsAsSeen(finalResults.map(r => r.card.id));
    if (weakCards.length > 0) {
      saveWeakCards(weakCards);
    }

    // Persist personal records and update high scores
    updatePersonalRecords({
      score: totalScore,
      accuracy,
      streak: bestStreak,
      answerTimeSeconds: fastestAnswerRef.current < 999 ? fastestAnswerRef.current : 0,
      cardsCount: total,
      roundsCount: 3
    });

    const report: SinglePlayerSessionReport = {
      id: `rep_${Date.now()}`,
      timestamp: new Date().toISOString(),
      settings,
      results: finalResults,
      totalScore,
      totalCards: total,
      correctFirstTry: correctFirst,
      correctedCount: corrected,
      failedCount: failed,
      accuracy,
      bestStreak,
      weakCards,
      totalDurationSeconds: Math.max(1, Math.round((Date.now() - sessionStartTimeRef.current) / 1000))
    };

    onFinish(report);
  };

  if (!currentCard) {
    return (
      <div className="w-full max-w-md mx-auto h-full flex items-center justify-center p-4 text-[var(--ink)] text-center font-ui" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="bg-[var(--panel)] border border-[var(--line)] rounded-[24px] shadow-sm p-6 max-w-sm">
          <p className="font-bold mb-4 text-[var(--mute)]">{isRTL ? 'کارتی برای نمایش وجود ندارد.' : 'No cards available.'}</p>
          <button onClick={onExit} className="py-2.5 px-5 rounded-xl bg-[var(--lapis)] text-[var(--on-lapis)] font-bold text-sm shadow-xs cursor-pointer">
            {isRTL ? 'بازگشت' : 'Back'}
          </button>
        </div>
      </div>
    );
  }

  const isAudioOnly = settings.displayMode === 'audio_only';
  const isReverseToNative = settings.displayMode === 'translate_to_native';
  const expectedAnswerLangCode = isReverseToNative
    ? (currentCard?.nativeLanguage || settings.nativeLanguage || (isRTL ? 'fa' : 'en'))
    : (currentCard?.targetLanguage || settings.targetLanguage || 'en');
  const expectedLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === expectedAnswerLangCode);
  const expectedAnswerLangLabel = isRTL
    ? (expectedLangInfo?.persianName || expectedLangInfo?.name || expectedAnswerLangCode)
    : (expectedLangInfo?.name || expectedAnswerLangCode);

  return (
    <div 
      className="app w-full max-w-lg sm:max-w-xl md:max-w-2xl mx-auto min-h-full flex-1 px-3 sm:px-4 pb-12 font-ui relative flex flex-col justify-between overflow-y-auto overscroll-contain"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* 1. Header (clean, focused: ONLY Stop Game button + progress & score) */}
      <header className="sticky top-0 z-20 bg-[var(--bg)] flex items-center justify-between py-2 px-0.5 border-b border-[var(--line)]/50 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowExitConfirm(true);
            }}
            className="h-9 px-3 rounded-xl border border-[var(--line)] bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer shrink-0 font-extrabold text-xs"
            aria-label={t.pause || (isRTL ? 'توقف بازی' : 'Pause Game')}
            title={t.pause || (isRTL ? 'توقف بازی' : 'Pause Game')}
          >
            <Pause size={15} className="text-[var(--lapis)] shrink-0" />
            <span>{isRTL ? 'توقف بازی' : 'Pause'}</span>
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-black leading-tight text-[var(--ink)] truncate">
              {t.singlePlayer || (isRTL ? 'تمرین تک‌نفره' : 'Practice')}
            </h1>
            <span className="text-[11px] font-bold text-[var(--mute)]">
              {isTimedMatch 
                ? (isRTL 
                    ? `مسابقه زمان‌دار • ${toPersian(results.filter(r => r.isCorrect).length, isRTL)} حل‌شده` 
                    : `Timed Match • ${results.filter(r => r.isCorrect).length} solved`)
                : (isRTL 
                    ? `کارت ${toPersian(currentIndex + 1, isRTL)} از ${toPersian(cards.length, isRTL)}`
                    : `Card ${currentIndex + 1} of ${cards.length}`)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Timed Tournament Clock (Only shown in explicit timed tournament mode) */}
          {isTimedMatch && (
            <div className={`px-2 py-1 rounded-xl border text-[11px] font-black flex items-center gap-1 transition-all ${
              matchRemainingSeconds <= 10 
                ? 'bg-rose-500/20 text-rose-600 border-rose-500/50 animate-pulse' 
                : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40'
            }`}>
              <Clock size={12} className={matchRemainingSeconds <= 10 ? 'animate-spin' : ''} />
              <span className="font-mono">
                {Math.floor(matchRemainingSeconds / 60)}:{(matchRemainingSeconds % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}

          {/* Score Badge */}
          <div 
            key={`score-${totalScore}`}
            className="px-2.5 py-1 rounded-xl bg-[var(--panel)] border border-amber-500/40 text-xs font-black text-[var(--ink)] flex items-center gap-1 shadow-xs"
          >
            <Award size={13} className="text-amber-500" />
            <span className="text-amber-600 dark:text-amber-400 font-extrabold font-ui">{toPersian(totalScore, isRTL)}</span>
          </div>
        </div>
      </header>

      {/* 3. Progress Bar (Sleek, minimal, non-repetitive) */}
      <div className="mt-2 shrink-0">
        {streak > 1 && (
          <div className="flex justify-end mb-1">
            <span className="text-amber-500 font-extrabold text-[11px] flex items-center gap-1">
              <Flame size={12} className="text-amber-500" />
              <span>{toPersian(streak, isRTL)} {isRTL ? 'پیاپی' : 'streak'}</span>
            </span>
          </div>
        )}
        <div className="w-full h-1.5 bg-[var(--line)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--turq)] transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / Math.max(1, cards.length)) * 100}%` }}
          />
        </div>
      </div>

      {/* Actionable Error & Interactive Microphone Helper Banner */}
      {actionableError && (
        <div className="mt-1.5 p-2.5 rounded-2xl bg-[var(--panel)] border border-[var(--danger)]/60 text-[var(--danger)] text-xs font-bold flex flex-col gap-2 text-start leading-relaxed shadow-xs animate-fade-in">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span className="whitespace-normal break-words">{actionableError}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setActionableError(null);
                setMicErrorReason(null);
              }}
              className="text-[var(--danger)]/70 hover:text-[var(--danger)] p-0.5 cursor-pointer shrink-0"
              aria-label={isRTL ? 'بستن' : 'Dismiss'}
            >
              <X size={14} />
            </button>
          </div>

          {/* Interactive Helper Buttons when Microphone fails */}
          {micErrorReason && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[var(--danger)]/20">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  window.location.reload();
                }}
                className="px-2.5 py-1 rounded-xl bg-[var(--lapis)] text-[var(--on-lapis)] text-[11px] font-extrabold flex items-center gap-1 cursor-pointer active:scale-95 transition-all shadow-2xs"
              >
                <RotateCcw size={12} />
                <span>{isRTL ? 'بارگذاری مجدد پیش‌نمایش (اعمال دسترسی)' : 'Reload Preview (Apply Permission)'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setMicPermissionError(null);
                  setShowMicPermissionModal(true);
                }}
                className="px-2.5 py-1 rounded-xl bg-[var(--bg)] hover:bg-[var(--lapis-soft)] text-[var(--ink)] border border-[var(--line)] text-[11px] font-extrabold flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
              >
                <Settings2 size={12} />
                <span>{isRTL ? 'راهنمای کامل و لینک مستقیم' : 'Full Guide & Direct Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleGrantPermissionAndStart}
                disabled={isRequestingMic}
                className="px-2.5 py-1 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-[var(--turq)] border border-teal-500/30 text-[11px] font-extrabold flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
              >
                <Mic size={12} className={isRequestingMic ? 'animate-pulse' : ''} />
                <span>{isRequestingMic ? (isRTL ? 'در حال تست...' : 'Testing...') : (isRTL ? 'تست مجدد میکروفون' : 'Retry Mic')}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. Center Interactive Flashcard in .panel style */}
      <div className="panel my-1.5 flex-1 flex flex-col justify-between relative !p-3.5 sm:!p-4">
        {/* Top of card: Clear instruction badge & smart clue button */}
        <div className="flex items-center justify-between mb-1.5 min-h-[28px]">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[var(--lapis-soft)] text-[var(--lapis)] text-[11px] font-extrabold">
            <span>
              {settings.displayMode === 'translate_to_target'
                ? (isRTL ? 'به زبان هدف ترجمه کنید:' : 'Translate to target language:')
                : settings.displayMode === 'translate_to_native'
                  ? (isRTL ? 'معنی عبارت را بنویسید یا بگویید:' : 'Translate to your native language:')
                  : settings.displayMode === 'audio_only'
                    ? (isRTL ? 'گوش دهید و عبارت را بنویسید یا بگویید:' : 'Listen and type or speak:')
                    : (isRTL ? 'عبارت زیر را بخوانید یا تایپ کنید:' : 'Read aloud or type this phrase:')}
            </span>
          </div>

          {/* Hidden test-accessible hint trigger for automated audit tests */}
          <button
            type="button"
            data-testid="hint-button"
            onClick={handleTriggerRandomHint}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />

          {/* Compact quick hint trigger button */}
          <button
            type="button"
            onClick={handleTriggerRandomHint}
            className="px-2.5 py-1 rounded-lg border border-[var(--line)] bg-[var(--bg)] hover:bg-[var(--panel)] text-[var(--ink)] text-[11px] font-extrabold flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
            title={isRTL ? 'دریافت راهنمایی' : 'Get a clue'}
          >
            <Lightbulb size={13} className="text-amber-500" />
            <span>{isRTL ? 'راهنمایی' : 'Clue'}</span>
          </button>
        </div>

        {/* Random Hint Toast Bubble (multi-word, fully readable) */}
        {showRandomHint && randomHintMessage && (
          <div data-testid="hint-bubble" className="mb-1.5 p-2 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center justify-between animate-fade-in shadow-2xs gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <Lightbulb size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed break-words">{randomHintMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowRandomHint(false)}
              className="text-amber-700 dark:text-amber-300 hover:text-amber-900 p-0.5 cursor-pointer shrink-0"
              aria-label={isRTL ? 'بستن' : 'Close'}
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Center Card Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center py-2">
          {/* State: Skipped Card Review (User sees correct answer before proceeding to next card) */}
          {skippedCardInfo ? (
            <div className="py-1 flex flex-col items-center justify-center w-full text-center animate-fade-in">
              <div className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-xs font-extrabold mb-1.5">
                <CheckCircle2 size={14} className="text-amber-500" />
                <span>{isRTL ? 'پاسخ صحیح کارت' : 'Correct Card Answer'}</span>
              </div>

              <div 
                dir={isRtlLang(skippedCardInfo.card.targetLanguage) ? 'rtl' : 'ltr'}
                className="text-xl sm:text-2xl font-black text-[var(--ink)] tracking-tight leading-snug py-0.5 select-text"
              >
                {skippedCardInfo.targetText}
              </div>

              {skippedCardInfo.pronunciation && (
                <div className="text-xs font-bold text-[var(--lapis)] mt-0.5">
                  /{skippedCardInfo.pronunciation}/
                </div>
              )}

              <div 
                dir={isRtlLang(skippedCardInfo.card.nativeLanguage || settings.nativeLanguage || 'fa') ? 'rtl' : 'ltr'}
                className="text-sm sm:text-base font-bold text-[var(--mute)] mt-1.5 mb-2 select-text"
              >
                {skippedCardInfo.translation}
              </div>

              {/* Unified Audio Controls on Skipped Card Review */}
              <div className="flex items-center justify-center gap-2 my-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setIsPlayingAudio(true);
                    sound.speakNative(skippedCardInfo.targetText, skippedCardInfo.card.targetLanguage, {
                      onEnd: () => setIsPlayingAudio(false)
                    });
                    window.setTimeout(() => setIsPlayingAudio(false), 3000);
                  }}
                  className="btn-primary !min-h-[34px] !h-8.5 !px-3 !py-1 !text-xs !rounded-xl flex items-center gap-1.5 cursor-pointer"
                  aria-label={t.audioPronunciation || (isRTL ? 'پخش تلفظ صوتی' : 'Play Audio')}
                >
                  <Volume2 size={14} className={isPlayingAudio ? 'animate-pulse' : ''} />
                  <span>{isPlayingAudio ? (isRTL ? 'در حال پخش...' : 'Playing...') : (isRTL ? 'پخش صدا' : 'Play Audio')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setIsPlayingAudio(true);
                    sound.speakSlow(skippedCardInfo.targetText, skippedCardInfo.card.targetLanguage, {
                      onEnd: () => setIsPlayingAudio(false)
                    });
                    window.setTimeout(() => setIsPlayingAudio(false), 4500);
                  }}
                  className="btn-ghost !min-h-[34px] !h-8.5 !px-2.5 !py-1 !text-xs !rounded-xl flex items-center gap-1 cursor-pointer"
                  aria-label={t.slowAudioLabel || (isRTL ? 'پخش شمرده' : 'Slow Audio')}
                >
                  <Volume1 size={14} className="text-[var(--turq)]" />
                  <span>{isRTL ? 'شمرده' : 'Slow'}</span>
                </button>
              </div>

              {/* Proceed to Next Card Button */}
              <button
                type="button"
                onClick={handleConfirmSkipAndNext}
                className="btn-turq !min-h-[36px] !h-9 !px-5 !text-xs !rounded-xl flex items-center justify-center gap-1.5 cursor-pointer mt-1"
              >
                <span>{isRTL ? 'کارت بعدی' : 'Next Card'}</span>
                <ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />
              </button>
            </div>
          ) : settings.displayMode === 'audio_only' && !evaluation?.isCorrect ? (
            /* Mode 1: Audio-Only */
            <div className="py-2 flex flex-col items-center justify-center gap-2.5 w-full">
              <div className="w-14 h-14 rounded-full bg-[var(--lapis-soft)] text-[var(--lapis)] flex items-center justify-center animate-pulse">
                <Headphones size={26} />
              </div>
              <p className="text-xs sm:text-sm font-bold text-[var(--ink)] text-center">
                {isRTL ? 'گوش دهید و عبارت شنیده‌شده را بگویید یا بنویسید' : 'Listen and repeat or type what you hear'}
              </p>

              {/* Unified Audio Controls */}
              <div className="flex items-center justify-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={handlePlayAudio}
                  className="btn-primary !min-h-[34px] !h-8.5 !px-3 !py-1 !text-xs !rounded-xl flex items-center gap-1.5 cursor-pointer"
                  aria-label={t.audioPronunciation || (isRTL ? 'پخش تلفظ صوتی' : 'Play Audio')}
                >
                  <Volume2 size={14} className={isPlayingAudio ? 'animate-pulse' : ''} />
                  <span>{isPlayingAudio ? (isRTL ? 'در حال پخش...' : 'Playing...') : (isRTL ? 'پخش صدا' : 'Play Audio')}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePlaySlowAudio}
                  className="btn-ghost !min-h-[34px] !h-8.5 !px-2.5 !py-1 !text-xs !rounded-xl flex items-center gap-1 cursor-pointer"
                  aria-label={t.slowAudioLabel || (isRTL ? 'پخش شمرده' : 'Slow Audio')}
                >
                  <Volume1 size={14} className="text-[var(--turq)]" />
                  <span>{isRTL ? 'شمرده' : 'Slow'}</span>
                </button>
              </div>
            </div>
          ) : settings.displayMode === 'translate_to_target' ? (
            /* Mode 2: Translate to Target (Native prompt visible, target text hidden until revealed/correct) */
            <div className="py-1.5 flex flex-col items-center justify-center w-full text-center">
              <div 
                dir={isRtlLang(currentCard.nativeLanguage || settings.nativeLanguage || 'fa') ? 'rtl' : 'ltr'}
                className="text-xl sm:text-2xl font-black text-[var(--ink)] tracking-tight leading-snug py-0.5"
              >
                {currentCard.translation}
              </div>

              {(isRevealed || evaluation?.isCorrect) && (
                <div 
                  dir={isRtlLang(currentCard.targetLanguage) ? 'rtl' : 'ltr'}
                  className="mt-2 text-base sm:text-lg font-black text-[var(--turq)] bg-[var(--bg)] px-3.5 py-1 rounded-xl border border-[var(--line)]"
                >
                  {currentCard.targetText}
                </div>
              )}

              {/* Unified Audio Controls */}
              <div className="flex items-center justify-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={handlePlayAudio}
                  className="btn-primary !min-h-[34px] !h-8.5 !px-3 !py-1 !text-xs !rounded-xl flex items-center gap-1.5 cursor-pointer"
                  aria-label={t.audioPronunciation || (isRTL ? 'پخش تلفظ صوتی' : 'Play Audio')}
                >
                  <Volume2 size={14} className={isPlayingAudio ? 'animate-pulse' : ''} />
                  <span>{isPlayingAudio ? (isRTL ? 'در حال پخش...' : 'Playing...') : (isRTL ? 'پخش صدا' : 'Play Audio')}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePlaySlowAudio}
                  className="btn-ghost !min-h-[34px] !h-8.5 !px-2.5 !py-1 !text-xs !rounded-xl flex items-center gap-1 cursor-pointer"
                  aria-label={t.slowAudioLabel || (isRTL ? 'پخش شمرده' : 'Slow Audio')}
                >
                  <Volume1 size={14} className="text-[var(--turq)]" />
                  <span>{isRTL ? 'شمرده' : 'Slow'}</span>
                </button>
              </div>
            </div>
          ) : settings.displayMode === 'translate_to_native' ? (
            /* Mode 3: Translate to Native (Target text visible, native meaning hidden until revealed/correct) */
            <div className="py-1.5 flex flex-col items-center justify-center w-full text-center">
              <div 
                dir={isRtlLang(currentCard.targetLanguage) ? 'rtl' : 'ltr'}
                className="text-xl sm:text-2xl font-black text-[var(--ink)] tracking-tight leading-snug py-0.5"
              >
                {currentCard.targetText}
              </div>

              {currentCard.pronunciation && (
                <div className="text-xs font-bold text-[var(--mute)] mt-0.5">
                  /{currentCard.pronunciation}/
                </div>
              )}

              {(isRevealed || evaluation?.isCorrect) && (
                <div 
                  dir={isRtlLang(currentCard.nativeLanguage || settings.nativeLanguage || 'fa') ? 'rtl' : 'ltr'}
                  className="mt-2 text-base sm:text-lg font-black text-[var(--lapis)] bg-[var(--bg)] px-3.5 py-1 rounded-xl border border-[var(--line)]"
                >
                  {currentCard.translation}
                </div>
              )}

              {/* Unified Audio Controls */}
              <div className="flex items-center justify-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={handlePlayAudio}
                  className="btn-primary !min-h-[34px] !h-8.5 !px-3 !py-1 !text-xs !rounded-xl flex items-center gap-1.5 cursor-pointer"
                  aria-label={t.audioPronunciation || (isRTL ? 'پخش تلفظ صوتی' : 'Play Audio')}
                >
                  <Volume2 size={14} className={isPlayingAudio ? 'animate-pulse' : ''} />
                  <span>{isPlayingAudio ? (isRTL ? 'در حال پخش...' : 'Playing...') : (isRTL ? 'پخش صدا' : 'Play Audio')}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePlaySlowAudio}
                  className="btn-ghost !min-h-[34px] !h-8.5 !px-2.5 !py-1 !text-xs !rounded-xl flex items-center gap-1 cursor-pointer"
                  aria-label={t.slowAudioLabel || (isRTL ? 'پخش شمرده' : 'Slow Audio')}
                >
                  <Volume1 size={14} className="text-[var(--turq)]" />
                  <span>{isRTL ? 'شمرده' : 'Slow'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Mode 4: Text & Audio (Reading & Speech - shows target phrase and translation clearly) */
            <div className="py-1.5 flex flex-col items-center justify-center w-full text-center">
              <div 
                dir={isRtlLang(currentCard.targetLanguage) ? 'rtl' : 'ltr'}
                className="text-xl sm:text-2xl font-black text-[var(--ink)] tracking-tight leading-snug py-0.5"
              >
                {currentCard.targetText}
              </div>

              {currentCard.pronunciation && (
                <div className="text-xs font-bold text-[var(--lapis)] mt-0.5">
                  /{currentCard.pronunciation}/
                </div>
              )}

              <div 
                dir={isRtlLang(currentCard.nativeLanguage || settings.nativeLanguage || 'fa') ? 'rtl' : 'ltr'}
                className="text-xs sm:text-sm font-bold text-[var(--mute)] mt-1.5"
              >
                {currentCard.translation}
              </div>

              {/* Unified Audio Controls */}
              <div className="flex items-center justify-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={handlePlayAudio}
                  className="btn-primary !min-h-[34px] !h-8.5 !px-3 !py-1 !text-xs !rounded-xl flex items-center gap-1.5 cursor-pointer"
                  aria-label={t.audioPronunciation || (isRTL ? 'پخش تلفظ صوتی' : 'Play Audio')}
                >
                  <Volume2 size={14} className={isPlayingAudio ? 'animate-pulse' : ''} />
                  <span>{isPlayingAudio ? (isRTL ? 'در حال پخش...' : 'Playing...') : (isRTL ? 'پخش صدا' : 'Play Audio')}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePlaySlowAudio}
                  className="btn-ghost !min-h-[34px] !h-8.5 !px-2.5 !py-1 !text-xs !rounded-xl flex items-center gap-1 cursor-pointer"
                  aria-label={t.slowAudioLabel || (isRTL ? 'پخش شمرده' : 'Slow Audio')}
                >
                  <Volume1 size={14} className="text-[var(--turq)]" />
                  <span>{isRTL ? 'شمرده' : 'Slow'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Answer Feedback & Correction Banner */}
      {evaluation && (
        <div className="my-1.5 shrink-0 animate-fade-in font-ui">
          <div className={`p-3.5 rounded-[16px] border text-xs font-bold shadow-xs ${
            evaluation.isCorrect 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200' 
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-200'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                {evaluation.isCorrect ? (
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-[var(--ink)] leading-snug">{evaluation.feedbackMessage}</div>
                  {evaluation.isCorrect && (
                    <div className="text-[11px] text-emerald-600 mt-0.5 font-bold">
                      +{toPersian(evaluation.pointsAwarded, isRTL)} {t.pointsUnit || (isRTL ? 'امتیاز' : 'PTS')}
                    </div>
                  )}
                </div>
              </div>

              {evaluation.isCorrect && (
                <button
                  type="button"
                  onClick={() => handleNextCard(false)}
                  className="btn-turq !min-h-[38px] !text-xs !py-1 !px-3 shrink-0"
                >
                  <span>{t.nextCard}</span>
                  <ArrowRight size={13} className={isRTL ? 'rotate-180' : ''} />
                </button>
              )}
            </div>

            {/* Actionable buttons & guidance if incorrect */}
            {!evaluation.isCorrect && (
              <div className="mt-2.5 pt-2.5 border-t border-rose-200 dark:border-rose-800/50 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTryAgain}
                    className="btn-danger !min-h-[38px] !text-xs !py-1.5 !px-3.5 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <RotateCcw size={14} />
                    <span>{isRTL ? 'تلاش مجدد' : 'Try Again'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePlayAudio}
                    className="btn-ghost !min-h-[38px] !text-xs !py-1.5 !px-3.5 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 size={14} className="text-[var(--lapis)]" />
                    <span>{isRTL ? 'شنیدن تلفظ' : 'Listen'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setIsRevealed(true);
                    }}
                    className="btn-ghost !min-h-[38px] !text-xs !py-1.5 !px-3.5 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye size={14} />
                    <span>{isRTL ? 'مشاهده پاسخ' : 'Show Answer'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Minimalist Ergonomic Input Bar: Type / Voice-to-Text / Check / Skip */}
      <div className="space-y-1.5 shrink-0 font-ui mt-1">
        {/* Compact Input and 3 Action Buttons Row (Only active during live card guessing, hidden when answered correctly or during skipped review) */}
        {!skippedCardInfo && !evaluation?.isCorrect && (
          <div className="space-y-1.5">
            {/* Active Voice Recording Status Banner (Manual start & stop) */}
            {(isListening || isGeminiRecording) && (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold animate-pulse">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping shrink-0" />
                  <span className="truncate">
                    {isRTL
                      ? `در حال ضبط صدا به زبان ${expectedAnswerLangLabel}... پس از گفتن پاسخ، روی «پایان ضبط» بزنید.`
                      : `Recording in ${expectedAnswerLangLabel}... Tap 'Stop Recording' when done.`}
                  </span>
                </div>
                <span className="font-timer font-black text-xs shrink-0 tabular-nums px-2 py-0.5 rounded-md bg-rose-500/20" dir="ltr">
                  {Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, '0')}
                </span>
              </div>
            )}

            {/* Converting Voice-to-Text Banner */}
            {isTranscribingWithGemini && (
              <div className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-bold animate-pulse">
                <Loader2 size={13} className="animate-spin shrink-0" />
                <span>
                  {isRTL
                    ? `در حال تبدیل فایل صوتی به متن (${expectedAnswerLangLabel})...`
                    : `Transcribing audio into ${expectedAnswerLangLabel}...`}
                </span>
              </div>
            )}

            {/* Slim Text Input */}
            <div className="relative w-full flex items-center">
              <input
                ref={textInputRef}
                type="text"
                dir={
                  userInput.trim()
                    ? (isRtlLang(expectedAnswerLangCode) ? 'rtl' : 'ltr')
                    : (isRTL ? 'rtl' : 'ltr')
                }
                value={userInput}
                onChange={e => {
                  liveTranscriptRef.current = e.target.value;
                  setUserInput(e.target.value);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCheckAnswer();
                }}
                placeholder={
                  isTranscribingWithGemini
                    ? (isRTL ? `در حال تبدیل صدا به متن (${expectedAnswerLangLabel})...` : `Converting audio to text (${expectedAnswerLangLabel})...`)
                    : (isListening || isGeminiRecording)
                      ? (isRTL ? `در حال ضبط صدا به زبان ${expectedAnswerLangLabel}... صحبت کنید` : `Recording in ${expectedAnswerLangLabel}... Speak now`)
                      : (t.enterAnswerPlaceholder || (isRTL ? `پاسخ را به زبان ${expectedAnswerLangLabel} تایپ کنید یا بگویید...` : `Type or speak answer in ${expectedAnswerLangLabel}...`))
                }
                className={`w-full bg-[var(--panel)] text-[var(--ink)] px-3 py-1.5 h-9 rounded-xl border text-xs font-bold focus:outline-none transition-colors shadow-2xs ${
                  isListening || isGeminiRecording
                    ? 'border-rose-500 ring-2 ring-rose-500/20'
                    : isTranscribingWithGemini
                      ? 'border-teal-500 ring-2 ring-teal-500/20'
                      : 'border-[var(--line)] focus:border-[var(--lapis)]'
                }`}
              />
            </div>

            {/* Compact 3-Button Action Bar (Check Answer + Voice-to-Text Mic + Skip) */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={handleCheckAnswer}
                disabled={isTranscribingWithGemini}
                className="btn-primary !min-h-[34px] !h-8.5 !px-2.5 !py-1 !text-xs !rounded-xl whitespace-nowrap flex items-center justify-center gap-1.5 font-extrabold cursor-pointer disabled:opacity-60"
                aria-label={t.checkAnswer || (isRTL ? 'بررسی پاسخ' : 'Check Answer')}
              >
                <Send size={13} className={`shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
                <span className="truncate">{t.checkAnswer || (isRTL ? 'بررسی پاسخ' : 'Check')}</span>
              </button>

              <button
                type="button"
                onClick={toggleListening}
                disabled={isTranscribingWithGemini}
                className={`min-h-[34px] h-8.5 px-2.5 py-1 rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-2xs text-xs font-extrabold ${
                  isTranscribingWithGemini
                    ? 'bg-teal-500/15 border-teal-500/40 text-[var(--turq)] animate-pulse'
                    : isListening || isGeminiRecording
                      ? 'bg-rose-600 hover:bg-rose-700 border-rose-600 text-white animate-pulse ring-2 ring-rose-400/40 shadow-sm'
                      : 'bg-[var(--lapis-soft)] border-[var(--lapis)]/30 text-[var(--lapis)] hover:brightness-95'
                }`}
                aria-label={
                  isListening || isGeminiRecording
                    ? (isRTL ? 'پایان ضبط و تبدیل به متن' : 'Stop Recording')
                    : (isRTL ? 'شروع ضبط گفتار (صحبت)' : 'Start Voice Recording (Speak)')
                }
              >
                {isTranscribingWithGemini ? (
                  <Loader2 size={14} className="animate-spin shrink-0" />
                ) : isListening || isGeminiRecording ? (
                  <Square size={12} className="fill-white shrink-0" />
                ) : (
                  <Mic size={14} className="shrink-0" />
                )}
                <span className="truncate">
                  {isTranscribingWithGemini
                    ? (isRTL ? 'تبدیل...' : 'Converting...')
                    : isListening || isGeminiRecording
                      ? (isRTL ? 'پایان ضبط' : 'Stop Recording')
                      : (isRTL ? 'شروع ضبط' : 'Start Voice')}
                </span>
              </button>

              <button
                type="button"
                onClick={handleSkip}
                className="btn-ghost !min-h-[34px] !h-8.5 !px-2.5 !py-1 !text-xs !rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                aria-label={t.skipBtn || (isRTL ? 'رد کردن / مشاهده پاسخ' : 'Skip / Show Answer')}
                title={isRTL ? 'رد کردن این کارت و مشاهده پاسخ صحیح' : 'Skip card & see correct answer'}
              >
                <SkipForward size={14} className="shrink-0" />
                <span className="truncate">{t.skipBtn || (isRTL ? 'رد کردن' : 'Skip')}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Onboarding Interactive Button Guide Modal */}
      <PracticeTourModal
        isOpen={showTourModal}
        onClose={() => setShowTourModal(false)}
        isRTL={isRTL}
      />

      {/* Interactive Microphone Troubleshooter & Permission Guide Modal */}
      {showMicPermissionModal && (
        <div 
          className="sheet"
          onClick={() => {
            if (!isRequestingMic) {
              sound.playClick();
              setShowMicPermissionModal(false);
            }
          }}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div 
            className="sheet-box text-start max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[var(--lapis-soft)] text-[var(--lapis)] flex items-center justify-center shrink-0">
                  <Mic size={20} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-[var(--ink)]">
                    {isRTL ? 'چرا میکروفون با وجود روشن بودن کار نمی‌کند؟' : 'Why Mic Fails Even When Enabled'}
                  </h3>
                  <p className="text-[11px] font-bold text-[var(--mute)]">
                    {micErrorReason === 'no_device'
                      ? (isRTL ? 'وضعیت: میکروفونی در سیستم یافت نشد' : 'Status: No microphone detected')
                      : micErrorReason === 'in_use'
                        ? (isRTL ? 'وضعیت: میکروفون در برنامه دیگری درگیر است' : 'Status: Microphone busy in another app')
                        : (isRTL ? 'وضعیت: محدودیت قاب پیش‌نمایش (Preview Iframe)' : 'Status: Preview Iframe Restriction')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMicPermissionModal(false)}
                className="w-8 h-8 rounded-xl bg-[var(--bg)] text-[var(--mute)] hover:text-[var(--ink)] flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Visual Step-by-Step Guide specifically for Preview Iframe & Chrome Permission Reload */}
            <div className="bg-[var(--bg)] border border-[var(--line)] rounded-2xl p-3 mb-3 space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[var(--lapis)] text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  {isRTL ? '۱' : '1'}
                </span>
                <p className="text-[var(--ink)] font-bold leading-relaxed">
                  {isRTL
                    ? 'اگر تیک Microphone در بالای مرورگر روشن است، کروم تا پیش از رفرش شدن صفحه، دسترسی را به قاب پیش‌نمایش نمی‌دهد. روی دکمه «بارگذاری مجدد پیش‌نمایش» در پایین بزنید.'
                    : 'When you turn Microphone ON in Chrome, it does not apply to the preview frame until reloaded. Tap "Reload Preview" below.'}
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[var(--lapis)] text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  {isRTL ? '۲' : '2'}
                </span>
                <p className="text-[var(--ink)] font-bold leading-relaxed">
                  {isRTL
                    ? 'راه‌حل ۱۰۰٪ قطعی: در نوار سفید بالای همین پیش‌نمایش، روی آیکون باز کردن در تب جدید (🔗) کلیک کنید تا بازی خارج از قاب پیش‌نمایش و با میکروفون کامل اجرا شود.'
                    : '100% Guaranteed Fix: Click the Open in New Tab icon (🔗) in the toolbar right above this preview so the app runs outside the preview frame.'}
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  {isRTL ? '۳' : '3'}
                </span>
                <p className="text-[var(--ink)] font-bold leading-relaxed">
                  {isRTL
                    ? 'اگر می‌خواهید در همین صفحه بمانید، «۴ گزینه آماده پاسخ» در پایین کارت برایتان فعال شده است تا با یک کلیک بازی کنید.'
                    : 'To keep playing right here, 4 Quick Answer Choices are active on the card so you can answer with 1 tap.'}
                </p>
              </div>
            </div>

            {micTestSuccess && (
              <div className="mb-3 p-2.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-extrabold flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{isRTL ? 'میکروفون با موفقیت فعال شد! در حال ضبط...' : 'Microphone enabled! Recording...'}</span>
              </div>
            )}

            {micPermissionError && (
              <div className="mb-3 p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold leading-relaxed">
                {micPermissionError}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  window.location.reload();
                }}
                className="btn-primary !w-full !py-2.5 !text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw size={15} />
                <span>
                  {isRTL ? '۱. بارگذاری مجدد پیش‌نمایش (اعمال دسترسی میکروفون)' : '1. Reload Preview (Apply Mic Permission)'}
                </span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  sound.playClick();
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    setCopiedDirectUrl(true);
                    window.setTimeout(() => setCopiedDirectUrl(false), 3500);
                  } catch {}
                }}
                className="w-full py-2 px-3 rounded-xl bg-[var(--bg)] hover:bg-[var(--lapis-soft)] text-[var(--ink)] border border-[var(--line)] text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                {copiedDirectUrl ? <CheckCircle2 size={14} className="text-emerald-600" /> : <KeyRound size={14} className="text-[var(--lapis)]" />}
                <span>
                  {copiedDirectUrl
                    ? (isRTL ? 'لینک مستقیم کپی شد! در یک تب جدید مرورگر Paste کنید' : 'Direct link copied! Paste in a new browser tab')
                    : (isRTL ? '۲. کپی لینک مستقیم برنامه (برای باز کردن در تب جدید)' : '2. Copy Direct App URL (Open in New Tab)')}
                </span>
              </button>

              <button
                type="button"
                onClick={handleGrantPermissionAndStart}
                disabled={isRequestingMic}
                className="w-full py-2 px-3 rounded-xl bg-[var(--bg)] hover:bg-[var(--lapis-soft)] text-[var(--lapis)] border border-[var(--lapis)]/30 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Mic size={14} className={isRequestingMic ? 'animate-pulse' : ''} />
                <span>
                  {isRequestingMic
                    ? (isRTL ? 'در حال بررسی میکروفون...' : 'Testing Microphone...')
                    : (isRTL ? 'تست مستقیم میکروفون در همین پنجره' : 'Test Microphone Now')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setShowQuickChoicesFallback(true);
                  setShowMicPermissionModal(false);
                  setActionableError(null);
                }}
                className="w-full py-2 px-3 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-[var(--turq)] border border-teal-500/30 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Sparkles size={14} />
                <span>{isRTL ? 'ادامه بازی با ۴ گزینه آماده (بدون نیاز به میکروفون)' : 'Play with 4 Quick Choices (No Mic Needed)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stop / Pause Game Modal */}
      {showExitConfirm && (
        <ExitConfirmModal
          isRTL={isRTL}
          onCancel={() => setShowExitConfirm(false)}
          onOpenHelp={() => {
            setShowExitConfirm(false);
            setShowTourModal(true);
          }}
          onExitHome={() => {
            setShowExitConfirm(false);
            if (onExitHome) onExitHome();
            else onExit();
          }}
          onExitSetup={() => {
            setShowExitConfirm(false);
            if (onExitSetup) onExitSetup();
            else onExit();
          }}
        />
      )}
    </div>
  );
};

export default SinglePlayerScreen;
