import React, { useEffect, useState, useRef, useMemo } from 'react';
import { GameSettings, GameStatus, Team, Player, GameHistoryEntry, TeamColor, LanguageCard, PlayedCardRecord } from '../types';
import { COLORS_MAP, SUPPORTED_LANGUAGES } from '../constants';
import { TRANSLATIONS } from '../translations';
import { tUI, isRtlLang } from '../ui';
import PlayerCircle from '../components/PlayerCircle';
import TimerDisplay from '../components/TimerDisplay';
import Modal from '../components/Modal';
import EndGameScreen from './EndGameScreen';
import { TeamMascot } from '../components/Mascots';
import { sound } from '../soundManager';
import { feedbackDirector } from '../feedbackDirector';
import { FlagIcon } from '../components/FlagIcon';
import ExitConfirmModal from '../components/ExitConfirmModal';
import { recordMistake } from '../mistakeReviewService';
import { 
  Zap, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  Pause, 
  Play, 
  RotateCcw, 
  Check, 
  X, 
  CheckCircle2,
  XCircle,
  Smartphone, 
  Sparkles, 
  AlertTriangle,
  Skull,
  LogOut,
  Flame,
  Wand2,
  ThumbsUp,
  Lightbulb,
  Clock,
  Eye,
  EyeOff,
  Users,
  Bot
} from 'lucide-react';
import { AICoachChatModal } from '../components/AICoachChatModal';

interface UndoSnapshot {
  activePlayerIndex: number;
  currentCard: LanguageCard | null;
  roundTimer: number;
  teams: Team[];
  playedCards: PlayedCardRecord[];
}

interface Props {
  settings: GameSettings;
  onUpdateSettings?: (s: GameSettings) => void;
  gameStatus: GameStatus;
  setGameStatus: (s: GameStatus) => void;
  teams: Team[];
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  players: Player[];
  currentRound: number;
  setCurrentRound: React.Dispatch<React.SetStateAction<number>>;
  activePlayerIndex: number;
  setActivePlayerIndex: (i: number) => void;
  roundTimer: number;
  setRoundTimer: (t: number) => void;
  currentCard: LanguageCard | null;
  setCurrentCard?: (c: LanguageCard | null) => void;
  swapCooldown: number;
  onGetNextWord: () => void;
  onResume: () => void;
  isPoolExhausted: boolean;
  onFinish: (entry: GameHistoryEntry) => void;
  onExit: () => void;
  onExitHome?: () => void;
  onExitSetup?: () => void;
  onOpenHelp?: () => void;
  onOpenLeitner?: () => void;
  playedCards?: PlayedCardRecord[];
  setPlayedCards?: React.Dispatch<React.SetStateAction<PlayedCardRecord[]>>;
  onRequeueCard?: (card: LanguageCard) => void;
}

