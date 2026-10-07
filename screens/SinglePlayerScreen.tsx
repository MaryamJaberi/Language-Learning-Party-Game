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
import { markCardsAsSeen, saveWeakCards, getPersonalRecords, updatePersonalRecords } from '../contentEngine';
import { feedbackDirector } from '../feedbackDirector';
import { SoundHeaderButton } from '../components/SoundHeaderButton';
import ExitConfirmModal from '../components/ExitConfirmModal';
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
  KeyRound
} from 'lucide-react';

interface Props {
  initialCards: LanguageCard[];
  initialSettings: SinglePlayerSettings;
  uiLanguage: Language;
  onFinish: (report: SinglePlayerSessionReport) => void;
  onExit: () => void;
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
  onOpenLeaderboard
}) => {
  const t = tUI(uiLanguage);
  const isRTL = isRtlLang(uiLanguage);

  const [cards] = useState<LanguageCard[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [settings, setSettings] = useState<SinglePlayerSettings>(initialSettings);
  
  // Input State
  const [userInput, setUserInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  
  // Microphone Permission Request State (User asked: ask for permission every time user taps mic)
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

  // Rounds & Escalating Speedrun Timer
  const totalCardsCount = cards.length;
  const round1End = Math.max(1, Math.floor(totalCardsCount / 3));
  const round2End = Math.max(2, Math.floor((totalCardsCount * 2) / 3));
  const currentRound = currentIndex < round1End ? 1 : currentIndex < round2End ? 2 : 3;
  const totalRounds = 3;

  // Escalating timer calculation (Diminishing seconds per round as user requested)
  const baseSeconds = settings.timeLimitSeconds > 0 ? settings.timeLimitSeconds : 22;
  const currentRoundTimeLimit = 
    currentRound === 1 
      ? baseSeconds 
      : currentRound === 2 
        ? Math.max(8, Math.round(baseSeconds * 0.72)) 
        : Math.max(5, Math.round(baseSeconds * 0.48));

  // Timer per card
  const [cardTimer, setCardTimer] = useState(currentRoundTimeLimit);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const recognitionRef = useRef<any>(null);
  const prevRoundRef = useRef<number>(1);

  // Personal Records
  const [personalRecords] = useState(getPersonalRecords());
  const fastestAnswerRef = useRef<number>(999);
  const [roundNotification, setRoundNotification] = useState<string | null>(null);
  const [isNewRecordAlert, setIsNewRecordAlert] = useState(false);

  const currentCard: LanguageCard | undefined = cards[currentIndex];

  // Keep settings in sync when initialSettings changes
  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  // Non-option Smart Hint Calculations (Replaces multiple-choice with word structure & anagram clues)
  const targetAnswerForHint = useMemo(() => {
    if (!currentCard) return '';
    const isNativeAnswer = settings.displayMode === 'translate_to_native';
    return (isNativeAnswer ? currentCard.translation : currentCard.targetText) || '';
  }, [currentCard, settings.displayMode]);

  // Scrambled letters bank (shuffled letters of the word for anagram clue)
  const scrambledLetters = useMemo<string[]>(() => {
    if (!targetAnswerForHint) return [];
    // Extract non-space characters
    const cleanChars: string[] = targetAnswerForHint.split('').filter((ch: string) => ch.trim() !== '');
    // Shuffle array
    const shuffled = [...cleanChars];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [targetAnswerForHint]);

  // Total alphabetic letters count in answer
  const totalLettersCount = useMemo<number>(() => {
    return targetAnswerForHint.split('').filter((ch: string) => ch.trim() !== '').length;
  }, [targetAnswerForHint]);

  const handleRevealMoreLetter = () => {
    sound.playToggle();
    setRevealedLettersCount(prev => Math.min(prev + 1, Math.max(1, totalLettersCount - 1)));
  };

  const handleAddLetterToInput = (letter: string) => {
    sound.playClick();
    setUserInput(prev => prev + letter);
  };

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
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
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserInput(transcript);
        setActionableError(null);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setActionableError(
            isRTL
              ? 'دسترسی به میکروفون مسدود است. راه‌حل: در نوار آدرس مرورگر روی علامت قفل یا میکروفون بزنید و اجازه دسترسی (Allow) دهید، یا پاسخ را در کادر پایین تایپ نمایید.'
              : 'Microphone access is denied. Fix: Allow microphone in browser settings or type your answer.'
          );
        } else if (event.error === 'no-speech') {
          setActionableError(
            isRTL
              ? 'صدایی شنیده نشد. راه‌حل: لطفاً به میکروفون نزدیک‌تر شوید و واضح صحبت کنید، یا پاسخ را در کادر تایپ کنید.'
              : 'No speech was detected. Fix: Speak closer to your microphone or type your answer.'
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
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

  // Handle Escalating Card Timer & Auto-Play Audio
  useEffect(() => {
    if (!currentCard) return;

    setUserInput('');
    setEvaluation(null);
    setAttempts(1);
    setIsRevealed(false);
    setShowHintSection(false);
    setRevealedLettersCount(1);
    startTimeRef.current = Date.now();

    // Check if round advanced to notify user about tighter timer
    if (currentRound > prevRoundRef.current) {
      prevRoundRef.current = currentRound;
      sound.playPowerUp();
      setRoundNotification(
        currentRound === 2 
          ? (isRTL ? `⚡ دور ۲ از ۳: زمان کاهش یافت (${currentRoundTimeLimit} ثانیه)! سرعت را بیشتر کن!` : `⚡ Round 2 of 3: Timer tightens to ${currentRoundTimeLimit}s!`)
          : (isRTL ? `🔥 دور ۳ از ۳: سرعت توربو رعدآسا (${currentRoundTimeLimit} ثانیه)! مرحله نهایی!` : `🔥 Round 3 of 3: Turbo speedrun ${currentRoundTimeLimit}s! Final push!`)
      );
      setTimeout(() => setRoundNotification(null), 3500);
    }

    setCardTimer(currentRoundTimeLimit);
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = window.setInterval(() => {
      setCardTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          sound.playPass();
          setIsRevealed(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-play audio in audio_only mode or if autoPlayAudio enabled
    if (settings.displayMode === 'audio_only' || settings.autoPlayAudio) {
      sound.speakNative(currentCard.targetText, currentCard.targetLanguage);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, currentCard?.id, currentRound, currentRoundTimeLimit, settings.displayMode, settings.autoPlayAudio]);

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) return;
    sound.playClick();

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    } else {
      // Prompt user explicitly for microphone permission when clicking the mic
      setMicPermissionError(null);
      setShowMicPermissionModal(true);
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

    const timeRatio = settings.timeLimitSeconds > 0 
      ? Math.max(0, cardTimer / settings.timeLimitSeconds) 
      : 1.0;

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
      const points = evalResult.pointsAwarded;
      const newScore = totalScore + points;
      setTotalScore(newScore);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);

      // --- GAME FEEL LAYERS 1, 2, 3 ---
      // Layer 1 & 2: Score Pop + Combo Audio + Particle Sparks + Screen Shake
      feedbackDirector.triggerScoreGained({
        points,
        combo: newStreak,
        label: newStreak > 1 ? `+${points} ×${newStreak}` : `+${points} PTS`
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
    } else {
      sound.playPass();
      setStreak(0);
      setAttempts(prev => prev + 1);
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
    }

    if (currentIndex + 1 < cards.length) {
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
      weakCards
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
      className="app w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto min-h-screen px-3 sm:px-4 pb-12 font-ui relative flex flex-col justify-between"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* 1. Header (sticky, always visible matching HTML design) */}
      <header className="sticky top-0 z-20 bg-[var(--bg)] flex items-center justify-between py-2.5 px-0.5 border-b border-[var(--line)]/50">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowExitConfirm(true);
            }}
            className="ib"
            aria-label={t.exit || 'خروج'}
            title={t.exit || 'خروج'}
          >
            <ArrowLeft size={19} className={isRTL ? 'rotate-180' : ''} />
          </button>
          <div>
            <div className="flex items-center gap-1.5 min-w-0">
              <h1 className="text-base sm:text-xl font-black leading-none text-[var(--ink)] whitespace-nowrap truncate">
                {t.singlePlayer || 'تمرین تک‌نفره'}
              </h1>
              <span className="text-[10px] font-bold text-[var(--turq)] bg-[var(--turq)]/10 px-2 py-0.5 rounded-full border border-[var(--turq)]/20 shrink-0">
                {currentCard?.cefrLevel ? `سطح ${currentCard.cefrLevel}` : 'A1'}
              </span>
            </div>
            <span className="text-[11px] font-bold text-[var(--mute)]">
              {isRTL 
                ? `دور ${toPersian(currentRound, isRTL)} از ۳ • کارت ${toPersian(currentIndex + 1, isRTL)} از ${toPersian(cards.length, isRTL)}`
                : `Round ${currentRound}/3 • Card ${currentIndex + 1}/${cards.length}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Score Badge */}
          <div className="px-2.5 py-1 rounded-full bg-[var(--panel)] border border-[var(--line)] text-xs font-black text-[var(--ink)] flex items-center gap-1 shadow-xs">
            <span>{toPersian(totalScore, isRTL)}</span>
            <span className="text-[10px] text-[var(--mute)]">PTS</span>
          </div>

          {/* Sound Toggle Button */}
          <SoundHeaderButton 
            variant="icon-only" 
            language={isRTL ? 'fa' : 'en'} 
            className="w-9 h-9 p-0" 
          />
        </div>
      </header>

      {/* 2. Mode Selector Segment (Clean .seg from HTML) */}
      <div className="mt-2 shrink-0">
        <div className="seg" role="radiogroup" aria-label="حالت تمرین">
          <button
            type="button"
            aria-checked={settings.displayMode === 'text_and_audio'}
            onClick={() => {
              sound.playClick();
              setSettings(s => ({ ...s, displayMode: 'text_and_audio' }));
              setEvaluation(null);
            }}
          >
            {isRTL ? 'روخوانی' : 'Read'}
          </button>
          <button
            type="button"
            aria-checked={settings.displayMode === 'translate_to_target'}
            onClick={() => {
              sound.playClick();
              setSettings(s => ({ ...s, displayMode: 'translate_to_target' }));
              setEvaluation(null);
            }}
          >
            {isRTL ? 'به هدف' : 'To Target'}
          </button>
          <button
            type="button"
            aria-checked={settings.displayMode === 'translate_to_native'}
            onClick={() => {
              sound.playClick();
              setSettings(s => ({ ...s, displayMode: 'translate_to_native' }));
              setEvaluation(null);
            }}
          >
            {isRTL ? 'به مادری' : 'To Native'}
          </button>
          <button
            type="button"
            aria-checked={settings.displayMode === 'audio_only'}
            onClick={() => {
              sound.playClick();
              setSettings(s => ({ ...s, displayMode: 'audio_only' }));
              setEvaluation(null);
            }}
          >
            {isRTL ? 'شنیداری' : 'Audio'}
          </button>
        </div>
      </div>

      {/* 3. Progress Bar & Escalating Timer */}
      <div className="mt-2 shrink-0">
        <div className="flex items-center justify-between text-[11px] font-bold text-[var(--mute)] mb-1">
          <span>{isRTL ? `کارت ${toPersian(currentIndex + 1, isRTL)} از ${toPersian(cards.length, isRTL)}` : `Card ${currentIndex + 1} of ${cards.length}`}</span>
          <span className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${cardTimer <= 4 ? 'bg-[var(--danger)] text-white animate-pulse' : 'bg-[var(--panel)] text-[var(--ink)] border border-[var(--line)]'}`}>
            ⏱️ {toPersian(cardTimer, isRTL)}s
          </span>
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

      {/* Round Transition Notification Banner */}
      {roundNotification && (
        <div className="mt-2 p-2.5 rounded-[14px] bg-[var(--saffron)] text-[var(--on-saffron)] text-xs font-black text-center shadow-xs">
          {roundNotification}
        </div>
      )}

      {/* 4. Center Interactive Flashcard in .panel style (Clean, no category tag) */}
      <div className="panel my-2 flex-1 flex flex-col justify-between relative !p-5">
        {/* Top of card: Language code + listen button */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <FlagIcon language={currentCard.targetLanguage} size={18} />
            <span className="text-xs font-black uppercase text-[var(--mute)] tracking-wider">
              {currentCard.targetLanguage}
            </span>
          </div>

          <button
            type="button"
            onClick={handlePlayAudio}
            className="ib !w-9 !h-9"
            aria-label={isRTL ? 'پخش تلفظ صوتی' : 'Audio Pronunciation'}
            title={isRTL ? 'پخش تلفظ صوتی' : 'Audio Pronunciation'}
          >
            <Volume2 size={16} />
          </button>
        </div>

        {/* Center Card Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center py-2">
          {/* Mode 1: Audio-Only */}
          {settings.displayMode === 'audio_only' && !evaluation?.isCorrect ? (
            <div className="py-4 flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-[var(--lapis-soft)] text-[var(--lapis)] flex items-center justify-center animate-pulse">
                <Headphones size={30} />
              </div>
              <p className="text-sm font-bold text-[var(--ink)] text-center">
                {isRTL ? 'گوش دهید و کلمه شنیده‌شده را بگویید یا بنویسید' : 'Listen and repeat or type what you hear'}
              </p>
              {!showHintSection && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playToggle();
                    setShowHintSection(true);
                  }}
                  className="mt-2 text-xs font-bold text-[var(--lapis)] hover:underline flex items-center gap-1.5 bg-[var(--lapis-soft)] px-3.5 py-1.5 rounded-full cursor-pointer transition-transform active:scale-95 shadow-2xs"
                >
                  <Lightbulb size={13} className="text-[var(--saffron)]" />
                  <span>{isRTL ? '💡 سرنخ و حروف کمکی' : '💡 Clue & Letter Hints'}</span>
                </button>
              )}
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

              {isRevealed || evaluation?.isCorrect ? (
                <div 
                  dir={isRtlLang(currentCard.targetLanguage) ? 'rtl' : 'ltr'}
                  className="mt-3 text-lg sm:text-xl font-black text-[var(--turq)] bg-[var(--bg)] px-4 py-1.5 rounded-[12px] border border-[var(--line)]"
                >
                  {currentCard.targetText}
                </div>
              ) : (
                !showHintSection && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playToggle();
                      setShowHintSection(true);
                    }}
                    className="mt-3 text-xs font-bold text-[var(--lapis)] hover:underline flex items-center gap-1.5 bg-[var(--lapis-soft)] px-3.5 py-1.5 rounded-full cursor-pointer transition-transform active:scale-95 shadow-2xs"
                  >
                    <Lightbulb size={13} className="text-[var(--saffron)]" />
                    <span>{isRTL ? '💡 سرنخ و حروف کمکی' : '💡 Clue & Letter Hints'}</span>
                  </button>
                )
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

              {isRevealed || evaluation?.isCorrect ? (
                <div 
                  dir={isRtlLang(currentCard.nativeLanguage || settings.nativeLanguage || 'fa') ? 'rtl' : 'ltr'}
                  className="mt-3 text-lg sm:text-xl font-black text-[var(--lapis)] bg-[var(--bg)] px-4 py-1.5 rounded-[12px] border border-[var(--line)]"
                >
                  {currentCard.translation}
                </div>
              ) : (
                !showHintSection && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playToggle();
                      setShowHintSection(true);
                    }}
                    className="mt-3 text-xs font-bold text-[var(--lapis)] hover:underline flex items-center gap-1.5 bg-[var(--lapis-soft)] px-3.5 py-1.5 rounded-full cursor-pointer transition-transform active:scale-95 shadow-2xs"
                  >
                    <Lightbulb size={13} className="text-[var(--saffron)]" />
                    <span>{isRTL ? '💡 سرنخ و حروف کمکی' : '💡 Clue & Letter Hints'}</span>
                  </button>
                )
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

              {currentCard.pronunciation && (
                <div className="text-xs font-mono font-bold text-[var(--turq)] mt-1.5 px-2.5 py-0.5 rounded-full bg-[var(--bg)] border border-[var(--line)]">
                  🗣️ [{currentCard.pronunciation}]
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card bottom footer */}
        <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between text-xs font-bold text-[var(--mute)]">
          <span>{currentCard.contentType || 'عبارت'}</span>
          <span>+{currentCard.points || 1} امتیاز</span>
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

      {/* 5. Input Section: 4 Interactive Choices, Mic button and Text Input */}
      <div className="space-y-2 shrink-0 font-ui mt-1">
        {/* Smart Progressive Non-Choice Clue Section (Replaces easy multiple-choice with word structure & anagrams) */}
        {!evaluation?.isCorrect && targetAnswerForHint && (
          <div className="pt-0.5">
            {!showHintSection ? (
              <button
                type="button"
                onClick={() => {
                  sound.playToggle();
                  setShowHintSection(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-[var(--lapis)]/40 hover:border-[var(--lapis)] bg-[var(--lapis-soft)]/50 hover:bg-[var(--lapis-soft)] text-[var(--lapis)] text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer shadow-2xs"
              >
                <Lightbulb size={15} className="text-[var(--saffron)]" />
                <span>{isRTL ? '💡 سرنخ و حروف کمکی (بدون گزینه حاضری)' : '💡 Clue & Letter Hints (No Choices)'}</span>
                <ChevronDown size={14} />
              </button>
            ) : (
              <div className="animate-fadeIn space-y-2.5 bg-[var(--panel)] p-3 rounded-2xl border border-[var(--line)] shadow-xs">
                {/* Header */}
                <div className="text-[11px] font-bold text-[var(--mute)] px-0.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[var(--lapis)] font-black">
                    <Lightbulb size={14} className="text-[var(--saffron)]" />
                    <span>{isRTL ? 'راهنمای ساختار و حروف (برای تقویت ذهن)' : 'Structure & Letter Clues'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playToggle();
                      setShowHintSection(false);
                    }}
                    className="text-[10px] font-bold text-[var(--mute)] hover:text-[var(--ink)] flex items-center gap-1 py-1 px-2 rounded-lg bg-[var(--bg)] border border-[var(--line)] cursor-pointer hover:bg-[var(--line)]/40 transition-colors"
                    title={isRTL ? 'بستن راهنما' : 'Hide hint'}
                  >
                    <span>{isRTL ? 'مخفی‌سازی' : 'Hide'}</span>
                    <ChevronUp size={12} />
                  </button>
                </div>

                {/* Educational / Semantic Clue from card */}
                {currentCard?.hint && (
                  <div className="text-xs font-bold text-[var(--ink)] bg-[var(--saffron)]/15 border border-[var(--saffron)]/30 rounded-xl px-2.5 py-1.5 flex items-start gap-1.5 leading-relaxed">
                    <span className="shrink-0 text-sm mt-0.5">💡</span>
                    <div>
                      <span className="text-[10px] text-[var(--mute)] block">{isRTL ? 'سرنخ مفهومی:' : 'Concept Clue:'}</span>
                      <span>{currentCard.hint}</span>
                    </div>
                  </div>
                )}

                {/* 1. Letter Slots / Masked Word Clue */}
                <div className="bg-[var(--bg)] p-2.5 rounded-xl border border-[var(--line)] space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-[var(--mute)]">
                      {isRTL 
                        ? `ساختار پاسخ (${totalLettersCount} حرف)`
                        : `Word Structure (${totalLettersCount} letters)`}
                    </span>
                    {revealedLettersCount < totalLettersCount - 1 && (
                      <button
                        type="button"
                        onClick={handleRevealMoreLetter}
                        className="text-[10px] font-bold text-[var(--teal)] hover:underline flex items-center gap-1 bg-[var(--teal)]/10 px-2 py-0.5 rounded-md border border-[var(--teal)]/20 active:scale-95 transition-all cursor-pointer"
                      >
                        <KeyRound size={11} />
                        <span>{isRTL ? '+۱ حرف کمکی' : '+1 Letter'}</span>
                      </button>
                    )}
                  </div>

                  {/* Render Masked Words & Letter Slots */}
                  <div 
                    dir={isRtlLang(settings.displayMode === 'translate_to_native' ? (currentCard?.nativeLanguage || 'fa') : (currentCard?.targetLanguage || 'en-US')) ? 'rtl' : 'ltr'}
                    className="flex flex-wrap items-center justify-center gap-1.5 py-1 select-none"
                  >
                    {(() => {
                      let globalLetterIdx = 0;
                      return targetAnswerForHint.split(' ').map((word, wIdx) => (
                        <div key={`word-${wIdx}`} className="flex items-center gap-1 mx-1">
                          {word.split('').map((char: string, cIdx: number) => {
                            const isNonLetter = !/\p{L}/u.test(char);
                            if (isNonLetter) {
                              return (
                                <span key={`char-${wIdx}-${cIdx}`} className="text-sm font-bold text-[var(--mute)] px-0.5">
                                  {char}
                                </span>
                              );
                            }
                            const currentIdx = globalLetterIdx++;
                            const isRevealedChar = currentIdx === 0 || currentIdx < revealedLettersCount;
                            return (
                              <span
                                key={`slot-${wIdx}-${cIdx}`}
                                className={`w-6 h-7 sm:w-7 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-black transition-all ${
                                  isRevealedChar
                                    ? 'bg-[var(--teal)]/15 text-[var(--teal)] border border-[var(--teal)]/40 shadow-2xs'
                                    : 'bg-[var(--panel)] text-transparent border-b-2 border-[var(--mute)]'
                                }`}
                              >
                                {isRevealedChar ? char : '_'}
                              </span>
                            );
                          })}
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* 2. Scrambled Letters Pool (Anagram clue - gives user the pieces without giving away the answer) */}
                {scrambledLetters.length > 0 && (
                  <div className="bg-[var(--bg)] p-2.5 rounded-xl border border-[var(--line)] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[var(--mute)]">
                      <span>{isRTL ? 'حروف تشکیل‌دهنده (درهم‌ریخته • برای افزودن لمس کنید):' : 'Scrambled Letters (Tap to add):'}</span>
                      {userInput.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setUserInput(prev => prev.slice(0, -1))}
                          className="text-[10px] text-[var(--vermilion)] hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                        >
                          <span>{isRTL ? '⌫ پاک‌کردن حرف' : '⌫ Backspace'}</span>
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-1.5 py-1">
                      {scrambledLetters.map((letter, lIdx) => (
                        <button
                          key={`scr-${lIdx}-${letter}`}
                          type="button"
                          onClick={() => handleAddLetterToInput(letter)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[var(--panel)] hover:bg-[var(--lapis-soft)] text-[var(--ink)] border border-[var(--line)] hover:border-[var(--lapis)] text-xs sm:text-sm font-black flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-2xs"
                          title={letter}
                        >
                          {letter}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Large Speaking Mic Button */}
        {speechSupported ? (
          <div>
            <button
              type="button"
              onClick={toggleListening}
              className={`btn-turq w-full !min-h-[48px] !text-sm sm:!text-base ${
                isListening ? '!bg-[var(--danger)] animate-pulse' : ''
              }`}
            >
              {isListening ? (
                <>
                  <MicOff size={20} />
                  <span>{t.stopListening} ({isRTL ? 'در حال شنیدن...' : 'Listening...'})</span>
                </>
              ) : (
                <>
                  <Mic size={20} />
                  <span>{t.tapToSpeak}</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="text-[11px] text-[var(--mute)] text-center font-bold">
            {t.micNotSupported}
          </div>
        )}

        {/* Text Input with Submit */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            dir={isRtlLang(settings.displayMode === 'translate_to_native' ? (currentCard?.nativeLanguage || 'fa') : (currentCard?.targetLanguage || 'nl')) ? 'rtl' : 'ltr'}
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCheckAnswer();
            }}
            placeholder={t.enterAnswerPlaceholder || (isRTL ? 'پاسخ را بنویسید یا بگویید...' : 'Type or speak answer...')}
            className="flex-1 min-w-0 bg-[var(--panel)] text-[var(--ink)] px-3.5 py-2.5 rounded-[14px] border border-[var(--line)] text-xs sm:text-sm font-bold focus:outline-none focus:border-[var(--lapis)] transition-colors"
          />

          <button
            type="button"
            onClick={handleCheckAnswer}
            className="btn-primary !min-h-[44px] !px-3.5 whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 font-bold text-xs sm:text-sm"
          >
            <Send size={14} className={isRTL ? 'rotate-180' : ''} />
            <span className="whitespace-nowrap">{t.checkAnswer}</span>
          </button>
        </div>

        {/* Skip Card / Hint Actions */}
        <div className="flex items-center justify-between text-xs font-bold text-[var(--mute)] pt-1">
          <button
            type="button"
            onClick={() => handleNextCard(true)}
            className="hover:text-[var(--ink)] transition-colors py-1 cursor-pointer flex items-center gap-1"
          >
            <span>{isRTL ? 'رد کردن این کارت ⏭️' : 'Skip Card ⏭️'}</span>
          </button>

          {!showHintSection && !evaluation?.isCorrect && (
            <button
              type="button"
              onClick={() => {
                sound.playToggle();
                setShowHintSection(true);
              }}
              className="text-[var(--lapis)] hover:underline flex items-center gap-1 py-1 cursor-pointer font-bold"
            >
              <Lightbulb size={13} className="text-[var(--saffron)]" />
              <span>{isRTL ? 'سرنخ و حروف کمکی 💡' : 'Clue & Hints 💡'}</span>
            </button>
          )}
        </div>

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
          onCancel={() => setShowExitConfirm(false)}
          onConfirm={() => {
            setShowExitConfirm(false);
            onExit();
          }}
        />
      )}
    </div>
  );
};

export default SinglePlayerScreen;
