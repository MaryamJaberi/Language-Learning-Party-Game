import React, { useEffect, useState, useRef } from 'react';
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
import { FlagIcon } from '../components/FlagIcon';
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
  Users
} from 'lucide-react';

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
  onOpenHelp?: () => void;
  playedCards?: PlayedCardRecord[];
  setPlayedCards?: React.Dispatch<React.SetStateAction<PlayedCardRecord[]>>;
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
  onOpenHelp,
  playedCards = [],
  setPlayedCards
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

  // Gameplay Interactive States
  const [showHint, setShowHint] = useState(false);
  const [showGrammar, setShowGrammar] = useState(false);
  const [showAlmostModal, setShowAlmostModal] = useState(false);
  const [showSeatingCircle, setShowSeatingCircle] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [cardStartTime, setCardStartTime] = useState<number>(Date.now());
  const [powerCardsUsed, setPowerCardsUsed] = useState<string[]>([]);
  const [bonusNotification, setBonusNotification] = useState<string | null>(null);

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
    if (isSpeedBonus) basePoints += 1;

    // Bonus notification banner
    if (currentCard?.isGolden || isSpeedBonus || streakCount >= 2) {
      const note = currentCard?.isGolden 
        ? '🌟 کارت طلایی! (۲ برابر امتیاز)' 
        : isSpeedBonus ? '⚡ پاداش سرعت! (+۱ امتیاز)' : `🔥 کمبو ${streakCount + 1}!`;
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
    sound.playBuzzer();
    vibrate(100);

    const activePlayer = players[activePlayerIndex];
    setStreakCount(0);

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
  const activePlayer = players[activePlayerIndex];
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
      />
    );
  }

  return (
    <div className="w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto h-full min-h-0 flex-1 flex flex-col justify-between p-2.5 sm:p-3.5 select-none relative overflow-y-auto overscroll-contain bg-[var(--bg)] text-[var(--ink)] font-ui" dir={isRTL ? 'rtl' : 'ltr'}>
      
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
          <span className="truncate max-w-[70px] font-bold">{targetLangInfo.nativeName}</span>
          <span className="bg-[var(--lapis-soft)] text-[var(--lapis)] border border-[var(--lapis)]/20 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
            {currentCard?.cefrLevel || 'A1'}
          </span>
        </div>

        {/* Control Actions (Sound, Guide, Pause) */}
        <div className="flex items-center gap-1.5">
          <button 
            aria-label="Toggle Seating Circle"
            title={isRTL ? "نمایش / مخفی‌سازی چیدمان دور میز" : "Toggle Table Seating"}
            onClick={() => {
              sound.playClick();
              setShowSeatingCircle(prev => !prev);
            }}
            className={`w-8 h-8 rounded-xl border border-[var(--line)] flex items-center justify-center transition-all active:scale-95 shadow-xs ${
              showSeatingCircle ? 'bg-[var(--turq)] text-white border-[var(--turq)]' : 'bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)]'
            }`}
          >
            <Users size={14} />
          </button>

          <button 
            aria-label="Sound Toggle"
            onClick={() => {
              const currentMuted = settings.soundEnabled === false;
              sound.setMuted(!currentMuted);
              if (onUpdateSettings) {
                onUpdateSettings({ ...settings, soundEnabled: currentMuted });
              }
            }}
            className="w-8 h-8 rounded-xl border border-[var(--line)] bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] flex items-center justify-center transition-all active:scale-95 shadow-xs"
          >
            {settings.soundEnabled !== false ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          <button 
            aria-label="Help"
            onClick={() => {
              sound.playClick();
              onOpenHelp?.();
            }}
            className="w-8 h-8 rounded-xl border border-[var(--line)] bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] flex items-center justify-center transition-all active:scale-95 shadow-xs"
          >
            <HelpCircle size={14} />
          </button>

          <button 
            aria-label="Pause"
            onClick={() => {
              sound.playClick();
              setGameStatus(GameStatus.Paused);
            }}
            className="w-8 h-8 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center transition-all active:scale-95 shadow-xs"
          >
            <Pause size={14} />
          </button>
        </div>

      </div>

      {/* Player Arrangement Circle (Interactive Table Seating - Toggleable) */}
      {showSeatingCircle && (
        <div className="my-1 shrink-0 transition-all">
          <PlayerCircle 
            players={players} 
            activePlayerIndex={activePlayerIndex} 
            teams={teams} 
            compact={true}
          />
        </div>
      )}

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
              <Zap size={13} className="text-[var(--lapis)]" />
              <span>{activePlayer?.name || 'Player'}</span>
              <span className="text-[10px] text-[var(--mute)]">({t.teamNames[activeColor]})</span>
            </div>

            {/* Streak Counter 🔥 */}
            {streakCount > 1 && (
              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800/40 text-[11px] font-bold">
                <Flame size={13} className="text-amber-500 fill-amber-500" />
                <span>{isRTL ? `کمبو x${streakCount}!` : `Combo x${streakCount}!`}</span>
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
                    className="text-2xl sm:text-3xl font-extrabold font-card-word tracking-tight text-[var(--ink)]"
                  >
                    {currentCard.targetText}
                  </h2>
                  
                  {/* Pronounce Button */}
                  <button
                    type="button"
                    title={isRTL ? "پخش تلفظ صوتی" : "Audio Pronunciation"}
                    onClick={() => {
                      sound.playClick();
                      sound.speakTargetPhrase(currentCard.targetText, currentCard.targetLanguage);
                    }}
                    className="p-1.5 bg-[var(--turq)] hover:brightness-105 text-white rounded-xl shadow-xs transition-all active:scale-95"
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
                      className="text-2xl sm:text-4xl font-extrabold font-card-word tracking-tight text-[var(--ink)]"
                    >
                      {currentCard?.targetText || '---'}
                    </h2>
                    
                    {currentCard?.targetText && (
                      <button
                        type="button"
                        title={isRTL ? "پخش تلفظ صوتی" : "Audio Pronunciation"}
                        onClick={() => {
                          sound.playClick();
                          sound.speakTargetPhrase(currentCard.targetText, currentCard.targetLanguage);
                        }}
                        className="p-1.5 bg-[var(--turq)] hover:brightness-105 text-white rounded-xl shadow-xs transition-all active:scale-95"
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
              
              {currentCard?.pronunciation && (
                <span className="text-[10px] bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] px-2 py-0.5 rounded-lg font-mono font-bold">
                  🗣️ {currentCard.pronunciation}
                </span>
              )}

              {currentCard?.grammarPoint && (
                <button
                  type="button"
                  onClick={() => setShowGrammar(!showGrammar)}
                  className={`text-[10px] px-2.5 py-1 rounded-xl border border-[var(--line)] font-bold flex items-center gap-1 transition-all ${
                    showGrammar ? 'bg-[var(--lapis)] text-white border-[var(--lapis)]' : 'bg-[var(--panel)] text-[var(--ink)]'
                  }`}
                >
                  <Sparkles size={11} className={showGrammar ? 'text-white' : 'text-[var(--turq)]'} />
                  <span>{isRTL ? 'گرامر' : 'Grammar'}</span>
                </button>
              )}

              {currentCard?.hint && (
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className={`text-[10px] px-2.5 py-1 rounded-xl border border-[var(--line)] font-bold flex items-center gap-1 transition-all ${
                    showHint ? 'bg-[var(--saffron)] text-[#15204A] border-[var(--saffron)]' : 'bg-[var(--panel)] text-[var(--ink)]'
                  }`}
                >
                  <Lightbulb size={11} className={showHint ? 'text-[#15204A]' : 'text-[var(--saffron)]'} />
                  <span>{isRTL ? 'راهنما' : 'Hint'}</span>
                </button>
              )}

            </div>

            {/* Expandable Grammar / Hint Drawers */}
            {showGrammar && currentCard?.grammarPoint && (
              <div className="mt-1.5 p-2.5 bg-[var(--bg)] text-[var(--ink)] rounded-xl text-[11px] font-medium border border-[var(--line)] max-w-xs shadow-xs animate-fadeIn">
                ✨ {currentCard.grammarPoint}
              </div>
            )}

            {showHint && currentCard?.hint && (
              <div className="mt-1.5 p-2.5 bg-[var(--bg)] text-[var(--ink)] rounded-xl text-[11px] font-medium border border-[var(--line)] max-w-xs shadow-xs animate-fadeIn">
                💡 {currentCard.hint}
              </div>
            )}

          </div>

          {/* Clean Card Footer */}
          <div className="flex items-center justify-between text-[11px] font-bold border-t border-[var(--line)] pt-2 shrink-0 font-ui text-[var(--mute)]">
            <span>
              {isRTL ? 'یار پاسخ‌دهنده: ' : 'Guesser: '}<strong className="text-[var(--ink)] font-bold">{partnerPlayer?.name || (isRTL ? 'هم‌تیمی' : 'Partner')}</strong>
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
        />
      </div>

      {/* Floating 3-Second Undo Pill */}
      {undoSnapshot && (
        <div className="w-full flex justify-center mb-1 shrink-0 animate-bounce font-ui">
          <button
            type="button"
            onClick={handleExecuteUndo}
            className="px-4 py-1.5 bg-[var(--saffron)] text-[#15204A] rounded-full border border-[var(--saffron)] font-bold text-xs shadow-sm flex items-center gap-2"
          >
            <RotateCcw size={14} />
            <span>{isRTL ? `بازگشت کارت قبلی (${undoTimeLeft}s)` : `Undo Card (${undoTimeLeft}s)`}</span>
          </button>
        </div>
      )}

      {/* Bottom Action Controls */}
      <div className="w-full space-y-1.5 shrink-0 font-ui">
        
        {/* Main Answer Buttons (Correct / Almost / Skip) */}
        <div className="grid grid-cols-3 gap-2">
          
          {/* Skip / Next */}
          <button
            type="button"
            onClick={handleSkip}
            className="h-16 text-xs sm:text-sm font-extrabold uppercase flex flex-col items-center justify-center gap-1 rounded-2xl bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] shadow-xs transition-all active:scale-[0.97] cursor-pointer"
          >
            <X size={20} strokeWidth={2.5} className="text-rose-500" />
            <span className="leading-none">{isRTL ? 'رد کردن' : 'Skip'}</span>
          </button>

          {/* Almost Correct (Crowd Vote) */}
          <button
            type="button"
            onClick={() => setShowAlmostModal(true)}
            className="h-16 text-xs sm:text-sm font-extrabold uppercase flex flex-col items-center justify-center gap-1 rounded-2xl bg-[var(--saffron)] hover:brightness-105 text-[#15204A] border-0 shadow-xs transition-all active:scale-[0.97] cursor-pointer"
          >
            <ThumbsUp size={20} className="text-[#15204A]" />
            <span className="leading-none text-center">{t.almostCorrectBtn || (isRTL ? 'تقریباً درست' : 'Almost')}</span>
          </button>

          {/* Correct Answer */}
          <button
            type="button"
            onClick={() => handleCorrect(false)}
            className="h-16 text-xs sm:text-sm font-extrabold uppercase flex flex-col items-center justify-center gap-1 rounded-2xl bg-[var(--turq)] hover:brightness-105 text-white border-0 shadow-xs transition-all active:scale-[0.97] cursor-pointer"
          >
            <Check size={22} strokeWidth={3} className="text-white" />
            <span className="leading-none">{isRTL ? 'درست بود!' : 'Correct!'}</span>
          </button>

        </div>

        {/* Secondary Bar: Power Cards Drawer & Swap */}
        <div className="flex gap-2">
          
          {/* +10s Time Power Card */}
          {settings.powerCardsEnabled !== false && (
            <button
              type="button"
              onClick={() => usePowerCard('time')}
              className="flex-1 py-2 bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] rounded-xl text-[11px] font-bold shadow-xs flex items-center justify-center gap-1 transition-all active:scale-[0.98]"
            >
              <Clock size={13} className="text-[var(--lapis)]" />
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
            className={`flex-1 py-2 border border-[var(--line)] rounded-xl text-[11px] font-bold shadow-xs flex items-center justify-center gap-1 transition-all active:scale-[0.98] ${
              swapCooldown <= 0
                ? 'bg-[var(--panel)] hover:bg-[var(--bg)] text-[var(--ink)]'
                : 'opacity-40 cursor-not-allowed bg-[var(--bg)] text-[var(--mute)]'
            }`}
          >
            <RotateCcw size={13} />
            <span>{swapCooldown > 0 ? (isRTL ? `تعویض (${Math.ceil(swapCooldown/1000)}s)` : `Swap (${Math.ceil(swapCooldown/1000)}s)`) : (isRTL ? 'تعویض کارت' : 'Swap Card')}</span>
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
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FFE600] border-2 border-[#241442] flex items-center justify-center shadow-[3px_3px_0px_0px_#241442]">
              <Smartphone size={28} className="text-[#1a0833] animate-bounce" />
            </div>
            <h3 className="text-base font-black text-[#1a0833]">
              {isRTL ? (
                <>گوشی را به <span className="text-[#FF007F]">{activePlayer?.name}</span> بدهید!</>
              ) : (
                <>Pass phone to <span className="text-[#FF007F]">{activePlayer?.name}</span>!</>
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
      {gameStatus === GameStatus.Paused && (
        <Modal isOpen={true} onClose={() => setGameStatus(GameStatus.ActiveTurn)} title={t.paused}>
          <div className="p-4 text-center space-y-3 font-ui" dir={isRTL ? 'rtl' : 'ltr'}>
            <p className="text-xs font-bold text-slate-600">
              {isRTL ? 'بازی موقتاً متوقف شده است.' : 'Game is temporarily paused.'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
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
                  onExit();
                }}
                className="pixel-btn pixel-btn-dark flex-1 py-2.5 text-xs font-black uppercase"
              >
                {t.exit}
              </button>
            </div>
          </div>
        </Modal>
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

    </div>
  );
};

export default GameplayScreen;
