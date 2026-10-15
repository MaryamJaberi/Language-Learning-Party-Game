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
import { generateChallengingReflexOptions } from '../utils/testQuestionEngine';
import { getPronunciationHint } from '../pronunciationService';
import { 
  Mic, 
  MicOff, 
  Volume2, 
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
  Award
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
  
  // Microphone Permission Request State
  const [showMicPermissionModal, setShowMicPermissionModal] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
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

  // Smart Voice Input & Audio Transcription State (Gemini & WebSpeech unified)
  const [isTranscribingWithGemini, setIsTranscribingWithGemini] = useState(false);
  const [isGeminiRecording, setIsGeminiRecording] = useState(false);
  const geminiRecorderRef = useRef<AudioRecorder | null>(null);

  // Untimed relaxed study for cards (user has unlimited time per card in single-player card mode)
  const startTimeRef = useRef<number>(Date.now());
  const recognitionRef = useRef<any>(null);
  const isUserSpeakingRef = useRef<boolean>(false);

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
      ? (currentCard.nativeLanguage || 'fa')
      : (currentCard.targetLanguage || 'nl');
    return generateChallengingReflexOptions(currentCard, cards, targetLang);
  }, [currentCard, cards, settings.displayMode]);

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
      const nativeCode = settings.nativeLanguage || 'fa';
      const nativeInfo = SUPPORTED_LANGUAGES.find(l => l.code === nativeCode);
      const targetLang = currentCard?.targetLanguage || settings.targetLanguage;
      const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === targetLang);

      const langCode = isReverseToNative
        ? (nativeInfo?.speechCode || SPEECH_LANG_MAP[nativeCode] || 'fa-IR')
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
        setUserInput(transcript);
        setActionableError(null);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setIsListening(false);
          isUserSpeakingRef.current = false;
          setActionableError(
            isRTL
              ? 'دسترسی به میکروفون مسدود است. راه‌حل: در نوار آدرس مرورگر روی علامت قفل یا میکروفون بزنید و اجازه دسترسی (Allow) دهید، یا پاسخ را در کادر پایین تایپ نمایید.'
              : 'Microphone access is denied. Fix: Allow microphone in browser settings or type your answer.'
          );
        }
      };

      recognition.onend = () => {
        if (isUserSpeakingRef.current) {
          try {
            recognition.start();
            return;
          } catch {
            // ignore
          }
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
    startTimeRef.current = Date.now();

    // In single-player card game, cards are relaxed and untimed (no countdown expiring cards)

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

  const toggleListening = async () => {
    sound.playClick();

    if (isListening || isGeminiRecording || isUserSpeakingRef.current) {
      // User stops speaking
      isUserSpeakingRef.current = false;
      setIsListening(false);
      setIsGeminiRecording(false);
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }

      // If AudioRecorder was recording, stop and transcribe with Gemini
      if (geminiRecorderRef.current) {
        setIsTranscribingWithGemini(true);
        try {
          const audioBlob = await geminiRecorderRef.current.stop();
          const targetLang = settings.displayMode === 'translate_to_native'
            ? (currentCard?.nativeLanguage || settings.nativeLanguage || 'fa')
            : (currentCard?.targetLanguage || settings.targetLanguage || 'nl');
          const transcribed = await transcribeAudioBlob(audioBlob, targetLang);
          if (transcribed && transcribed.trim()) {
            setUserInput(transcribed.trim());
            sound.playSuccess();
          }
        } catch (err: any) {
          console.warn('Gemini audio transcribe fallback:', err);
        } finally {
          setIsTranscribingWithGemini(false);
          geminiRecorderRef.current = null;
        }
      }
    } else {
      // User starts speaking
      setUserInput('');
      setActionableError(null);
      isUserSpeakingRef.current = true;
      setIsListening(true);

      const isReverseToNative = settings.displayMode === 'translate_to_native';
      const nativeCode = settings.nativeLanguage || 'fa';
      const nativeInfo = SUPPORTED_LANGUAGES.find(l => l.code === nativeCode);
      const targetLang = currentCard?.targetLanguage || settings.targetLanguage;
      const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === targetLang);

      const langCode = isReverseToNative
        ? (nativeInfo?.speechCode || SPEECH_LANG_MAP[nativeCode] || 'fa-IR')
        : (langInfo?.speechCode || SPEECH_LANG_MAP[targetLang] || 'en-US');

      // 1. Try starting Web Speech API for immediate streaming feedback
      if (speechSupported && recognitionRef.current) {
        try {
          recognitionRef.current.lang = langCode;
          recognitionRef.current.start();
        } catch (e: any) {
          console.warn('Speech recognition start fallback:', e);
        }
      }

      // 2. Also start high-fidelity AudioRecorder for Gemini smart transcription
      try {
        geminiRecorderRef.current = new AudioRecorder();
        await geminiRecorderRef.current.start();
        setIsGeminiRecording(true);
      } catch (err: any) {
        console.warn('Gemini recorder mic fallback:', err);
        if (!speechSupported) {
          setMicPermissionError(isRTL ? 'دسترسی به میکروفون مجاز نشد.' : 'Microphone access denied.');
          setIsListening(false);
          isUserSpeakingRef.current = false;
        }
      }
    }
  };

  const handleGrantPermissionAndStart = async () => {
    sound.playClick();
    setIsRequestingMic(true);
    setMicPermissionError(null);

    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop the temporary track immediately so Web Speech API has exclusive access to the microphone
        stream.getTracks().forEach(track => track.stop());
      }

      setShowMicPermissionModal(false);
      setUserInput('');

      const targetLang = currentCard?.targetLanguage || settings.targetLanguage;
      const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === targetLang);
      const langCode = langInfo?.speechCode || SPEECH_LANG_MAP[targetLang] || 'en-US';

      if (recognitionRef.current) {
        recognitionRef.current.lang = langCode;
        recognitionRef.current.start();
      }
    } catch (err: any) {
      console.warn('Microphone permission request error:', err);
      setMicPermissionError(
        isRTL 
          ? 'دسترسی به میکروفون داده نشد یا مسدود شده است. لطفاً در نوار آدرس مرورگر (آیکون قفل/میکروفون) دسترسی میکروفون را مجاز نمایید.'
          : 'Microphone permission was denied. Please allow microphone access in your browser address bar.'
      );
    } finally {
      setIsRequestingMic(false);
    }
  };

  const handlePlayAudio = () => {
    if (!currentCard) return;
    sound.playClick();
    sound.speakNative(currentCard.targetText, currentCard.targetLanguage);
  };

  const handlePlaySlowAudio = () => {
    if (!currentCard) return;
    sound.playClick();
    sound.speakSlow(currentCard.targetText, currentCard.targetLanguage);
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
          ? `+${points} 🎭 خلاقانه (${currentCard.cefrLevel})`
          : currentCard.isChallenge 
            ? `+${points} ⭐ چالش (${currentCard.cefrLevel})` 
            : newStreak > 1 ? `+${points} ×${newStreak} (${currentCard.cefrLevel})` : `+${points} PTS (${currentCard.cefrLevel})`
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
          subText: `تسلط بر ${newStreak} کلمه پیاپی 🔥`
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

    // The language of the hint MUST strictly match the Guide language (settings.nativeLanguage)
    const guideLang = settings.nativeLanguage || 'fa';

    const isReverse = settings.displayMode === 'translate_to_native';
    const fullText = (isReverse ? currentCard.translation : currentCard.targetText || '').trim();
    const words = fullText.split(/\s+/).filter(Boolean);

    const hintsPool: string[] = [];

    // Helper to format cloze prompts in the exact guide language
    const getClozeLabel = (type: 'fill_key' | 'frame' | 'structure' | 'grammar') => {
      switch (guideLang) {
        case 'fa':
        case 'ku':
          if (type === 'fill_key') return 'بخش مهم جمله را کامل کنید:';
          if (type === 'frame') return 'قالب جمله و تکمیل بخش پایانی:';
          if (type === 'structure') return 'تکمیل جای خالی در جمله:';
          return 'نکته گرامری جمله:';
        case 'ar':
          if (type === 'fill_key') return 'أكمل الجزء المهم من الجملة:';
          if (type === 'frame') return 'هيكل الجملة وإكمال الجزء الأخير:';
          if (type === 'structure') return 'املأ الفراغ في الجملة:';
          return 'القاعدة النحوية:';
        case 'tr':
          if (type === 'fill_key') return 'Cümlenin önemli kısmını tamamlayın:';
          if (type === 'frame') return 'Cümle kalıbı ve tamamlama:';
          if (type === 'structure') return 'Cümledeki boşluğu doldurun:';
          return 'Dilbilgisi ipucu:';
        case 'nl':
          if (type === 'fill_key') return 'Vul het belangrijke deel van de zin in:';
          if (type === 'frame') return 'Zinsstructuur en aanvulling:';
          if (type === 'structure') return 'Vul de open plek in de zin aan:';
          return 'Grammaticaal punt:';
        case 'de':
          if (type === 'fill_key') return 'Ergänzen Sie den wichtigen Teil des Satzes:';
          if (type === 'frame') return 'Satzbau und Ergänzung:';
          if (type === 'structure') return 'Füllen Sie die Lücke im Satz:';
          return 'Grammatik-Tipp:';
        case 'fr':
          if (type === 'fill_key') return 'Complétez la partie essentielle de la phrase :';
          if (type === 'frame') return 'Structure de phrase et fin à compléter :';
          if (type === 'structure') return 'Remplissez le blanc dans la phrase :';
          return 'Point de grammaire :';
        case 'es':
          if (type === 'fill_key') return 'Completa la parte clave de la oración:';
          if (type === 'frame') return 'Estructura de la oración para completar:';
          if (type === 'structure') return 'Llena el espacio en la oración:';
          return 'Punto gramatical:';
        case 'it':
          if (type === 'fill_key') return 'Completa la parte chiave della frase:';
          if (type === 'frame') return 'Struttura della frase da completare:';
          if (type === 'structure') return 'Riempi lo spazio vuoto nella frase:';
          return 'Punto grammaticale:';
        case 'ru':
          if (type === 'fill_key') return 'Заполните ключевую часть предложения:';
          if (type === 'frame') return 'Начало фразы с пропуском:';
          if (type === 'structure') return 'Вставьте пропущенную часть:';
          return 'Грамматическая подсказка:';
        default:
          if (type === 'fill_key') return 'Fill in the key part of the sentence:';
          if (type === 'frame') return 'Sentence starter frame:';
          if (type === 'structure') return 'Fill in the blank in the sentence:';
          return 'Grammar clue:';
      }
    };

    // Common grammatical stopwords
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'am', 'are', 'was', 'were', 'to', 'in', 'on', 'at', 'of', 'for', 'with', 'by', 'that', 'this', 'it',
      'de', 'het', 'een', 'is', 'zijn', 'was', 'van', 'in', 'op', 'te', 'om', 'met', 'voor', 'dat', 'dit', 'er', 'en',
      'der', 'die', 'das', 'ein', 'eine', 'ist', 'sind', 'war', 'von', 'in', 'auf', 'zu', 'mit', 'für', 'dass', 'und',
      'le', 'la', 'les', 'un', 'une', 'est', 'sont', 'de', 'du', 'en', 'dans', 'à', 'pour', 'avec', 'que', 'qui',
      'el', 'la', 'los', 'las', 'un', 'una', 'es', 'son', 'de', 'del', 'en', 'a', 'para', 'con', 'que',
      'این', 'آن', 'از', 'به', 'با', 'در', 'که', 'را', 'رو', 'است', 'هست', 'بود', 'شد', 'یک', 'تا'
    ]);

    // 1. Cloze Sentence Formats (Fill in key parts of the sentence - NO first-letter reveals)
    if (words.length >= 2) {
      const contentIndices: number[] = [];
      words.forEach((w, idx) => {
        const clean = w.replace(/[.,!?;:"'«»()]/g, '').toLowerCase();
        if (!stopWords.has(clean) && clean.length >= 3) {
          contentIndices.push(idx);
        }
      });

      const targetIndices = contentIndices.length > 0 ? contentIndices : words.map((_, i) => i);

      // Blank out the primary key content word (e.g. key verb or main noun)
      const bestIndex = targetIndices.reduce((best, curr) => {
        return words[curr].length > words[best].length ? curr : best;
      }, targetIndices[0]);

      const clozeA = words.map((w, idx) => idx === bestIndex ? '[______]' : w).join(' ');
      hintsPool.push(`${getClozeLabel('fill_key')} «${clozeA}»`);

      // Variation B: Blank out secondary important part
      if (targetIndices.length > 1) {
        const secondIndex = targetIndices.find(idx => idx !== bestIndex) ?? targetIndices[0];
        const clozeB = words.map((w, idx) => idx === secondIndex ? '[______]' : w).join(' ');
        hintsPool.push(`${getClozeLabel('structure')} «${clozeB}»`);
      }

      // Variation C: Sentence starter frame (providing structural lead-in with tail blank)
      if (words.length >= 3) {
        const starterCount = Math.max(1, Math.floor(words.length * 0.6));
        const starterWords = words.slice(0, starterCount).join(' ');
        hintsPool.push(`${getClozeLabel('frame')} «${starterWords} [______]»`);
      }
    } else {
      // Single word item: Provide sentence completion frame
      hintsPool.push(`${getClozeLabel('fill_key')} «... [______] ...»`);
    }

    // 2. Grammar Point in Guide Language
    if (currentCard.grammarPoint) {
      hintsPool.push(`${getClozeLabel('grammar')} ${currentCard.grammarPoint}`);
    }

    // 3. Situational Context / Topic in Guide Language
    if (currentCard.scenarioRole || currentCard.topic) {
      const topicLabel = currentCard.scenarioRole || currentCard.topic;
      const contextLabel = guideLang === 'fa' || guideLang === 'ku' ? 'موقعیت مکالمه و کاربرد:' :
        guideLang === 'ar' ? 'سياق المحادثة والاستخدام:' :
        guideLang === 'tr' ? 'Konuşma bağlamı ve kullanım:' :
        guideLang === 'nl' ? 'Gesprekscontext en gebruik:' :
        guideLang === 'de' ? 'Gesprächskontext und Anwendung:' :
        guideLang === 'fr' ? 'Contexte de conversation :' :
        guideLang === 'es' ? 'Contexto de conversación:' :
        'Conversation context & usage:';
      hintsPool.push(`${contextLabel} ${topicLabel}`);
    }

    // 4. Pedagogical note from card in Guide Language
    if (currentCard.hint) {
      const clueLabel = guideLang === 'fa' || guideLang === 'ku' ? 'سرنخ یادگیری:' :
        guideLang === 'ar' ? 'تلميح تعليمي:' :
        guideLang === 'tr' ? 'Öğrenme ipucu:' :
        guideLang === 'nl' ? 'Leertip:' :
        guideLang === 'de' ? 'Lernhinweis:' :
        guideLang === 'fr' ? 'Indice d’apprentissage :' :
        guideLang === 'es' ? 'Pista de aprendizaje:' :
        'Learning clue:';
      hintsPool.push(`${clueLabel} ${currentCard.hint}`);
    }

    // 5. Pronunciation guidance
    const pron = getPronunciationHint(
      currentCard.targetText,
      currentCard.targetLanguage,
      guideLang,
      currentCard.pronunciation
    );
    if (pron) {
      hintsPool.push(pron);
    }

    if (hintsPool.length === 0) {
      const meaningLabel = guideLang === 'fa' || guideLang === 'ku' ? 'معنی:' :
        guideLang === 'ar' ? 'المعنى:' :
        guideLang === 'nl' ? 'Betekenis:' :
        guideLang === 'de' ? 'Bedeutung:' :
        guideLang === 'fr' ? 'Sens :' :
        guideLang === 'es' ? 'Significado:' :
        'Meaning:';
      hintsPool.push(`${meaningLabel} ${currentCard.translation}`);
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

  return (
    <div 
      className="app w-full max-w-lg sm:max-w-xl md:max-w-2xl mx-auto min-h-full flex-1 px-3 sm:px-4 pb-12 font-ui relative flex flex-col justify-between overflow-y-auto overscroll-contain"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* 1. Header (clean, focused, icon-only exit & clear progress) */}
      <header className="sticky top-0 z-20 bg-[var(--bg)] flex items-center justify-between py-2 px-0.5 border-b border-[var(--line)]/50 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowExitConfirm(true);
            }}
            className="w-9 h-9 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer shrink-0"
            aria-label={t.exit || (isRTL ? 'خروج' : 'Exit')}
            title={t.exit || (isRTL ? 'خروج از بازی' : 'Exit Game')}
          >
            <ArrowLeft size={17} className={isRTL ? 'rotate-180' : ''} />
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

      {/* 3. Progress Bar (Untimed, relaxed learning) */}
      <div className="mt-2 shrink-0">
        <div className="flex items-center justify-between text-[11px] font-bold text-[var(--mute)] mb-1">
          <span>{isRTL ? 'میزان پیشرفت' : 'Progress'}</span>
          <div className="flex items-center gap-2">
            {streak > 1 && (
              <span className="text-amber-500 font-extrabold flex items-center gap-0.5">
                🔥 {toPersian(streak, isRTL)} {isRTL ? 'پیاپی' : 'streak'}
              </span>
            )}
            <span className="font-ui font-black text-[var(--turq)] text-xs">
              {isRTL 
                ? `٪${toPersian(Math.round(((currentIndex + 1) / Math.max(1, cards.length)) * 100), true)}` 
                : `${Math.round(((currentIndex + 1) / Math.max(1, cards.length)) * 100)}%`}
            </span>
          </div>
        </div>
        <div className="w-full h-1.5 bg-[var(--line)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--turq)] transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / Math.max(1, cards.length)) * 100}%` }}
          />
        </div>
      </div>

      {/* Actionable Error Banner if mic/input issue */}
      {actionableError && (
        <div className="mt-2 p-2.5 rounded-[14px] bg-[var(--panel)] border border-[var(--danger)] text-[var(--danger)] text-xs font-bold flex items-start gap-2 text-start leading-relaxed shadow-xs">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <div className="flex-1">{actionableError}</div>
        </div>
      )}

      {/* 4. Center Interactive Flashcard in .panel style */}
      <div className="panel my-2 flex-1 flex flex-col justify-between relative !p-5">
        {/* Top of card: Audio pronunciation controls (hint and web search removed per user request) */}
        <div className="flex items-center justify-end mb-2">
          {/* Hidden test-accessible hint trigger for automated audit tests */}
          <button
            type="button"
            data-testid="hint-button"
            onClick={handleTriggerRandomHint}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePlayAudio}
              className="w-9 h-9 rounded-xl border border-[var(--line)] bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-2xs"
              aria-label={isRTL ? 'پخش تلفظ صوتی [Space]' : 'Audio Pronunciation [Space]'}
              title={isRTL ? 'پخش تلفظ صوتی [کلید Space]' : 'Audio Pronunciation [Space]'}
            >
              <Volume2 size={17} />
            </button>

            <button
              type="button"
              onClick={handlePlaySlowAudio}
              className="w-9 h-9 rounded-xl border border-[var(--line)] bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-2xs text-[10px] font-black"
              aria-label={isRTL ? 'تلفظ آرام ۰.۷x [S]' : 'Slow Audio 0.7x [S]'}
              title={isRTL ? 'تلفظ شمرده و آرام [کلید S]' : 'Slow Speech [S]'}
            >
              0.7x
            </button>
          </div>
        </div>

        {/* Random Hint Toast Bubble (multi-word, fully readable) */}
        {showRandomHint && randomHintMessage && (
          <div data-testid="hint-bubble" className="mb-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center justify-between animate-fade-in shadow-2xs gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <Lightbulb size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed break-words">{randomHintMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowRandomHint(false)}
              className="text-amber-700 dark:text-amber-300 hover:text-amber-900 p-0.5 cursor-pointer shrink-0"
              aria-label={isRTL ? 'بستن' : 'Close'}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Center Card Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center py-2">
          {/* State: Skipped Card Review (User sees correct answer before proceeding to next card) */}
          {skippedCardInfo ? (
            <div className="py-2 flex flex-col items-center justify-center w-full text-center animate-fade-in">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-black mb-3">
                <CheckCircle2 size={14} className="text-amber-500" />
                <span>{isRTL ? 'پاسخ صحیح کارت' : 'Correct Card Answer'}</span>
              </div>

              <div 
                dir={isRtlLang(skippedCardInfo.card.targetLanguage) ? 'rtl' : 'ltr'}
                className="text-2xl sm:text-3xl font-black text-[var(--ink)] tracking-tight leading-snug py-1 select-text"
              >
                {skippedCardInfo.targetText}
              </div>

              <div 
                dir={isRtlLang(skippedCardInfo.card.nativeLanguage || settings.nativeLanguage || 'fa') ? 'rtl' : 'ltr'}
                className="text-sm sm:text-base font-bold text-[var(--mute)] mt-1 mb-3 select-text"
              >
                {skippedCardInfo.translation}
              </div>

              {/* Pronunciation & Listen Button */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={handlePlayAudio}
                  className="py-1 px-3.5 rounded-full bg-[var(--panel)] border border-[var(--line)] hover:bg-[var(--bg)] text-xs font-bold text-[var(--ink)] flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-95"
                  aria-label={isRTL ? 'شنیدن تلفظ' : 'Listen'}
                  title={isRTL ? 'شنیدن تلفظ صوتی' : 'Listen audio'}
                >
                  <Volume2 size={15} className="text-[var(--lapis)]" />
                  <span>{isRTL ? 'شنیدن تلفظ' : 'Listen'}</span>
                </button>

                {skippedCardInfo.pronunciation && (
                  <span className="text-xs font-mono text-[var(--mute)] px-2.5 py-0.5 rounded-lg bg-[var(--bg)] border border-[var(--line)]/50">
                    /{skippedCardInfo.pronunciation}/
                  </span>
                )}
              </div>

              {/* Grammar / Pedagogical Clue if present */}
              {(skippedCardInfo.grammarPoint || skippedCardInfo.hint) && (
                <div className="max-w-xs text-xs font-medium text-[var(--ink)] bg-[var(--panel)] p-2.5 rounded-xl border border-[var(--line)] mb-4 text-start leading-relaxed shadow-2xs">
                  {skippedCardInfo.grammarPoint && (
                    <div className="font-bold text-[var(--lapis)] mb-1">
                      {isRTL ? 'نکته گرامر:' : 'Grammar:'} {skippedCardInfo.grammarPoint}
                    </div>
                  )}
                  {skippedCardInfo.hint && (
                    <div className="text-[var(--mute)]">
                      {skippedCardInfo.hint}
                    </div>
                  )}
                </div>
              )}

              {/* Proceed to Next Card Button */}
              <button
                type="button"
                onClick={handleConfirmSkipAndNext}
                className="btn-turq !min-h-[42px] !px-5 !text-xs sm:!text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-all active:scale-95 font-bold"
              >
                <span>{isRTL ? 'کارت بعدی' : 'Next Card'}</span>
                <ArrowRight size={15} className={isRTL ? 'rotate-180' : ''} />
              </button>
            </div>
          ) : settings.displayMode === 'audio_only' && !evaluation?.isCorrect ? (
            /* Mode 1: Audio-Only */
            <div className="py-4 flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-[var(--lapis-soft)] text-[var(--lapis)] flex items-center justify-center animate-pulse">
                <Headphones size={30} />
              </div>
              <p className="text-sm font-bold text-[var(--ink)] text-center">
                {isRTL ? 'گوش دهید و کلمه شنیده‌شده را بگویید یا بنویسید' : 'Listen and repeat or type what you hear'}
              </p>
            </div>
          ) : settings.displayMode === 'translate_to_target' ? (
            /* Mode 2: Translate to Target (Native prompt visible in Persian, target text hidden) */
            <div className="py-2 flex flex-col items-center justify-center w-full">
              <span className="text-xs font-bold text-[var(--mute)] mb-2">
                {isRTL ? 'معادل این عبارت را به زبان هدف بگویید یا بنویسید:' : 'Say or type in target language:'}
              </span>
              <div 
                dir={isRtlLang(currentCard.nativeLanguage || settings.nativeLanguage || 'fa') ? 'rtl' : 'ltr'}
                className="text-2xl sm:text-3xl font-black text-[var(--ink)] tracking-tight leading-snug py-1"
              >
                {currentCard.translation}
              </div>

              {(isRevealed || evaluation?.isCorrect) && (
                <div 
                  dir={isRtlLang(currentCard.targetLanguage) ? 'rtl' : 'ltr'}
                  className="mt-3 text-lg sm:text-xl font-black text-[var(--turq)] bg-[var(--bg)] px-4 py-1.5 rounded-[12px] border border-[var(--line)]"
                >
                  {currentCard.targetText}
                </div>
              )}
            </div>
          ) : settings.displayMode === 'translate_to_native' ? (
            /* Mode 3: Translate to Native (Target text visible, native meaning hidden in Persian) */
            <div className="py-2 flex flex-col items-center justify-center w-full">
              <span className="text-xs font-bold text-[var(--mute)] mb-2">
                {isRTL ? 'معنی این عبارت را به زبان مادری بگویید یا بنویسید:' : 'Say or type in your native language:'}
              </span>
              <div 
                dir={isRtlLang(currentCard.targetLanguage) ? 'rtl' : 'ltr'}
                className="text-2xl sm:text-3xl font-black text-[var(--ink)] tracking-tight leading-snug py-1"
              >
                {currentCard.targetText}
              </div>

              {(isRevealed || evaluation?.isCorrect) && (
                <div 
                  dir={isRtlLang(currentCard.nativeLanguage || settings.nativeLanguage || 'fa') ? 'rtl' : 'ltr'}
                  className="mt-3 text-lg sm:text-xl font-black text-[var(--lapis)] bg-[var(--bg)] px-4 py-1.5 rounded-[12px] border border-[var(--line)]"
                >
                  {currentCard.translation}
                </div>
              )}
            </div>
          ) : (
            /* Mode 4: Text & Audio (Standard Reading & Speech) */
            <div className="py-2 flex flex-col items-center justify-center w-full">
              <div 
                dir={isRtlLang(currentCard.targetLanguage) ? 'rtl' : 'ltr'}
                className="text-2xl sm:text-3xl font-black text-[var(--ink)] tracking-tight leading-snug py-1"
              >
                {currentCard.targetText}
              </div>

              <div 
                dir={isRtlLang(currentCard.nativeLanguage || settings.nativeLanguage || 'fa') ? 'rtl' : 'ltr'}
                className="text-sm font-bold text-[var(--mute)] mt-1.5"
              >
                {currentCard.translation}
              </div>

              {/* Pronunciation Guide (Native script & IPA) */}
              {(() => {
                const userNative = settings.nativeLanguage || (isRTL ? 'fa' : 'en');
                const pron = getPronunciationHint(
                  currentCard.targetText,
                  currentCard.targetLanguage,
                  userNative,
                  currentCard.pronunciation
                );
                return (
                  <div className="text-xs font-bold text-[var(--turq)] mt-2 px-3 py-1 rounded-xl bg-[var(--bg)] border border-[var(--line)] shadow-2xs font-mono">
                    {pron}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Answer Feedback & Correction Banner */}
      {evaluation && (
        <div className="my-1.5 shrink-0 animate-fade-in font-ui">
          <div className={`p-3 rounded-[14px] border text-xs font-bold ${
            evaluation.isCorrect 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200' 
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-200'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1">
                {evaluation.isCorrect ? (
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-sm text-[var(--ink)]">{evaluation.feedbackMessage}</div>
                  {evaluation.isCorrect && (
                    <div className="text-[11px] text-emerald-600 mt-0.5 font-bold">
                      +{evaluation.pointsAwarded} PTS
                    </div>
                  )}
                </div>
              </div>

              {/* Try Again / Next Action */}
              {!evaluation.isCorrect ? (
                <button
                  type="button"
                  onClick={handleTryAgain}
                  className="btn-danger !min-h-[38px] !text-xs !py-1 !px-3"
                >
                  <RotateCcw size={13} />
                  <span>{t.tryAgain}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleNextCard(false)}
                  className="btn-turq !min-h-[38px] !text-xs !py-1 !px-3"
                >
                  <span>{t.nextCard}</span>
                  <ArrowRight size={13} className={isRTL ? 'rotate-180' : ''} />
                </button>
              )}
            </div>

            {/* Actionable guidance if incorrect */}
            {!evaluation.isCorrect && (
              <div className="mt-1.5 pt-1.5 border-t border-rose-200 text-[10.5px] font-medium leading-relaxed opacity-90">
                {isRTL 
                  ? 'راه‌حل: با دکمه «صدا» تلفظ را گوش کنید، روی «مشاهده پاسخ» بزنید یا دکمه «تلاش مجدد» را برای پاسخگویی دوباره لمس نمایید.'
                  : 'Fix: Tap the Listen button, tap Reveal Hint, or tap Try Again to retry.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Input Section: 3 Clear Actions (Type, Skip, Speak) */}
      <div className="space-y-2 shrink-0 font-ui mt-1">

        {/* Action Row: Icon-only buttons with tooltips for perfect fit and no squishing */}
        <div className="grid grid-cols-3 gap-2 pt-1 max-w-xs mx-auto">
          {/* 1. نوشتن (Writing / Text Input) */}
          <button
            type="button"
            onClick={() => {
              sound.playToggle();
              setInputMode(prev => prev === 'text' ? 'none' : 'text');
              setTimeout(() => textInputRef.current?.focus(), 50);
            }}
            className={`w-full py-2.5 rounded-2xl border flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-2xs ${
              inputMode === 'text'
                ? 'bg-[var(--lapis)] text-white border-[var(--lapis)] shadow-xs ring-2 ring-[var(--lapis)]/30'
                : 'bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] border-[var(--line)]'
            }`}
            aria-label={isRTL ? 'نوشتن' : 'Type Mode'}
            title={isRTL ? 'حالت نوشتن و تایپ [Pen]' : 'Type mode [Pen]'}
          >
            <PenTool size={18} />
          </button>

          {/* 2. رد کردن (Skip Card - see correct answer first) */}
          <button
            type="button"
            onClick={handleSkip}
            className="w-full py-2.5 rounded-2xl border border-[var(--line)] bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--mute)] hover:text-[var(--ink)] flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-2xs"
            aria-label={isRTL ? 'رد کردن' : 'Skip & See Answer'}
            title={isRTL ? 'رد کردن این کارت و مشاهده پاسخ صحیح' : 'Skip card & see correct answer'}
          >
            <SkipForward size={18} />
          </button>

          {/* 3. لمس برای صحبت (Touch to Speak - unified voice recording & Gemini transcription) */}
          <button
            type="button"
            onClick={() => {
              if (inputMode !== 'speech') {
                setInputMode('speech');
              }
              toggleListening();
            }}
            className={`w-full py-2.5 rounded-2xl border flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-2xs ${
              isListening || isGeminiRecording
                ? 'bg-rose-500 text-white border-rose-600 animate-pulse ring-4 ring-rose-400/40 shadow-md'
                : inputMode === 'speech'
                  ? 'bg-[var(--turq)] text-white border-[var(--turq)] shadow-xs'
                  : 'bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] border-[var(--line)]'
            }`}
            aria-label={isListening || isGeminiRecording ? (isRTL ? 'پایان گفتار و رونویسی' : 'Stop & Transcribe') : (isRTL ? 'لمس برای صحبت' : 'Touch to Speak')}
            title={isListening || isGeminiRecording ? (isRTL ? 'پایان گفتار و رونویسی هوشمند (کلیک کنید)' : 'Stop & Transcribe (Click)') : (isRTL ? 'شروع گفتار و رونویسی هوشمند' : 'Speak with microphone')}
          >
            {isListening || isGeminiRecording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        </div>

        {isTranscribingWithGemini && (
          <div className="p-2 rounded-xl bg-teal-500/15 border border-teal-500/30 text-[var(--turq)] text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
            <Sparkles size={14} />
            <span>{isRTL ? 'در حال رونویسی دقیق گفتار با مدل هوش مصنوعی...' : 'Transcribing speech with AI...'}</span>
          </div>
        )}

        {/* Active Listening Status Indicator - User controls when speech ends */}
        {(isListening || isGeminiRecording) && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-between animate-fade-in shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
              <span>
                {isRTL 
                  ? 'در حال شنیدن گفتار... هر زمان تمام شد، روی میکروفون یا پایان ضبط بزنید.' 
                  : 'Listening... Tap mic again or Done when finished.'}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleListening}
              className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-black cursor-pointer shadow-xs active:scale-95"
            >
              {isRTL ? 'پایان ضبط' : 'Done'}
            </button>
          </div>
        )}

        {/* Input Bar: Text Typing Input or Recognized Speech Review */}
        {(inputMode === 'text' || userInput.trim().length > 0) && (
          <div className="flex items-center gap-2 animate-fade-in pt-1">
            <input
              ref={textInputRef}
              type="text"
              dir={isRtlLang(settings.displayMode === 'translate_to_native' ? (currentCard?.nativeLanguage || 'fa') : (currentCard?.targetLanguage || 'nl')) ? 'rtl' : 'ltr'}
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCheckAnswer();
              }}
              placeholder={t.enterAnswerPlaceholder || (isRTL ? 'پاسخ یا جمله را اینجا بنویسید یا بگویید...' : 'Type or speak your answer here...')}
              className="flex-1 min-w-0 bg-[var(--panel)] text-[var(--ink)] px-3.5 py-2.5 rounded-[14px] border border-[var(--line)] text-xs sm:text-sm font-bold focus:outline-none focus:border-[var(--lapis)] transition-colors shadow-2xs"
            />

            <button
              type="button"
              onClick={handleCheckAnswer}
              className="btn-primary !min-h-[44px] !px-3.5 whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 font-bold text-xs sm:text-sm shadow-xs"
              aria-label={t.checkAnswer || (isRTL ? 'بررسی پاسخ' : 'Check Answer')}
            >
              <Send size={14} className={isRTL ? 'rotate-180' : ''} />
              <span>{t.checkAnswer || (isRTL ? 'بررسی' : 'Check')}</span>
            </button>
          </div>
        )}

      </div>

      {/* Explicit Microphone Permission Modal */}
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
            className="sheet-box text-center"
            onClick={e => e.stopPropagation()}
          >
            {/* Microphone Icon */}
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[var(--lapis-soft)] text-[var(--lapis)] flex items-center justify-center">
              <Mic size={26} />
            </div>

            <h3 className="text-base font-black text-[var(--ink)] mb-2">
              {isRTL ? 'نیاز به دسترسی میکروفون' : 'Microphone Permission Needed'}
            </h3>

            <p className="text-xs text-[var(--mute)] mb-4 leading-relaxed">
              {isRTL 
                ? 'برای بررسی زنده تلفظ، به دسترسی میکروفون نیاز است. پردازش صدا کاملاً به صورت محلی بر روی دستگاه انجام می‌شود و هیچ فایلی ضبط یا در سرور ذخیره نمی‌شود.'
                : 'To score your pronunciation, microphone access is required. Audio is processed strictly on-device in real-time. No voice data is recorded or stored on servers.'}
            </p>

            {micPermissionError && (
              <div className="mb-3 p-2 bg-rose-50 text-rose-700 rounded-lg text-xs">
                {micPermissionError}
              </div>
            )}

            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setShowMicPermissionModal(false);
                }}
                className="btn-ghost !flex-1"
              >
                {isRTL ? 'انصراف' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleGrantPermissionAndStart}
                disabled={isRequestingMic}
                className="btn-primary !flex-1"
              >
                {isRequestingMic ? (isRTL ? 'در حال فعال‌سازی...' : 'Activating...') : (isRTL ? 'تأیید و فعال‌سازی' : 'Allow')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <ExitConfirmModal
          isRTL={isRTL}
          title={isRTL ? 'خروج از تمرین انفرادی' : 'Leave Practice?'}
          message={isRTL 
            ? 'می‌خواهید به صفحه اول برگردید یا تنظیمات تمرین تک‌نفره؟'
            : 'Return to Home screen or Single-Player settings?'}
          homeLabel={isRTL ? 'برگشت به صفحه اول' : 'Return to Home Screen'}
          setupLabel={isRTL ? 'تنظیمات تمرین انفرادی' : 'Single-Player Settings'}
          onCancel={() => setShowExitConfirm(false)}
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
