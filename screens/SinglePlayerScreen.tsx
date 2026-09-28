import React, { useState, useEffect, useRef } from 'react';
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
import { 
  Mic, 
  MicOff, 
  Volume2, 
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
  X
} from 'lucide-react';

interface Props {
  initialCards: LanguageCard[];
  initialSettings: SinglePlayerSettings;
  uiLanguage: Language;
  onFinish: (report: SinglePlayerSessionReport) => void;
  onExit: () => void;
  onOpenLeaderboard: () => void;
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
  
  // Game progress & evaluation state
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [attempts, setAttempts] = useState(1);
  const [isRevealed, setIsRevealed] = useState(false);
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

      const targetLang = currentCard?.targetLanguage || settings.targetLanguage;
      const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === targetLang);
      const langCode = langInfo?.speechCode || SPEECH_LANG_MAP[targetLang] || 'en-US';
      recognition.lang = langCode;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
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

  const handleCheckAnswer = () => {
    if (!currentCard || !userInput.trim()) return;

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

    const evalResult = evaluateAnswer(
      currentCard,
      userInput,
      attempts,
      timeRatio,
      uiLanguage
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

      // Record fastest answer time for personal records
      const timeSpent = Math.max(0.5, Math.round(((Date.now() - startTimeRef.current) / 1000) * 10) / 10);
      if (timeSpent < fastestAnswerRef.current) {
        fastestAnswerRef.current = timeSpent;
      }

      // Check if player beat their personal high score during the game
      if (newScore > personalRecords.highestScore && !isNewRecordAlert && personalRecords.highestScore > 0) {
        setIsNewRecordAlert(true);
        sound.playSuccess();
      }

      // Record result
      const resEntry: SinglePlayerCardResult = {
        card: currentCard,
        userAnswer: userInput,
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
      <div className="h-full flex items-center justify-center p-4 text-[#1E1B2E] text-center font-ui" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="bg-[#FFFBF4] border-2 border-[#1E1B2E] rounded-[24px] shadow-[4px_4px_0px_0px_#1E1B2E] p-6 max-w-sm">
          <p className="font-bold mb-4">{isRTL ? 'کارتی برای نمایش وجود ندارد.' : 'No cards available.'}</p>
          <button onClick={onExit} className="pixel-btn pixel-btn-orange py-2 px-4 rounded-[14px]">
            {isRTL ? 'بازگشت' : 'Back'}
          </button>
        </div>
      </div>
    );
  }

  const isAudioOnly = settings.displayMode === 'audio_only';

  return (
    <div 
      className="h-full min-h-0 flex-1 flex flex-col justify-between p-3.5 sm:p-4 text-[#1E1B2E] select-none overflow-y-auto overscroll-contain font-ui"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Top Controls Bar */}
      <div className="w-full max-w-sm mx-auto flex items-center justify-between shrink-0 mb-1.5 gap-1.5 font-ui">
        <button
          onClick={() => {
            sound.playClick();
            onExit();
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-[12px] bg-[#FFFBF4] border-2 border-[#1E1B2E] text-xs font-bold text-[#1E1B2E] hover:bg-[#F4EDE1] shadow-[2px_2px_0px_0px_#1E1B2E]"
        >
          <ArrowLeft size={14} className={isRTL ? 'rotate-180' : ''} />
          <span>{t.exit}</span>
        </button>

        {/* Direct Leaderboard Button */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenLeaderboard();
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-[12px] bg-[#F2B63D] hover:bg-[#e0a634] text-[#1E1B2E] text-xs font-bold border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E] active:translate-y-0.5"
          title={isRTL ? 'مشاهده لیدربرد' : 'Leaderboard'}
        >
          <Trophy size={13} />
          <span>{isRTL ? 'لیدربرد' : 'Leaderboard'}</span>
        </button>

        {/* Display Mode Switcher */}
        <div className="flex items-center gap-0.5 bg-[#FFFBF4] p-1 rounded-[12px] border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E] text-[11px] font-bold">
          <button
            onClick={() => {
              sound.playClick();
              setSettings(s => ({ ...s, displayMode: 'text_and_audio' }));
            }}
            className={`px-2 py-0.5 rounded-[8px] flex items-center gap-1 transition-all ${
              !isAudioOnly ? 'bg-[#1E9E93] text-white font-bold' : 'text-[#1E1B2E]/60'
            }`}
          >
            <FileText size={12} />
            <span className="hidden xs:inline">{isRTL ? 'متن+صدا' : 'Text'}</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setSettings(s => ({ ...s, displayMode: 'audio_only' }));
            }}
            className={`px-2 py-0.5 rounded-[8px] flex items-center gap-1 transition-all ${
              isAudioOnly ? 'bg-[#E0603F] text-white font-bold' : 'text-[#1E1B2E]/60'
            }`}
          >
            <Headphones size={12} />
            <span className="hidden xs:inline">{isRTL ? 'شنیداری' : 'Audio'}</span>
          </button>
        </div>

        {/* Score & Streak */}
        <div className="flex items-center gap-1.5">
          {streak > 1 && (
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-[8px] bg-[#E0603F] text-white text-[11px] font-bold border border-[#1E1B2E]">
              <Flame size={12} fill="#F2B63D" color="#F2B63D" />
              <span>{streak}</span>
            </div>
          )}
          <div className="px-2 py-1 rounded-[12px] bg-[#FFFBF4] border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E] text-xs font-bold text-[#1E1B2E] text-right">
            {totalScore} <span className="text-[9px] text-[#1E1B2E]/60">PTS</span>
          </div>
        </div>
      </div>

      {/* Round & Personal Record Sub-bar */}
      <div className="w-full max-w-sm mx-auto mb-1.5 px-1 flex items-center justify-between text-[11px] font-bold text-[#1E1B2E] shrink-0 font-ui">
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-[8px] bg-[#E0603F] text-white text-[10.5px] font-bold border border-[#1E1B2E] shadow-[1px_1px_0px_0px_#1E1B2E]">
            ⚡ {isRTL ? `دور ${currentRound} از ${totalRounds}` : `Round ${currentRound}/${totalRounds}`}
          </span>
          <span className="text-[#1E1B2E]/80 text-[10.5px]">
            {currentRound === 1 
              ? (isRTL ? 'دست‌گرمی' : 'Warm-up') 
              : currentRound === 2 
                ? (isRTL ? 'افزایش سرعت' : 'Speed Up') 
                : (isRTL ? 'توربو رعدآسا' : 'Turbo')}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[#1E1B2E] text-[10.5px]">
          <span>{isRTL ? 'بهترین رکورد:' : 'Best:'}</span>
          <span className="font-bold font-mono text-[#E0603F]">{personalRecords.highestScore}</span>
        </div>
      </div>

      {/* Round Transition Notification Banner */}
      {roundNotification && (
        <div className="w-full max-w-sm mx-auto mb-2 p-2.5 rounded-[18px] bg-[#F2B63D] text-[#1E1B2E] text-xs font-bold text-center shadow-[3px_3px_0px_0px_#1E1B2E] border-2 border-[#1E1B2E] animate-bounce shrink-0 font-ui">
          {roundNotification}
        </div>
      )}

      {/* Progress & Escalating Timer Bar */}
      <div className="w-full max-w-sm mx-auto mb-2 shrink-0 font-ui">
        <div className="flex items-center justify-between text-[11px] font-bold text-[#1E1B2E] mb-1">
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 bg-[#1E9E93] text-white rounded-[6px] border border-[#1E1B2E] font-bold text-[10px]">
              {currentCard.cefrLevel || 'A1'}
            </span>
            <span>{t.cardOf?.replace('{n}', String(currentIndex + 1)).replace('{total}', String(cards.length)) || `${currentIndex + 1} / ${cards.length}`}</span>
          </div>

          {/* Escalating Timer Display */}
          <div className={`font-mono font-bold text-xs px-2 py-0.5 rounded-[8px] border-2 border-[#1E1B2E] shadow-[1px_1px_0px_0px_#1E1B2E] ${
            cardTimer <= 4 
              ? 'bg-[#E0603F] text-white animate-bounce' 
              : 'bg-[#FFFBF4] text-[#1E1B2E]'
          }`}>
            ⏱️ {cardTimer}s
          </div>
        </div>

        {/* Dual Progress: Card Progress and Timer countdown */}
        <div className="w-full h-2.5 bg-[#F4EDE1] rounded-full overflow-hidden border-2 border-[#1E1B2E] relative">
          <div 
            className="h-full bg-[#1E9E93] transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Center Interactive Flashcard */}
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center min-h-[190px] shrink-0">
        <div className="bg-[#FFFBF4] p-4 sm:p-5 text-center relative border-2 border-[#1E1B2E] rounded-[24px] shadow-[4px_4px_0px_0px_#1E1B2E]">
          
          {/* Card Top Badges */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <FlagIcon language={currentCard.targetLanguage} size={16} />
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#1E9E93]">
                {currentCard.topic.replace('CAT_', '')}
              </span>
            </div>

            <button
              onClick={handlePlayAudio}
              className="px-2.5 py-1 rounded-[10px] bg-[#F2B63D] text-[#1E1B2E] font-bold text-xs flex items-center gap-1 border-2 border-[#1E1B2E] shadow-[2px_2px_0px_0px_#1E1B2E] hover:bg-[#e0a634] active:translate-y-0.5"
            >
              <Volume2 size={15} />
              <span>{isRTL ? 'پخش صدا' : 'Listen'}</span>
            </button>
          </div>

          {/* Card Content - Text & Audio Mode vs Audio-Only Mode */}
          {isAudioOnly && !isRevealed && !evaluation?.isCorrect ? (
            <div className="py-4 my-1.5 p-3.5 rounded-[18px] bg-[#F4EDE1] border-2 border-[#1E1B2E] flex flex-col items-center justify-center gap-2">
              <div className="w-14 h-14 rounded-full bg-[#E0603F]/15 border-2 border-[#E0603F] flex items-center justify-center text-[#E0603F] animate-pulse">
                <Headphones size={28} />
              </div>
              <p className="text-xs font-bold text-[#1E1B2E]">
                {isRTL ? 'گوش دهید و آنچه شنیدید را تکرار کنید یا بنویسید' : 'Listen and repeat or type what you hear'}
              </p>
              <button
                onClick={() => setIsRevealed(true)}
                className="mt-1 text-xs font-bold text-[#1E9E93] hover:underline flex items-center gap-1 bg-[#FFFBF4] px-2.5 py-1 rounded-[8px] border border-[#1E1B2E]"
              >
                <Eye size={13} />
                <span>{t.revealHint}</span>
              </button>
            </div>
          ) : (
            <div className="my-1.5 p-3.5 sm:p-4 rounded-[18px] bg-[#F4EDE1] border-2 border-[#1E1B2E] flex flex-col items-center justify-center">
              {/* Meaning / Translation badge */}
              <div 
                dir={isRtlLang(currentCard.nativeLanguage || settings.nativeLanguage || 'fa') ? 'rtl' : 'ltr'}
                className="text-xs sm:text-sm font-bold text-[#1E1B2E] mb-1.5 px-3 py-0.5 rounded-[8px] bg-[#F2B63D] border border-[#1E1B2E] shadow-xs"
              >
                {currentCard.translation}
              </div>

              {/* Target Phrase */}
              <div 
                dir={isRtlLang(currentCard.targetLanguage) ? 'rtl' : 'ltr'}
                className="text-2xl sm:text-3xl font-bold font-card-word text-[#1E1B2E] tracking-tight leading-tight py-1"
              >
                {currentCard.targetText}
              </div>

              {/* Phonetic Pronunciation helper if available */}
              {currentCard.pronunciation && (
                <div className="text-xs font-mono font-bold text-[#1E9E93] mt-1.5 px-2.5 py-0.5 rounded-[8px] bg-[#FFFBF4] border border-[#1E1B2E]">
                  🗣️ [{currentCard.pronunciation}]
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Answer Feedback & Correction Banner */}
      {evaluation && (
        <div className="w-full max-w-sm mx-auto my-2 shrink-0 animate-fade-in font-ui">
          <div className={`p-3 rounded-[18px] border-2 border-[#1E1B2E] text-xs font-bold shadow-[3px_3px_0px_0px_#1E1B2E] ${
            evaluation.isCorrect 
              ? 'bg-[#dcfce7] text-[#15803d]' 
              : 'bg-[#fee2e2] text-[#b91c1c]'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1">
                {evaluation.isCorrect ? (
                  <CheckCircle2 size={18} className="text-[#15803d] shrink-0 mt-0.5" />
                ) : (
                  <XCircle size={18} className="text-[#b91c1c] shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-sm text-[#1E1B2E]">{evaluation.feedbackMessage}</div>
                  {evaluation.isCorrect && (
                    <div className="text-[11px] text-[#15803d] mt-0.5 font-bold">
                      +{evaluation.pointsAwarded} PTS
                    </div>
                  )}
                </div>
              </div>

              {/* Try Again / Next Action */}
              {!evaluation.isCorrect ? (
                <button
                  onClick={handleTryAgain}
                  className="px-2.5 py-1.5 bg-[#E0603F] text-white rounded-[10px] text-xs font-bold shrink-0 border-2 border-[#1E1B2E] flex items-center gap-1 active:scale-95 shadow-[1px_1px_0px_0px_#1E1B2E]"
                >
                  <RotateCcw size={13} />
                  <span>{t.tryAgain}</span>
                </button>
              ) : (
                <button
                  onClick={() => handleNextCard(false)}
                  className="px-3 py-1.5 bg-[#1E9E93] text-white rounded-[10px] text-xs font-bold shrink-0 border-2 border-[#1E1B2E] flex items-center gap-1 active:scale-95 shadow-[1px_1px_0px_0px_#1E1B2E]"
                >
                  <span>{t.nextCard}</span>
                  <ArrowRight size={13} className={isRTL ? 'rotate-180' : ''} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Input Section: Mic button and Text Input */}
      <div className="w-full max-w-sm mx-auto space-y-2 mt-2 shrink-0 font-ui">
        
        {/* Large Speaking Mic Button */}
        {speechSupported ? (
          <div className="flex items-center justify-center">
            <button
              onClick={toggleListening}
              className={`relative flex items-center justify-center gap-2 w-full py-3 rounded-[16px] border-2 border-[#1E1B2E] text-sm font-bold transition-all shadow-[4px_4px_0px_0px_#1E1B2E] active:translate-y-0.5 ${
                isListening 
                  ? 'bg-[#E0603F] text-white animate-pulse' 
                  : 'bg-[#1E9E93] hover:bg-[#19857c] text-white'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff size={20} />
                  <span>{t.stopListening} ({isRTL ? 'در حال ضبط' : 'Listening...'})</span>
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
          <div className="text-[10px] text-[#1E1B2E]/60 text-center font-bold">
            {t.micNotSupported}
          </div>
        )}

        {/* Text Input with Submit */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            dir={isRtlLang(currentCard?.targetLanguage || 'en-US') ? 'rtl' : 'ltr'}
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCheckAnswer();
            }}
            placeholder={t.enterAnswerPlaceholder}
            className="flex-1 bg-[#FFFBF4] text-[#1E1B2E] px-3.5 py-2.5 rounded-[14px] border-2 border-[#1E1B2E] text-xs sm:text-sm font-bold focus:outline-none shadow-[2px_2px_0px_0px_#1E1B2E]"
          />

          <button
            onClick={handleCheckAnswer}
            disabled={!userInput.trim()}
            className={`px-3.5 py-2.5 rounded-[14px] font-bold text-xs border-2 border-[#1E1B2E] flex items-center gap-1 shadow-[2px_2px_0px_0px_#1E1B2E] active:translate-y-0.5 ${
              userInput.trim() 
                ? 'bg-[#F2B63D] text-[#1E1B2E] hover:bg-[#e0a634]' 
                : 'bg-[#F4EDE1] text-[#1E1B2E]/40 cursor-not-allowed'
            }`}
          >
            <Send size={15} />
            <span>{t.checkAnswer}</span>
          </button>
        </div>

        {/* Skip Card Button if stuck */}
        <div className="flex items-center justify-between text-[11px] font-bold text-[#1E1B2E]/70 pt-1">
          <button
            onClick={() => handleNextCard(true)}
            className="hover:text-[#1E1B2E] transition-colors"
          >
            {isRTL ? 'رد کردن این کارت ⏭️' : 'Skip Card ⏭️'}
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="text-[#E0603F] hover:underline flex items-center gap-1"
          >
            <Trophy size={13} />
            <span>{t.leaderboard}</span>
          </button>
        </div>

      </div>

      {/* Explicit Microphone Permission Modal */}
      {showMicPermissionModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-ui"
          onClick={() => {
            if (!isRequestingMic) {
              sound.playClick();
              setShowMicPermissionModal(false);
            }
          }}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div 
            className="bg-[#FFFBF4] border-2 border-[#1E1B2E] rounded-[24px] w-full max-w-sm p-4 sm:p-5 text-center text-[#1E1B2E] shadow-[6px_6px_0px_0px_#1E1B2E] relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Icon Button */}
            {!isRequestingMic && (
              <button
                onClick={() => {
                  sound.playClick();
                  setShowMicPermissionModal(false);
                }}
                className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-[#F4EDE1] hover:bg-[#eae0d2] text-[#1E1B2E] border border-[#1E1B2E] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            )}

            {/* Microphone Icon */}
            <div className="w-16 h-16 mx-auto mb-3 rounded-[16px] bg-[#F2B63D] border-2 border-[#1E1B2E] flex items-center justify-center text-[#1E1B2E] shadow-[3px_3px_0px_0px_#1E1B2E]">
              <Mic size={32} className="animate-pulse" />
            </div>

            {/* Title */}
            <h3 className="text-base sm:text-lg font-bold font-display tracking-tight text-[#1E1B2E] mb-1">
              {isRTL ? 'درخواست اجازه دسترسی به میکروفون 🎙️' : 'Microphone Permission Request 🎙️'}
            </h3>

            {/* Subtitle / Details */}
            <p className="text-xs font-medium text-[#1E1B2E]/80 leading-relaxed mb-3">
              {isRTL 
                ? 'برای سنجش تلفظ و گفتن پاسخ کارت، برنامه نیاز به اجازه دسترسی به میکروفون دارد. آیا اجازه می‌دهید؟' 
                : 'To evaluate your pronunciation and speech answer, the app needs access to your microphone. Do you allow access?'}
            </p>

            {/* Error message if denied */}
            {micPermissionError && (
              <div className="p-2.5 mb-3 bg-[#fee2e2] border-2 border-[#1E1B2E] rounded-[12px] text-[11px] font-bold text-[#b91c1c] flex items-start gap-2 text-start">
                <ShieldAlert size={16} className="shrink-0 mt-0.5 text-[#b91c1c]" />
                <span>{micPermissionError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleGrantPermissionAndStart}
                disabled={isRequestingMic}
                className="pixel-btn pixel-btn-teal w-full py-2.5 text-xs uppercase tracking-wider rounded-[14px] flex items-center justify-center gap-2"
              >
                <Mic size={16} />
                <span>
                  {isRequestingMic 
                    ? (isRTL ? 'در حال اتصال به میکروفون...' : 'Requesting Access...') 
                    : (isRTL ? 'بله، اجازه می‌دهم و شروع کن' : 'Allow & Start Speaking')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setShowMicPermissionModal(false);
                }}
                disabled={isRequestingMic}
                className="w-full py-2 bg-[#F4EDE1] hover:bg-[#eae0d2] text-[#1E1B2E] font-bold text-xs rounded-[14px] border-2 border-[#1E1B2E] transition-colors"
              >
                {isRTL ? 'انصراف' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SinglePlayerScreen;