const GameplayScreen: React.FC<Props> = ({ 
  settings, 
  onUpdateSettings, 
  gameStatus, 
  setGameStatus, 
  teams, 
  setTeams, 
  players, 
  currentRound, 
  setCurrentRound, 
  activePlayerIndex, 
  setActivePlayerIndex, 
  roundTimer, 
  setRoundTimer, 
  currentCard, 
  swapCooldown, 
  onGetNextWord, 
  onResume, 
  isPoolExhausted, 
  onFinish, 
  onExit, 
  onExitHome,
  onExitSetup,
  onOpenHelp,
  playedCards = [],
  setPlayedCards,
  onRequeueCard,
  onOpenLeitner
}) => {
  const language = settings.language;
  const t = TRANSLATIONS[language] || TRANSLATIONS.fa;
  const isRTL = isRtlLang(language);

  // Floating Undo state
  const [undoSnapshot, setUndoSnapshot] = useState<UndoSnapshot | null>(null);
  const [undoTimeLeft, setUndoTimeLeft] = useState<number>(0);
  const undoIntervalRef = useRef<number | null>(null);

  // Turn Change Flash Banner
  const [turnFlash, setTurnFlash] = useState<{ playerName: string; teamColor: string } | null>(null);
  const turnFlashTimeoutRef = useRef<number | null>(null);

  // Elimination message state
  const [eliminatedTeamName, setEliminatedTeamName] = useState<string>('');

  // Audio countdown tracking
  const lastSecondRef = useRef<number>(-1);
  const hasFinishedGameRef = useRef<boolean>(false);
  const isActionLockedRef = useRef<boolean>(false);

  // Gameplay Interactive States
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showGrammar, setShowGrammar] = useState(false);
  const [showAlmostModal, setShowAlmostModal] = useState(false);
  const [showSeatingCircle, setShowSeatingCircle] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [cardStartTime, setCardStartTime] = useState<number>(Date.now());
  const [powerCardsUsed, setPowerCardsUsed] = useState<string[]>([]);
  const [bonusNotification, setBonusNotification] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isAICoachOpen, setIsAICoachOpen] = useState(false);

  useEffect(() => {
    if (gameStatus === GameStatus.ActiveTurn) {
      setIsUserPaused(false);
    }
  }, [gameStatus]);

  // Equal Challenge Card Allocation per Team per Round
  const [teamChallengesInRound, setTeamChallengesInRound] = useState<Record<number, number>>({});

  useEffect(() => {
    // Reset round quota when currentRound changes
    setTeamChallengesInRound({});
  }, [currentRound]);

  // Reset streak on turn end / activePlayer change
  useEffect(() => {
    setStreakCount(0);
  }, [activePlayerIndex]);

  const activePlayer = players[activePlayerIndex];
  const activeTeamId = activePlayer?.teamId;
  const isCurrentCardChallenge = useMemo(() => {
    if (!currentCard?.isChallenge || activeTeamId === undefined) return false;
    const myCount = teamChallengesInRound[activeTeamId] || 0;
    const otherCounts = teams
      .filter(t => t.id !== activeTeamId && !t.isEliminated)
      .map(t => teamChallengesInRound[t.id] || 0);
    const minOther = otherCounts.length > 0 ? Math.min(...otherCounts) : myCount;
    return myCount <= minOther;
  }, [currentCard, activeTeamId, teamChallengesInRound, teams]);

  // Card Reveal on Correct/Skip State (Pauses timer, dismisses on tap or 2.5s)
  const [revealCard, setRevealCard] = useState<{
    card: LanguageCard;
    isCorrect: boolean;
    nextIndex: number;
    snapshot?: UndoSnapshot;
  } | null>(null);
  const revealTimeoutRef = useRef<any>(null);

  const dismissRevealCard = () => {
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    if (!revealCard) return;

    const { nextIndex, snapshot } = revealCard;
    setRevealCard(null);

    setActivePlayerIndex(nextIndex);
    triggerTurnFlash(nextIndex);
    onGetNextWord();

    if (settings.passPhoneScreenEnabled) {
      setGameStatus(GameStatus.PassPhone);
    } else {
      setGameStatus(GameStatus.ActiveTurn);
    }

    if (snapshot) {
      triggerUndoWindow(snapshot);
    }
  };

  const vibrate = (ms: number | number[]) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch (e) {
        // Safe fallback
      }
    }
  };

  useEffect(() => {
    sound.setMuted(settings.soundEnabled === false);
  }, [settings.soundEnabled]);

  // Reset hint when card changes
  useEffect(() => {
    setShowHint(false);
    setShowGrammar(false);
    setCardStartTime(Date.now());
  }, [currentCard?.id]);

  // Handle Turn Change Visual Flash
  const triggerTurnFlash = (pIndex: number) => {
    const nextP = players[pIndex];
    if (nextP) {
      const col = COLORS_MAP[nextP.teamColor]?.hex || '#00F0FF';
      setTurnFlash({ playerName: nextP.name, teamColor: col });
      if (turnFlashTimeoutRef.current) clearTimeout(turnFlashTimeoutRef.current);
      turnFlashTimeoutRef.current = window.setTimeout(() => {
        setTurnFlash(null);
      }, 1200);
    }
  };

  // Trigger floating undo window (3 seconds)
  const triggerUndoWindow = (snapshot: UndoSnapshot) => {
    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
    setUndoSnapshot(snapshot);
    setUndoTimeLeft(3);

    undoIntervalRef.current = window.setInterval(() => {
      setUndoTimeLeft(prev => {
        if (prev <= 1) {
          if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
          setUndoSnapshot(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleExecuteUndo = () => {
    if (!undoSnapshot) return;
    sound.playClick();
    vibrate(40);

    setActivePlayerIndex(undoSnapshot.activePlayerIndex);
    setRoundTimer(undoSnapshot.roundTimer);
    setTeams(undoSnapshot.teams);
    if (setPlayedCards) {
      setPlayedCards(undoSnapshot.playedCards);
    }

    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
    setUndoSnapshot(null);
    setUndoTimeLeft(0);
  };

  // Audio countdown ticks
  useEffect(() => {
    if (gameStatus !== GameStatus.ActiveTurn) return;
    const secondsLeft = Math.ceil(roundTimer / 1000);
    if (secondsLeft <= 5 && secondsLeft > 0 && secondsLeft !== lastSecondRef.current) {
      lastSecondRef.current = secondsLeft;
      sound.playCountdownBeep(secondsLeft);
      vibrate(50);
    }
    if (secondsLeft > 5) {
      lastSecondRef.current = -1;
    }
  }, [roundTimer, gameStatus]);

  // Monitor Round Expiry
  useEffect(() => {
    if (roundTimer <= 0 && gameStatus === GameStatus.ActiveTurn) {
      sound.playBuzzer();
      vibrate([200, 100, 200]);
      setGameStatus(GameStatus.RoundEnded);
    }
  }, [roundTimer, gameStatus, setGameStatus]);

  // End Game Trigger
  useEffect(() => {
    if (gameStatus === GameStatus.GameEnded && !hasFinishedGameRef.current) {
      hasFinishedGameRef.current = true;
      let winners: Team[] = [];

      const maxScore = Math.max(...teams.map(t => t.score || 0));
      if (maxScore > 0) {
        winners = teams.filter(t => (t.score || 0) === maxScore);
      } else {
        const maxTime = Math.max(...teams.map(t => t.timeRemaining));
        winners = teams.filter(t => t.timeRemaining === maxTime);
      }

      const isTie = winners.length > 1;
      const winnerColor = isTie ? 'TIE' : (winners[0]?.color || TeamColor.Blue);
      const winnerNames = isTie 
        ? winners.map(w => t.teamNames[w.color])
        : players.filter(p => p.teamId === winners[0]?.id).map(p => p.name);

      const entry: GameHistoryEntry = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(language === 'fa' ? 'fa-IR' : 'en-US'),
        players: players.map(p => p.name),
        winnerColor: winnerColor as any,
        winnerNames: winnerNames,
        language: settings.language,
        targetLanguages: settings.targetLanguages,
        cefrLevel: settings.cefrLevel
      };

      onFinish(entry);
      setGameStatus(GameStatus.WinnerScreen);
    }
  }, [gameStatus, teams, players, settings, language, t, onFinish, setGameStatus]);

  // Next Turn Clockwise
  const getNextActivePlayerIndex = (currentIdx: number): number => {
    let nextIdx = (currentIdx + 1) % players.length;
    let attempts = 0;
    while (attempts < players.length) {
      const candidatePlayer = players[nextIdx];
      const team = teams.find(t => t.id === candidatePlayer.teamId);
      if (team && !team.isEliminated && team.timeRemaining > 0) {
        return nextIdx;
      }
      nextIdx = (nextIdx + 1) % players.length;
      attempts++;
    }
    return currentIdx;
  };

  /**
   * SUCCESS / CORRECT ANSWER
   */
  const handleCorrect = (wasAlmost: boolean = false) => {
    if (isActionLockedRef.current) return;
    if (gameStatus !== GameStatus.ActiveTurn || roundTimer <= 0) return;
    isActionLockedRef.current = true;
    setTimeout(() => { isActionLockedRef.current = false; }, 320);

    sound.playCorrect();
    vibrate(60);

    // Auto Pronounce target phrase in native target accent if setting is active
    if (settings.autoPronounceOnCorrect !== false && currentCard?.targetText) {
      sound.speakTargetPhrase(currentCard.targetText, currentCard.targetLanguage);
    }

    const activePlayer = players[activePlayerIndex];
    const snapshot: UndoSnapshot = {
      activePlayerIndex,
      currentCard,
      roundTimer,
      teams: JSON.parse(JSON.stringify(teams)),
      playedCards: setPlayedCards ? [...playedCards] : []
    };

    // Calculate points & bonuses
    const timeSpent = (Date.now() - cardStartTime) / 1000;
    const isSpeedBonus = timeSpent < 6;
    let basePoints = currentCard?.points || 1;
    if (currentCard?.isGolden) basePoints *= 2;
    if (isCurrentCardChallenge) {
      basePoints += (currentCard?.challengeBonus || 2);
      if (activeTeamId !== undefined) {
        setTeamChallengesInRound(prev => ({ ...prev, [activeTeamId]: (prev[activeTeamId] || 0) + 1 }));
      }
    }
    if (isSpeedBonus) basePoints += 1;

    // Bonus notification banner
    if (isCurrentCardChallenge) {
      const note = isRTL 
        ? '⭐ آفرین! پاسخ عالی به کارت چالش (+۲ امتیاز تشویقی)' 
        : `⭐ Great job! Challenge card answered (+2 Bonus ${t.pointsUnit || 'PTS'})`;
      setBonusNotification(note);
      setTimeout(() => setBonusNotification(null), 2000);
    } else if (currentCard?.isGolden || isSpeedBonus || streakCount >= 2) {
      const note = currentCard?.isGolden 
        ? '🌟 کارت طلایی! (۲ برابر امتیاز)' 
        : isSpeedBonus ? '⚡ پاداش سرعت! (+۱ امتیاز)' : `🔥 x${streakCount + 1}`;
      setBonusNotification(note);
      setTimeout(() => setBonusNotification(null), 1500);
    }

    setStreakCount(prev => prev + 1);

    // Record played card
    if (currentCard && setPlayedCards) {
      setPlayedCards(prev => [
        ...prev,
        {
          card: currentCard,
          guessedCorrectly: true,
          answeringPlayerName: activePlayer ? activePlayer.name : 'Player',
          answeringTeamColor: activePlayer ? activePlayer.teamColor : TeamColor.Blue,
          timeSpentSeconds: Math.round(timeSpent),
          wasSpeedBonus: isSpeedBonus,
          pointsEarned: basePoints,
          usedHint: showHint
        }
      ]);
    }

    // Award score to active team
    if (activePlayer) {
      setTeams(prev => prev.map(t => {
        if (t.id === activePlayer.teamId) {
          return {
            ...t,
            score: (t.score || 0) + basePoints,
            comboStreak: (t.comboStreak || 0) + 1
          };
        }
        return t;
      }));
    }

    const nextIndex = getNextActivePlayerIndex(activePlayerIndex);

    // Card Reveal on Correct (default ON, pauses timer, auto-dismiss 2.5s)
    if (settings.cardRevealEnabled !== false && currentCard) {
      setGameStatus(GameStatus.Paused);
      setRevealCard({
        card: currentCard,
        isCorrect: true,
        nextIndex,
        snapshot
      });
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = setTimeout(() => {
        dismissRevealCard();
      }, 2500);
      return;
    }

    setActivePlayerIndex(nextIndex);
    triggerTurnFlash(nextIndex);
    onGetNextWord();

    if (settings.passPhoneScreenEnabled) {
      setGameStatus(GameStatus.PassPhone);
    }

    triggerUndoWindow(snapshot);
  };

  /**
   * SKIP / WRONG ANSWER
   */
  const handleSkip = () => {
    if (isActionLockedRef.current) return;
    if (gameStatus !== GameStatus.ActiveTurn || roundTimer <= 0) return;
    isActionLockedRef.current = true;
    setTimeout(() => { isActionLockedRef.current = false; }, 320);

    sound.playBuzzer();
    vibrate(100);

    const activePlayer = players[activePlayerIndex];
    setStreakCount(0);

    if (currentCard) {
      if (isCurrentCardChallenge) {
        if (activeTeamId !== undefined) {
          setTeamChallengesInRound(prev => ({ ...prev, [activeTeamId]: (prev[activeTeamId] || 0) + 1 }));
        }
        const note = isRTL 
          ? '🛡️ کارت چالش بدون امتیاز منفی رد شد! (برای یادگیری و تکرار ذخیره شد)' 
          : '🛡️ Challenge card skipped with 0 penalty! (Saved for review)';
        setBonusNotification(note);
        setTimeout(() => setBonusNotification(null), 2500);
      }

      // Record in mistake bank for end-of-game review only (no re-queue into active game)
      recordMistake(currentCard, '(رد شده / کارت چالش)', 'party');
    }

    if (currentCard && setPlayedCards) {
      setPlayedCards(prev => [
        ...prev,
        {
          card: currentCard,
          guessedCorrectly: false,
          answeringPlayerName: activePlayer ? activePlayer.name : 'Player',
          answeringTeamColor: activePlayer ? activePlayer.teamColor : TeamColor.Blue,
          timeSpentSeconds: Math.round((Date.now() - cardStartTime) / 1000),
          wasSpeedBonus: false,
          pointsEarned: 0,
          usedHint: showHint
        }
      ]);
    }

    const nextIndex = getNextActivePlayerIndex(activePlayerIndex);

    // Card Reveal on Skip (default ON, pauses timer, auto-dismiss 2.5s)
    if (settings.cardRevealEnabled !== false && currentCard) {
      setGameStatus(GameStatus.Paused);
      setRevealCard({
        card: currentCard,
        isCorrect: false,
        nextIndex
      });
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = setTimeout(() => {
        dismissRevealCard();
      }, 2500);
      return;
    }

    setActivePlayerIndex(nextIndex);
    triggerTurnFlash(nextIndex);
    onGetNextWord();

    if (settings.passPhoneScreenEnabled) {
      setGameStatus(GameStatus.PassPhone);
    }
  };

  /**
   * USE POWER CARDS
   */
  const usePowerCard = (type: 'time' | 'hint' | 'mirror') => {
    sound.playPowerUp();
    vibrate(70);

    if (type === 'time') {
      setRoundTimer(prev => prev + 10000);
      setBonusNotification(isRTL ? '⏱️ ۱۰+ ثانیه زمان اضافه شد!' : '⏱️ +10s Time Added!');
      setTimeout(() => setBonusNotification(null), 1500);
      setPowerCardsUsed(prev => [...prev, 'time']);
    } else if (type === 'hint') {
      setShowHint(true);
      setBonusNotification(isRTL ? '💡 راهنما فعال شد!' : '💡 Hint Activated!');
      setTimeout(() => setBonusNotification(null), 1500);
    }
  };

  // Determine current active team
  const activeTeam = teams.find(t => t.id === activePlayer?.teamId);
  const activeColor = activePlayer?.teamColor || TeamColor.Blue;
  const activeConfig = COLORS_MAP[activeColor] || { bg: 'bg-[#00F0FF]', text: 'text-[#1a0833]', hex: '#00F0FF' };

  // Partner seated opposite
  const partnerPlayer = players.find(p => p.teamId === activePlayer?.teamId && p.id !== activePlayer?.id);

  // Target language metadata for active card
  const activeLangCode = currentCard?.targetLanguage || 'nl';
  const targetLangInfo = SUPPORTED_LANGUAGES.find(l => l.code === activeLangCode) || {
    flag: '🇳🇱',
    name: 'Dutch',
    nativeName: 'Nederlands'
  };

  // WINNER SCREEN VIEW
  if (gameStatus === GameStatus.WinnerScreen) {
    let winners: Team[] = [];
    const maxScore = Math.max(...teams.map(t => t.score || 0));

    if (maxScore > 0) {
      winners = teams.filter(t => (t.score || 0) === maxScore);
    } else {
      const maxTime = Math.max(...teams.map(t => t.timeRemaining));
      winners = teams.filter(t => t.timeRemaining === maxTime);
    }

    return (
      <EndGameScreen 
        winners={winners} 
        players={players} 
        playedCards={playedCards}
        onRestart={onExit} 
        language={settings.language} 
        isPoolExhausted={isPoolExhausted} 
        onOpenLeitner={onOpenLeitner}
      />
    );
  }

  return (
    <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto h-full max-h-[100dvh] min-h-0 flex-1 flex flex-col justify-between p-2 sm:p-2.5 select-none relative overflow-hidden bg-[var(--bg)] text-[var(--ink)] font-ui" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* Turn Change Flash Banner */}
      {turnFlash && (
        <div 
          className="absolute inset-x-4 top-2 z-50 py-2 px-4 rounded-2xl border-[3px] border-[#241442] shadow-[4px_4px_0px_0px_#241442] text-center animate-bounce flex items-center justify-center gap-2"
          style={{ backgroundColor: turnFlash.teamColor }}
        >
          <Zap size={18} color="#1a0833" fill="#1a0833" />
          <span className="font-black text-sm text-[#1a0833] uppercase">
            {language === 'fa' ? `⚡ نوبت: ${turnFlash.playerName}!` : `⚡ TURN: ${turnFlash.playerName}!`}
          </span>
        </div>
      )}

      {/* Bonus Notification Pop */}
      {bonusNotification && (
        <div className="absolute top-16 inset-x-6 z-40 bg-[#FFE600] border-2 border-[#241442] text-[#1a0833] py-1.5 px-3 rounded-2xl font-black text-xs text-center shadow-[3px_3px_0px_0px_#241442] animate-pulse flex items-center justify-center gap-1.5">
          <Sparkles size={14} className="text-[#FF007F]" />
          <span>{bonusNotification}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2 bg-[var(--panel)] p-2 sm:p-2.5 rounded-2xl border border-[var(--line)] text-[var(--ink)] shadow-xs shrink-0 font-ui">
        
        {/* Round Badge */}
        <div className="flex items-center gap-1.5 bg-[var(--lapis)] text-white px-2.5 py-1 rounded-xl font-bold text-xs shadow-xs">
          <span>{t.round} {currentRound}/{settings.roundsCount}</span>
        </div>

        {/* Center Target Language & CEFR Level Badge */}
        <div className="flex items-center gap-1.5 bg-[var(--bg)] text-[var(--ink)] px-2.5 py-1 rounded-xl border border-[var(--line)] font-bold text-xs">
          <FlagIcon language={activeLangCode} size={15} />
          <span className="truncate max-w-[80px] font-bold">{isRTL ? (targetLangInfo.persianName || targetLangInfo.nativeName) : targetLangInfo.nativeName}</span>
          <span className="bg-[var(--lapis-soft)] text-[var(--lapis)] border border-[var(--lapis)]/20 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
            {currentCard?.cefrLevel || 'A1'}
          </span>
        </div>

        {/* Control Actions: Exit, Sound, Pause, Help */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Exit Game Button (Icon-only) */}
          <button 
            type="button"
            aria-label={t.exitGame || (isRTL ? "خروج از بازی" : "Exit Game")}
            title={t.exitGame || (isRTL ? "خروج از بازی" : "Exit Game")}
            onClick={() => {
              sound.playClick();
              setShowExitConfirm(true);
            }}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            <LogOut size={17} className={isRTL ? "rotate-180" : ""} />
          </button>

          {/* Sound Toggle */}
          <button 
            type="button"
            aria-label={t.soundToggle || (isRTL ? "قطع و وصل صدا" : "Sound Toggle")}
            title={t.soundToggle || (isRTL ? "قطع و وصل صدا" : "Sound Toggle")}
            onClick={() => {
              const currentMuted = settings.soundEnabled === false;
              const nextMuted = !currentMuted;
              sound.setMuted(!nextMuted);
              if (onUpdateSettings) {
                onUpdateSettings({ ...settings, soundEnabled: nextMuted });
              }
            }}
            style={{
              backgroundColor: settings.soundEnabled === false ? '#f43f5e' : undefined,
              borderColor: settings.soundEnabled === false ? '#e11d48' : undefined,
              color: settings.soundEnabled === false ? '#ffffff' : undefined,
              opacity: 1,
              visibility: 'visible',
              display: 'inline-flex'
            }}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer select-none ${
              settings.soundEnabled === false
                ? '!bg-rose-500 !text-white !border-2 !border-rose-600 dark:!bg-rose-600 shadow-rose-500/20 shadow-md ring-2 ring-rose-400/30'
                : 'bg-[var(--panel)] hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--ink)] border-[var(--line)]'
            }`}
          >
            {settings.soundEnabled !== false ? (
              <Volume2 size={17} className="text-[var(--ink)] shrink-0" strokeWidth={2} />
            ) : (
              <VolumeX size={17} className="!text-white shrink-0 stroke-white" strokeWidth={2.5} style={{ color: '#ffffff', stroke: '#ffffff', display: 'block' }} />
            )}
          </button>

          {/* Pause Game */}
          <button 
            type="button"
            aria-label={t.pause || (isRTL ? "توقف بازی" : "Pause")}
            title={t.pause || (isRTL ? "توقف بازی" : "Pause")}
            onClick={() => {
              sound.playClick();
              setIsUserPaused(true);
              setGameStatus(GameStatus.Paused);
            }}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-[var(--line)] bg-[var(--panel)] text-[var(--ink)] hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            <Pause size={17} />
          </button>

          {/* In-Game Help / Rules */}
          {onOpenHelp && (
            <button
              type="button"
              aria-label={t.help || (isRTL ? "راهنمای بازی" : "Help")}
              title={t.help || (isRTL ? "راهنمای بازی" : "Game Rules")}
              onClick={() => {
                sound.playClick();
                onOpenHelp();
              }}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-[var(--line)] bg-[var(--panel)] text-[var(--ink)] hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer"
            >
              <HelpCircle size={17} />
            </button>
          )}
        </div>

      </div>

      {/* Match Pacing & Round Progress Indicator */}
      <div className="w-full bg-[var(--panel)]/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-[var(--line)] shadow-2xs flex items-center justify-between gap-2 shrink-0 font-ui text-[11px] my-1">
        {/* Round Pacing Segmented Dots / Bars */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-bold text-[var(--ink)] shrink-0">
            {isRTL ? `دور ${currentRound} از ${settings.roundsCount}` : `Round ${currentRound} of ${settings.roundsCount}`}
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: settings.roundsCount }).map((_, rIdx) => {
              const roundNum = rIdx + 1;
              const isPast = roundNum < currentRound;
              const isCurrent = roundNum === currentRound;
              return (
                <div
                  key={roundNum}
                  title={isRTL ? `دور ${roundNum}` : `Round ${roundNum}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isPast
                      ? 'w-4 bg-emerald-500'
                      : isCurrent
                        ? 'w-7 bg-[var(--lapis)] ring-2 ring-[var(--lapis)]/30 animate-pulse'
                        : 'w-3 bg-[var(--line)]'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Turn in Round Pacing */}
        <div className="flex items-center gap-1 text-[var(--mute)] font-semibold shrink-0">
          <Users size={12} className="text-[var(--lapis)]" />
          <span>
            {isRTL 
              ? `نوبت ${activePlayerIndex + 1} از ${players.length} بازیکن`
              : `Turn ${activePlayerIndex + 1} of ${players.length}`}
          </span>
        </div>
      </div>

      {/* Main Active Language Card */}
      <div className="w-full flex-1 min-h-0 flex flex-col justify-between my-1">
        
        <div 
          className={`w-full h-full p-3 sm:p-4 rounded-[24px] border border-[var(--line)] shadow-sm flex flex-col justify-between relative overflow-hidden transition-all bg-[var(--panel)] ${
            currentCard?.isGolden ? 'ring-2 ring-[var(--saffron)]' : ''
          }`}
        >
          {/* Top Card Bar: Active Player & Mode Badge */}
          <div className="flex items-center justify-between gap-1.5 shrink-0 font-ui">
            
            {/* Active Player Pill */}
            <div 
              className="px-2.5 py-1 rounded-xl border border-[var(--line)] font-bold text-xs shadow-xs flex items-center gap-1.5 bg-[var(--bg)] text-[var(--ink)]"
            >
              <span className="text-base leading-none select-none">{activePlayer?.avatar || '🦊'}</span>
              <span className="font-black">{activePlayer?.name || (isRTL ? 'بازیکن' : 'Player')}</span>
              <span className="text-[10px] text-[var(--mute)]">({t.teamNames[activeColor]})</span>
            </div>

            {/* Combo Streak Counter 🔥 (Visual Only, No extra points) */}
            {streakCount > 1 && (
              <div 
                data-testid="combo-badge"
                className="flex items-center gap-1 bg-amber-500/15 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-lg border border-amber-300 dark:border-amber-800 text-[11px] font-black"
              >
                <Flame size={13} className="text-amber-500 fill-amber-500 animate-pulse" />
                <span>🔥 x{streakCount}</span>
              </div>
            )}

            {/* Clean Learning Mode Badge */}
            <div className={`px-2.5 py-1 rounded-xl border border-[var(--line)] font-bold text-[11px] flex items-center gap-1 bg-[var(--bg)] text-[var(--ink)]`}>
              {currentCard?.isReverse || currentCard?.learningMode === 'Reverse' ? (
                <>
                  <RotateCcw size={12} className="text-[var(--saffron)]" />
                  <span>{isRTL ? 'ترجمه معکوس' : 'Reverse Translate'}</span>
                </>
              ) : (
                <span>{currentCard?.cefrLevel ? (isRTL ? `سطح ${currentCard.cefrLevel}` : `Level ${currentCard.cefrLevel}`) : (isRTL ? 'گفتار' : 'Speak')}</span>
              )}
            </div>

          </div>

          {/* 70/30 Pedagogical Rule: Challenge Card Badge (Bonus pts, No penalty on skip/fail) */}
          {isCurrentCardChallenge && (
            <div className="w-full my-1 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/50 text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500 shrink-0" />
                <span>{isRTL ? '⭐ کارت چالش (+یادگیری)' : '⭐ Challenge Card (+Learning)'}</span>
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
                {isRTL ? '۲+ امتیاز تشویقی • بدون جریمه' : '+2 Bonus • No Penalty'}
              </span>
            </div>
          )}

          {/* Center Card Content Area - Clean, Focused, High Legibility */}
          <div className="flex-1 flex flex-col items-center justify-center py-1 text-center font-ui">
            
            {/* SCENARIO 1: REVERSE TRANSLATION MODE */}
            {currentCard?.isReverse ? (
              <div className="w-full flex flex-col items-center space-y-2">
                {/* Clean Prompt Bubble in Native Language */}
                <div 
                  dir={isRtlLang(currentCard.nativeLanguage || settings.nativeLanguage || 'fa') ? 'rtl' : 'ltr'}
                  className="w-full max-w-sm bg-[var(--bg)] text-[var(--ink)] p-2.5 sm:p-3 rounded-2xl border border-[var(--line)] shadow-xs"
                >
                  <span className="text-[10px] text-[var(--lapis)] font-bold block mb-0.5">
                    {currentCard.prompt || (isRtlLang(currentCard.nativeLanguage || settings.nativeLanguage || 'fa') ? 'این عبارت را به زبان هدف ادا کن:' : 'Speak this phrase in target language:')}
                  </span>
                  <p className="text-sm sm:text-base font-bold text-[var(--ink)] font-display leading-snug">
                    «{currentCard.translation}»
                  </p>
                </div>

                {/* Target Foreign Answer (Hero text with dynamic dir) */}
                <div className="flex items-center justify-center gap-2 pt-0.5">
                  <h2 
                    dir={isRtlLang(currentCard.targetLanguage) ? 'rtl' : 'ltr'} 
                    className="card-target-word text-2xl sm:text-3xl font-extrabold font-card-word tracking-tight text-[var(--ink)]"
                  >
                    {currentCard.targetText}
                  </h2>
                  
                  {/* Pronounce Button */}
                  <button
                    type="button"
                    aria-label={isRTL ? "پخش تلفظ صوتی" : "Audio Pronunciation"}
                    title={isRTL ? "پخش تلفظ صوتی" : "Audio Pronunciation"}
                    onClick={() => {
                      sound.playClick();
                      sound.speakTargetPhrase(currentCard.targetText, currentCard.targetLanguage);
                    }}
                    className="p-2 bg-[var(--turq)] hover:brightness-105 text-white rounded-xl shadow-xs transition-all active:scale-95"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>
              </div>
            ) : (
              /* SCENARIO 2: REGULAR EXPLAIN / SPEAK MODE */
              <div className="w-full flex flex-col items-center">
                
                {/* Clean Card Plate */}
                <div className="w-full max-w-sm my-1 p-3 sm:p-4 rounded-2xl bg-[var(--bg)] border border-[var(--line)] flex flex-col items-center justify-center space-y-1.5 shadow-xs">
                  
                  {/* Hero Target Word / Phrase */}
                  <div className="flex items-center justify-center gap-2">
                    <h2 
                      dir={isRtlLang(currentCard?.targetLanguage || 'en-US') ? 'rtl' : 'ltr'} 
                      className="card-target-word text-2xl sm:text-4xl font-extrabold font-card-word tracking-tight text-[var(--ink)]"
                    >
                      {currentCard?.targetText || '---'}
                    </h2>
                    
                    {currentCard?.targetText && (
                      <button
                        type="button"
                        aria-label={isRTL ? "پخش تلفظ صوتی" : "Audio Pronunciation"}
                        title={isRTL ? "پخش تلفظ صوتی" : "Audio Pronunciation"}
                        onClick={() => {
                          sound.playClick();
                          sound.speakTargetPhrase(currentCard.targetText, currentCard.targetLanguage);
                        }}
                        className="p-2 bg-[var(--turq)] hover:brightness-105 text-white rounded-xl shadow-xs transition-all active:scale-95"
                      >
                        <Volume2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Meaning / Translation in High-Contrast Badge */}
                  {currentCard?.translation && (
                    <div 
                      dir={isRtlLang(currentCard.nativeLanguage || settings.nativeLanguage || 'fa') ? 'rtl' : 'ltr'}
                      className="px-3 py-1 rounded-xl bg-[var(--panel)] text-[var(--ink)] text-sm sm:text-base font-bold border border-[var(--line)] shadow-xs"
                    >
                      {currentCard.translation}
                    </div>
                  )}

                  {/* Short Situational Clue in Native Language */}
                  {currentCard?.prompt && !currentCard.prompt.includes('🔄') && !currentCard.prompt.includes('ترجمه به') && (
                    <p 
                      dir={isRtlLang(currentCard.nativeLanguage || settings.nativeLanguage || 'fa') ? 'rtl' : 'ltr'}
                      className="text-[11.5px] text-[var(--mute)] font-medium max-w-xs leading-tight mt-0.5"
                    >
                      {currentCard.prompt}
                    </p>
                  )}
                </div>

              </div>
            )}

            {/* Smart Micro-Hints Toolbar (Compact & Lightweight) */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
              

              {/* AI Coach & Referee Quick Help */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setIsAICoachOpen(true);
                }}
                className="px-2 py-0.5 rounded-lg bg-[var(--panel)] hover:bg-[var(--bg)] border border-amber-400/40 text-amber-500 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-2xs"
                title="مشاوره با مربی و داور هوشمند دور"
              >
                <Bot size={11} />
                <span>{isRTL ? 'داور هوشمند' : 'AI Referee'}</span>
              </button>

            </div>

          </div>

          {/* Clean Card Footer */}
          <div className="flex items-center justify-between text-[11px] font-bold border-t border-[var(--line)] pt-1.5 shrink-0 font-ui text-[var(--mute)]">
            <span className="inline-flex items-center gap-1">
              <span>{isRTL ? 'یار پاسخ‌دهنده: ' : 'Guesser: '}</span>
              <span className="inline-flex items-center gap-1 text-[var(--ink)] font-black">
                <span className="text-sm select-none">{partnerPlayer?.avatar || '🦁'}</span>
                <span>{partnerPlayer?.name || (isRTL ? 'هم‌تیمی' : 'Partner')}</span>
              </span>
            </span>
            <span className="bg-[var(--saffron)] text-[#15204A] px-2 py-0.5 rounded-lg text-[10.5px] font-extrabold shadow-xs">
              +{currentCard?.isGolden ? (currentCard.points * 2) : (currentCard?.points || 1)} {isRTL ? 'امتیاز ⭐' : 'pts ⭐'}
            </span>
          </div>

        </div>

      </div>

      {/* Round & Team Timers Display */}
      <div className="my-1 shrink-0">
        <TimerDisplay 
          roundTimer={roundTimer} 
          teams={teams} 
          activeTeamId={activeTeam?.id || 0}
          language={language}
          isRTL={isRTL}
        />
      </div>

      {/* Floating 3-Second Undo Pill */}
      {undoSnapshot && (
        <div className="w-full flex justify-center mb-1 shrink-0 animate-bounce font-ui">
          <button
            type="button"
            onClick={handleExecuteUndo}
            className="min-h-[38px] px-4 py-1.5 bg-[var(--saffron)] text-[#15204A] rounded-full border border-[var(--saffron)] font-bold text-xs shadow-sm flex items-center gap-2"
          >
            <RotateCcw size={14} />
            <span>{isRTL ? `بازگشت کارت قبلی (${undoTimeLeft} ثانیه)` : `Undo Card (${undoTimeLeft}s)`}</span>
          </button>
        </div>
      )}

      {/* Bottom Action Controls */}
      <div className="w-full space-y-2 shrink-0 font-ui">
        
        {/* Main Answer Buttons (Correct / Almost / Skip) */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          
          {/* Skip / Next */}
          <button
            type="button"
            onClick={handleSkip}
            className="h-14 sm:h-15 min-h-[52px] px-2 text-xs sm:text-sm font-extrabold uppercase flex flex-col items-center justify-center gap-1 rounded-2xl bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] shadow-xs transition-all active:scale-[0.97] cursor-pointer"
          >
            <X size={18} strokeWidth={2.5} className="text-rose-500" />
            <span className="leading-none">{isRTL ? 'رد کردن' : 'Skip'}</span>
          </button>

          {/* Almost Correct (Crowd Vote) */}
          <button
            type="button"
            onClick={() => setShowAlmostModal(true)}
            className="h-14 sm:h-15 min-h-[52px] px-2 text-xs sm:text-sm font-extrabold uppercase flex flex-col items-center justify-center gap-1 rounded-2xl bg-[var(--saffron)] hover:brightness-105 text-[#15204A] border-0 shadow-xs transition-all active:scale-[0.97] cursor-pointer"
          >
            <ThumbsUp size={18} className="text-[#15204A]" />
            <span className="leading-none text-center">{t.almostCorrectBtn || (isRTL ? 'تقریباً درست' : 'Almost')}</span>
          </button>

          {/* Correct Answer */}
          <button
            type="button"
            onClick={() => handleCorrect(false)}
            className="h-14 sm:h-15 min-h-[52px] px-2 text-xs sm:text-sm font-extrabold uppercase flex flex-col items-center justify-center gap-1 rounded-2xl bg-[var(--turq)] hover:brightness-105 text-white border-0 shadow-xs transition-all active:scale-[0.97] cursor-pointer"
          >
            <Check size={20} strokeWidth={3} className="text-white" />
            <span className="leading-none">{isRTL ? 'درست بود!' : 'Correct!'}</span>
          </button>

        </div>

        {/* Secondary Bar: Power Cards Drawer & Swap */}
        <div className="flex gap-2.5">
          
          {/* +10s Time Power Card */}
          {settings.powerCardsEnabled !== false && (
            <button
              type="button"
              onClick={() => usePowerCard('time')}
              className="flex-1 min-h-[44px] py-2 bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <Clock size={14} className="text-[var(--lapis)]" />
              <span>{isRTL ? '۱۰+ ثانیه وقت' : '+10s Boost'}</span>
            </button>
          )}

          {/* Swap Card with Cooldown */}
          <button
            type="button"
            disabled={swapCooldown > 0}
            onClick={() => {
              sound.playToggle();
              onGetNextWord();
            }}
            className={`flex-1 min-h-[44px] py-2 border border-[var(--line)] rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
              swapCooldown <= 0
                ? 'bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)]'
                : 'opacity-40 cursor-not-allowed bg-[var(--bg)] text-[var(--mute)]'
            }`}
          >
            <RotateCcw size={14} />
            <span>{swapCooldown > 0 ? (isRTL ? `تعویض (${Math.ceil(swapCooldown/1000)} ثانیه)` : `Swap (${Math.ceil(swapCooldown/1000)}s)`) : (isRTL ? 'تعویض کارت' : 'Swap Card')}</span>
          </button>

        </div>

      </div>

      {/* Almost Correct Vote Modal */}
      {showAlmostModal && (
        <Modal 
          isOpen={showAlmostModal} 
          onClose={() => setShowAlmostModal(false)}
          title={isRTL ? 'رأی‌گیری جمعی: تقریباً درست؟' : 'Group Vote: Almost Correct?'}
        >
          <div className="p-3 text-center space-y-3 font-ui" dir={isRTL ? 'rtl' : 'ltr'}>
            <p className="text-xs font-bold text-slate-700">
              {isRTL 
                ? 'اگر پاسخ هم‌تیمی با اشتباه گرامری یا تلفظی جزیی گفته شده، آیا بقیه بازیکنان امتیاز را تایید می‌کنند؟'
                : 'If the teammate made a minor slip in grammar or pronunciation, do other players accept it?'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAlmostModal(false);
                  handleCorrect(true);
                }}
                className="pixel-btn pixel-btn-lime flex-1 py-2 text-xs font-black uppercase"
              >
                {isRTL ? 'تایید جمعی (درست)' : 'Accept (Correct)'}
              </button>
              <button
                type="button"
                onClick={() => setShowAlmostModal(false)}
                className="pixel-btn pixel-btn-dark flex-1 py-2 text-xs font-black uppercase"
              >
                {isRTL ? 'انصراف' : 'Cancel'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* PASS PHONE GUARD SCREEN */}
      {gameStatus === GameStatus.PassPhone && (
        <Modal isOpen={true} onClose={() => {}} title={t.passPhone}>
          <div className="p-4 text-center space-y-3 font-ui" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--bg)] border-2 border-[var(--line)] flex items-center justify-center text-3xl shadow-xs">
              {activePlayer?.avatar || '🦊'}
            </div>
            <h3 className="text-base font-black text-[var(--ink)]">
              {isRTL ? (
                <>گوشی را به <span className="text-[var(--lapis)]">{activePlayer?.name}</span> بدهید!</>
              ) : (
                <>Pass phone to <span className="text-[var(--lapis)]">{activePlayer?.name}</span>!</>
              )}
            </h3>
            <p className="text-xs text-slate-600 font-bold">
              {isRTL 
                ? 'وقتی گوشی به دست نفر جدید رسید، دکمه آماده‌ام را لمس کنید تا کارت نمایش داده شود.'
                : 'Once the player holds the phone, tap Ready to reveal the secret card.'}
            </p>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setGameStatus(GameStatus.ActiveTurn);
              }}
              className="pixel-btn pixel-btn-pink w-full py-3 text-sm font-black uppercase"
            >
              {isRTL ? 'آماده‌ام، شروع نوبت! ⚡' : 'Ready, Start Turn! ⚡'}
            </button>
          </div>
        </Modal>
      )}

      {/* PAUSE MODAL */}
      {isUserPaused && gameStatus === GameStatus.Paused && !revealCard && (
        <Modal 
          isOpen={true} 
          onClose={() => {
            setIsUserPaused(false);
            setGameStatus(GameStatus.ActiveTurn);
          }} 
          title={t.paused}
        >
          <div className="p-4 text-center space-y-3 font-ui" dir={isRTL ? 'rtl' : 'ltr'}>
            <p className="text-xs font-bold text-slate-600">
              {isRTL ? 'بازی موقتاً متوقف شده است.' : 'Game is temporarily paused.'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setIsUserPaused(false);
                  setGameStatus(GameStatus.ActiveTurn);
                }}
                className="pixel-btn pixel-btn-lime flex-1 py-2.5 text-xs font-black uppercase"
              >
                {t.resume}
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setShowExitConfirm(true);
                }}
                className="pixel-btn pixel-btn-dark flex-1 py-2.5 text-xs font-black uppercase"
              >
                {t.exit}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* EXIT CONFIRMATION MODAL */}
      {showExitConfirm && (
        <ExitConfirmModal
          isRTL={isRTL}
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

      {/* TEAM ELIMINATED MODAL */}
      {gameStatus === GameStatus.TeamEliminated && (
        <Modal isOpen={true} onClose={() => {}} title={t.eliminated}>
          <div className="p-4 text-center space-y-3 font-ui" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FF1058] border-2 border-[#241442] flex items-center justify-center text-white shadow-[3px_3px_0px_0px_#241442]">
              <Skull size={28} />
            </div>
            <h3 className="text-base font-black text-[#1a0833]">
              {isRTL 
                ? `تیم ${t.teamNames[eliminatedTeamName as TeamColor] || eliminatedTeamName} حذف شد!`
                : `Team ${t.teamNames[eliminatedTeamName as TeamColor] || eliminatedTeamName} Eliminated!`}
            </h3>
            <p className="text-xs text-slate-600 font-bold">
              {isRTL 
                ? 'زمان این تیم به پایان رسید. بقیه تیم‌ها به رقابت ادامه می‌دهند.'
                : 'Their time ran out. The remaining teams keep playing.'}
            </p>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setGameStatus(GameStatus.ActiveTurn);
              }}
              className="pixel-btn pixel-btn-lime w-full py-3 text-sm font-black uppercase"
            >
              {isRTL ? 'ادامه مسابقه' : 'Continue Match'}
            </button>
          </div>
        </Modal>
      )}

      {/* ROUND ENDED MODAL */}
      {gameStatus === GameStatus.RoundEnded && (
        <Modal isOpen={true} onClose={() => {}} title={isRTL ? `پایان دور ${currentRound}` : `Round ${currentRound} Complete`}>
          <div className="p-4 text-center space-y-3 font-ui" dir={isRTL ? 'rtl' : 'ltr'}>
            <h3 className="text-sm font-black text-[#1a0833]">
              {isRTL 
                ? `دور ${currentRound} از ${settings.roundsCount} به پایان رسید!`
                : `Round ${currentRound} of ${settings.roundsCount} is finished!`}
            </h3>
            <p className="text-xs text-slate-600 font-bold">
              {isRTL ? 'برای شروع دور بعد و ادامه مسابقه آماده شوید.' : 'Get ready for the next round.'}
            </p>
            <button
              type="button"
              onClick={() => {
                sound.playStartGame();
                if (currentRound < settings.roundsCount) {
                  setCurrentRound(prev => prev + 1);
                  setRoundTimer(settings.roundDuration * 1000);
                  setTeams(prev => prev.map(t => ({ ...t, timeRemaining: settings.roundDuration * 1000, isEliminated: false })));
                  const nextStartingPlayer = (activePlayerIndex + 1) % players.length;
                  setActivePlayerIndex(nextStartingPlayer);
                  onGetNextWord();
                  setGameStatus(GameStatus.ActiveTurn);
                } else {
                  setGameStatus(GameStatus.GameEnded);
                }
              }}
              className="pixel-btn pixel-btn-pink w-full py-3 text-sm font-black uppercase"
            >
              {currentRound < settings.roundsCount 
                ? (isRTL ? `شروع دور ${currentRound + 1} ⚡` : `Start Round ${currentRound + 1} ⚡`)
                : (isRTL ? 'مشاهده نتایج نهایی 🏆' : 'View Final Results 🏆')}
            </button>
          </div>
        </Modal>
      )}

      {/* 2.5s Card Reveal Overlay on Correct / Skip */}
      {revealCard && (
        <div 
          onClick={dismissRevealCard}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in cursor-pointer select-none"
        >
          <div 
            onClick={dismissRevealCard}
            className="w-full max-w-sm bg-[var(--panel)] border-2 border-[var(--line)] rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center space-y-3 relative animate-scale-up"
          >
            {/* Status chip */}
            <div className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-xs ${
              revealCard.isCorrect ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
            }`}>
              {revealCard.isCorrect ? (
                <>
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>{isRTL ? 'پاسخ درست! 🎉' : 'Correct! 🎉'}</span>
                </>
              ) : (
                <>
                  <XCircle size={14} className="text-rose-500" />
                  <span>{isRTL ? 'کارت رد شد ⏭️' : 'Skipped ⏭️'}</span>
                </>
              )}
            </div>

            {/* Target text & Audio */}
            <div className="w-full">
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-2xl font-black text-[var(--ink)] tracking-tight">
                  {revealCard.card.targetText}
                </h3>
                {sound.hasVoice(revealCard.card.targetLanguage) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.speak(revealCard.card.targetText, revealCard.card.targetLanguage, { force: true });
                    }}
                    className="w-8 h-8 rounded-full bg-[var(--lapis-soft)] text-[var(--lapis)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    title={isRTL ? 'پخش صوتی تلفظ' : 'Play audio pronunciation'}
                  >
                    <Volume2 size={16} />
                  </button>
                )}
              </div>
              <p className="text-sm font-bold text-[var(--mute)] mt-1">
                {revealCard.card.translation}
              </p>
            </div>

            {/* Example sentence: ONLY for Vocabulary cards as requested */}
            {revealCard.card.contentType === 'Vocabulary' && (revealCard.card.grammarPoint || revealCard.card.prompt) && (
              <div className="w-full p-2.5 bg-[var(--bg)] rounded-xl border border-[var(--line)] text-start space-y-1">
                <span className="text-[10px] font-black uppercase text-[var(--lapis)] block tracking-wider">
                  {t.exampleSentenceLabel || (isRTL ? 'جمله نمونه:' : 'Example Sentence:')}
                </span>
                <p className="text-xs text-[var(--ink)] font-medium leading-relaxed">
                  {revealCard.card.grammarPoint || revealCard.card.prompt}
                </p>
              </div>
            )}

            {/* Dismiss CTA */}
            <button
              type="button"
              onClick={dismissRevealCard}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-[var(--lapis)] text-[var(--on-lapis)] font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>{t.continueOrTap || (isRTL ? 'ادامه خودکار یا ضربه برای رد شدن' : 'Continue (or tap anywhere)')}</span>
            </button>
          </div>
        </div>
      )}

      {/* In-Game AI Referee & Coach Chatbot (Gemini AI) */}
      <AICoachChatModal
        isOpen={isAICoachOpen}
        onClose={() => setIsAICoachOpen(false)}
        learningLanguage={currentCard?.targetLanguage || settings.targetLanguages?.[0] || 'English'}
        guideLanguage={settings.language === 'fa' ? 'Persian' : 'English'}
        isRTL={isRTL}
      />

    </div>
  );
};

export default GameplayScreen;
