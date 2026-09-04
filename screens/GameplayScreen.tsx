import React, { useEffect, useState, useRef } from 'react';
import { GameSettings, GameStatus, Team, Player, GameHistoryEntry, TeamColor, LanguageCard, PlayedCardRecord } from '../types';
import { COLORS_MAP, SUPPORTED_LANGUAGES } from '../constants';
import { TRANSLATIONS } from '../translations';
import PlayerCircle from '../components/PlayerCircle';
import TimerDisplay from '../components/TimerDisplay';
import Modal from '../components/Modal';
import EndGameScreen from './EndGameScreen';
import { TeamMascot } from '../components/Mascots';
import { sound } from '../soundManager';
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
  EyeOff
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
  onOpenHelp: () => void;
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
  const isRTL = language === 'fa' || language === 'ar';

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
      setBonusNotification('⏱️ ۱۰+ ثانیه زمان اضافه شد!');
      setTimeout(() => setBonusNotification(null), 1500);
      setPowerCardsUsed(prev => [...prev, 'time']);
    } else if (type === 'hint') {
      setShowHint(true);
      setBonusNotification('💡 راهنما فعال شد!');
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
    <div className="h-full min-h-0 flex-1 flex flex-col justify-between p-3.5 sm:p-4 select-none relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      
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
      <div className="flex items-center justify-between gap-2 bg-[#241442] p-2.5 rounded-2xl border-2 border-[#00F0FF]/40 text-white shadow-[3px_3px_0px_0px_#140827] shrink-0">
        
        {/* Round Badge */}
        <div className="flex items-center gap-1.5 bg-[#FF007F] text-white px-2.5 py-1 rounded-xl font-black text-xs border border-[#241442] shadow-[1px_1px_0px_0px_#241442]">
          <span>{t.round} {currentRound}/{settings.roundsCount}</span>
        </div>

        {/* Center Target Language & CEFR Level Badge */}
        <div className="flex items-center gap-1.5 bg-white text-[#1a0833] px-2.5 py-1 rounded-xl border border-[#241442] font-black text-xs shadow-[1px_1px_0px_0px_#241442]">
          <span className="text-sm">{targetLangInfo.flag}</span>
          <span className="truncate max-w-[70px]">{targetLangInfo.nativeName}</span>
          <span className="bg-[#241442] text-[#39FF14] text-[9.5px] px-1 py-0.2 rounded">
            {currentCard?.cefrLevel || 'A1'}
          </span>
        </div>

        {/* Control Actions (Sound, Guide, Pause) */}
        <div className="flex items-center gap-1.5">
          <button 
            aria-label="Sound Toggle"
            onClick={() => {
              const currentMuted = settings.soundEnabled === false;
              sound.setMuted(!currentMuted);
              if (onUpdateSettings) {
                onUpdateSettings({ ...settings, soundEnabled: currentMuted });
              }
            }}
            className="p-1.5 bg-[#F4E8FF] hover:bg-slate-200 text-[#1a0833] rounded-xl border border-[#241442]"
          >
            {settings.soundEnabled !== false ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          <button 
            aria-label="Help"
            onClick={() => {
              sound.playClick();
              onOpenHelp();
            }}
            className="p-1.5 bg-[#FFE600] text-[#1a0833] rounded-xl border border-[#241442]"
          >
            <HelpCircle size={15} />
          </button>

          <button 
            aria-label="Pause"
            onClick={() => {
              sound.playClick();
              setGameStatus(GameStatus.Paused);
            }}
            className="p-1.5 bg-[#FF1058] text-white rounded-xl border border-[#241442]"
          >
            <Pause size={15} />
          </button>
        </div>

      </div>

      {/* Player Arrangement Circle (Interactive Table Seating) */}
      <div className="my-1 shrink-0">
        <PlayerCircle 
          players={players} 
          activePlayerIndex={activePlayerIndex} 
          teams={teams} 
        />
      </div>

      {/* Main Active Language Card */}
      <div className="w-full flex-1 min-h-0 flex flex-col justify-between my-1">
        
        <div 
          className={`w-full h-full p-3 sm:p-4 rounded-3xl border-[3.5px] border-[#241442] shadow-[4px_4px_0px_0px_#241442] flex flex-col justify-between relative overflow-hidden transition-all ${
            currentCard?.isGolden 
              ? 'bg-gradient-to-br from-[#FFFDE7] via-[#FFF59D] to-[#FFE082] ring-2 ring-[#FFE600]' 
              : 'bg-white'
          }`}
        >
          {/* Top Card Bar: Active Player & Mode Badge */}
          <div className="flex items-center justify-between gap-1.5 shrink-0">
            
            {/* Active Player Pill */}
            <div 
              className="px-2.5 py-1 rounded-xl border-2 border-[#241442] font-black text-xs shadow-[1.5px_1.5px_0px_0px_#241442] flex items-center gap-1.5"
              style={{ backgroundColor: activeConfig.hex, color: '#1a0833' }}
            >
              <Zap size={13} fill="#1a0833" />
              <span>{activePlayer?.name || 'Player'}</span>
              <span className="text-[10px] opacity-75">({t.teamNames[activeColor]})</span>
            </div>

            {/* Streak Counter 🔥 */}
            {streakCount > 1 && (
              <div className="flex items-center gap-1 bg-[#241442] text-[#FFE600] px-2 py-0.5 rounded-lg border border-[#FFE600] text-[11px] font-black animate-pulse">
                <Flame size={13} color="#FF007F" fill="#FF007F" />
                <span>کمبو x{streakCount}!</span>
              </div>
            )}

            {/* Clean Learning Mode Badge */}
            <div className={`px-2.5 py-1 rounded-xl border-2 border-[#241442] font-black text-[11px] flex items-center gap-1 ${
              currentCard?.isReverse || currentCard?.learningMode === 'Reverse'
                ? 'bg-[#FFE600] text-[#1a0833]'
                : 'bg-[#F2E8FF] text-[#7B2CBF]'
            }`}>
              {currentCard?.isReverse || currentCard?.learningMode === 'Reverse' ? (
                <>
                  <RotateCcw size={12} className="text-[#FF007F]" />
                  <span>ترجمه معکوس</span>
                </>
              ) : (
                <span>{currentCard?.cefrLevel ? `سطح ${currentCard.cefrLevel}` : 'گفتار'}</span>
              )}
            </div>

          </div>

          {/* Center Card Content Area - Clean, Focused, High Legibility */}
          <div className="flex-1 flex flex-col items-center justify-center py-1 text-center">
            
            {/* SCENARIO 1: REVERSE TRANSLATION MODE */}
            {currentCard?.isReverse ? (
              <div className="w-full flex flex-col items-center space-y-2">
                {/* Clean Prompt Bubble in Persian */}
                <div className="w-full max-w-sm bg-[#241442] text-white p-2.5 sm:p-3 rounded-2xl border-2 border-[#FFE600] shadow-[2px_2px_0px_0px_#241442]">
                  <span className="text-[10px] text-[#FFE600] font-black block mb-0.5">
                    این عبارت را به زبان هدف ادا کن:
                  </span>
                  <p className="text-sm sm:text-base font-black text-white font-display leading-snug">
                    «{currentCard.translation}»
                  </p>
                </div>

                {/* Target Foreign Answer (Hero text with LTR) */}
                <div className="flex items-center justify-center gap-2 pt-0.5">
                  <h2 
                    dir="ltr" 
                    className="text-xl sm:text-2xl font-black font-display tracking-tight text-[#1a0833]"
                  >
                    {currentCard.targetText}
                  </h2>
                  
                  {/* Pronounce Button */}
                  <button
                    type="button"
                    title="پخش تلفظ صوتی"
                    onClick={() => {
                      sound.playClick();
                      sound.speakTargetPhrase(currentCard.targetText, currentCard.targetLanguage);
                    }}
                    className="p-1.5 bg-[#39FF14] hover:bg-green-400 text-[#1a0833] rounded-xl border-2 border-[#241442] shadow-[1.5px_1.5px_0px_0px_#241442] transition-transform active:scale-90"
                  >
                    <Volume2 size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center space-y-1.5">
                {/* SCENARIO 2: REGULAR EXPLAIN / SPEAK MODE */}
                
                {/* Hero Target Word / Phrase */}
                <div className="flex items-center justify-center gap-2">
                  <h2 
                    dir="ltr" 
                    className="text-2xl sm:text-3xl font-black font-display tracking-tight text-[#1a0833]"
                  >
                    {currentCard?.targetText || '---'}
                  </h2>
                  
                  {currentCard?.targetText && (
                    <button
                      type="button"
                      title="پخش تلفظ صوتی"
                      onClick={() => {
                        sound.playClick();
                        sound.speakTargetPhrase(currentCard.targetText, currentCard.targetLanguage);
                      }}
                      className="p-1.5 bg-[#39FF14] hover:bg-green-400 text-[#1a0833] rounded-xl border-2 border-[#241442] shadow-[1.5px_1.5px_0px_0px_#241442] transition-transform active:scale-90"
                    >
                      <Volume2 size={16} />
                    </button>
                  )}
                </div>

                {/* Meaning / Translation */}
                {currentCard?.translation && (
                  <p className="text-sm sm:text-base font-black text-[#FF007F]">
                    {currentCard.translation}
                  </p>
                )}

                {/* Short Situational Clue (if helpful & not repetitive) */}
                {currentCard?.prompt && !currentCard.prompt.includes('🔄') && !currentCard.prompt.includes('ترجمه به') && (
                  <p className="text-[11px] text-slate-600 font-bold max-w-xs leading-tight">
                    {currentCard.prompt}
                  </p>
                )}

              </div>
            )}

            {/* Smart Micro-Hints Toolbar (Compact & Lightweight) */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
              
              {currentCard?.pronunciation && (
                <span className="text-[10px] bg-[#241442] text-[#39FF14] px-2 py-0.5 rounded-lg font-mono font-bold">
                  🗣️ {currentCard.pronunciation}
                </span>
              )}

              {currentCard?.grammarPoint && (
                <button
                  type="button"
                  onClick={() => setShowGrammar(!showGrammar)}
                  className={`text-[10px] px-2 py-0.5 rounded-lg border border-[#241442] font-black flex items-center gap-1 transition-all ${
                    showGrammar ? 'bg-[#00F0FF] text-[#1a0833]' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Sparkles size={11} className={showGrammar ? 'text-[#1a0833]' : 'text-[#7B2CBF]'} />
                  <span>گرامر</span>
                </button>
              )}

              {currentCard?.hint && (
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className={`text-[10px] px-2 py-0.5 rounded-lg border border-[#241442] font-black flex items-center gap-1 transition-all ${
                    showHint ? 'bg-[#FFE600] text-[#1a0833]' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Lightbulb size={11} className={showHint ? 'text-[#1a0833]' : 'text-[#FF007F]'} />
                  <span>راهنما</span>
                </button>
              )}

            </div>

            {/* Smooth Expandable Grammar / Hint Drawers */}
            {showGrammar && currentCard?.grammarPoint && (
              <div className="mt-1.5 p-2 bg-[#241442] text-[#00F0FF] rounded-xl text-[10.5px] font-bold border border-[#00F0FF]/40 max-w-xs animate-fadeIn">
                ✨ {currentCard.grammarPoint}
              </div>
            )}

            {showHint && currentCard?.hint && (
              <div className="mt-1.5 p-2 bg-[#FFE600] text-[#1a0833] rounded-xl text-[10.5px] font-black border border-[#241442] max-w-xs animate-fadeIn">
                💡 {currentCard.hint}
              </div>
            )}

          </div>

          {/* Clean Card Footer */}
          <div className="flex items-center justify-between text-[11px] font-black border-t border-slate-200/80 pt-1.5 shrink-0">
            <span className="text-slate-600">
              یار پاسخ‌دهنده: <strong className="text-[#1a0833]">{partnerPlayer?.name || 'هم‌تیمی'}</strong>
            </span>
            <span className="bg-[#FFE600] text-[#1a0833] px-2 py-0.5 rounded-lg border border-[#241442] text-[10.5px]">
              +{currentCard?.isGolden ? (currentCard.points * 2) : (currentCard?.points || 1)} امتیاز ⭐
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
        <div className="w-full flex justify-center mb-1 shrink-0 animate-bounce">
          <button
            type="button"
            onClick={handleExecuteUndo}
            className="px-4 py-1.5 bg-[#FFE600] text-[#1a0833] rounded-full border-2 border-[#241442] font-black text-xs shadow-[3px_3px_0px_0px_#241442] flex items-center gap-2"
          >
            <RotateCcw size={14} />
            <span>بازگشت کارت قبلی ({undoTimeLeft}s)</span>
          </button>
        </div>
      )}

      {/* Bottom Action Controls */}
      <div className="w-full space-y-1.5 shrink-0">
        
        {/* Main Answer Buttons (Correct / Almost / Skip) */}
        <div className="flex gap-2">
          
          {/* Skip / Next */}
          <button
            type="button"
            onClick={handleSkip}
            className="pixel-btn pixel-btn-pink flex-1 py-3 text-sm font-black uppercase flex items-center justify-center gap-1.5"
          >
            <X size={18} strokeWidth={3} />
            <span>رد کردن</span>
          </button>

          {/* Almost Correct (Crowd Vote) */}
          <button
            type="button"
            onClick={() => setShowAlmostModal(true)}
            className="pixel-btn pixel-btn-cyan flex-1 py-3 text-xs font-black uppercase flex items-center justify-center gap-1"
          >
            <ThumbsUp size={15} />
            <span>تقریباً درست</span>
          </button>

          {/* Correct Answer */}
          <button
            type="button"
            onClick={() => handleCorrect(false)}
            className="pixel-btn pixel-btn-lime flex-[1.5] py-3 text-sm font-black uppercase flex items-center justify-center gap-2"
          >
            <Check size={20} strokeWidth={3.5} />
            <span>درست بود!</span>
          </button>

        </div>

        {/* Secondary Bar: Power Cards Drawer & Swap */}
        <div className="flex gap-2">
          
          {/* +10s Time Power Card */}
          {settings.powerCardsEnabled !== false && (
            <button
              type="button"
              onClick={() => usePowerCard('time')}
              className="flex-1 py-1.5 bg-white hover:bg-slate-50 text-[#1a0833] border-2 border-[#241442] rounded-xl text-[10.5px] font-black shadow-[2px_2px_0px_0px_#241442] flex items-center justify-center gap-1"
            >
              <Clock size={13} className="text-[#FF007F]" />
              <span>۱۰+ ثانیه وقت</span>
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
            className={`flex-1 py-1.5 border-2 border-[#241442] rounded-xl text-[10.5px] font-black shadow-[2px_2px_0px_0px_#241442] flex items-center justify-center gap-1 ${
              swapCooldown <= 0
                ? 'bg-[#FFE600] text-[#1a0833] hover:bg-yellow-300'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            <RotateCcw size={13} />
            <span>{swapCooldown > 0 ? `تعویض (${Math.ceil(swapCooldown/1000)}s)` : 'تعویض کارت'}</span>
          </button>

        </div>

      </div>

      {/* Almost Correct Vote Modal */}
      {showAlmostModal && (
        <Modal 
          isOpen={showAlmostModal} 
          onClose={() => setShowAlmostModal(false)}
          title="رأی‌گیری جمعی: تقریباً درست؟"
        >
          <div className="p-3 text-center space-y-3">
            <p className="text-xs font-bold text-slate-700">
              اگر پاسخ هم‌تیمی با اشتباه گرامری یا تلفظی جزیی گفته شده، آیا بقیه بازیکنان امتیاز را تایید می‌کنند؟
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
                تایید جمعی (درست)
              </button>
              <button
                type="button"
                onClick={() => setShowAlmostModal(false)}
                className="pixel-btn pixel-btn-dark flex-1 py-2 text-xs font-black uppercase"
              >
                انصراف
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* PASS PHONE GUARD SCREEN */}
      {gameStatus === GameStatus.PassPhone && (
        <Modal isOpen={true} onClose={() => {}} title={t.passPhone}>
          <div className="p-4 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FFE600] border-2 border-[#241442] flex items-center justify-center shadow-[3px_3px_0px_0px_#241442]">
              <Smartphone size={28} className="text-[#1a0833] animate-bounce" />
            </div>
            <h3 className="text-base font-black text-[#1a0833]">
              گوشی را به <span className="text-[#FF007F]">{activePlayer?.name}</span> بدهید!
            </h3>
            <p className="text-xs text-slate-600 font-bold">
              وقتی گوشی به دست نفر جدید رسید، دکمه آماده‌ام را لمس کنید تا کارت نمایش داده شود.
            </p>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setGameStatus(GameStatus.ActiveTurn);
              }}
              className="pixel-btn pixel-btn-pink w-full py-3 text-sm font-black uppercase"
            >
              آماده‌ام، شروع نوبت! ⚡
            </button>
          </div>
        </Modal>
      )}

      {/* PAUSE MODAL */}
      {gameStatus === GameStatus.Paused && (
        <Modal isOpen={true} onClose={() => setGameStatus(GameStatus.ActiveTurn)} title={t.paused}>
          <div className="p-4 text-center space-y-3">
            <p className="text-xs font-bold text-slate-600">بازی موقتاً متوقف شده است.</p>
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
          <div className="p-4 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FF1058] border-2 border-[#241442] flex items-center justify-center text-white shadow-[3px_3px_0px_0px_#241442]">
              <Skull size={28} />
            </div>
            <h3 className="text-base font-black text-[#1a0833]">
              تیم {t.teamNames[eliminatedTeamName as TeamColor]} حذف شد!
            </h3>
            <p className="text-xs text-slate-600 font-bold">
              زمان این تیم به پایان رسید. بقیه تیم‌ها به رقابت ادامه می‌دهند.
            </p>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setGameStatus(GameStatus.ActiveTurn);
              }}
              className="pixel-btn pixel-btn-lime w-full py-3 text-sm font-black uppercase"
            >
              ادامه مسابقه
            </button>
          </div>
        </Modal>
      )}

      {/* ROUND ENDED MODAL */}
      {gameStatus === GameStatus.RoundEnded && (
        <Modal isOpen={true} onClose={() => {}} title={`پایان دور ${currentRound}`}>
          <div className="p-4 text-center space-y-3">
            <h3 className="text-sm font-black text-[#1a0833]">
              دور {currentRound} از {settings.roundsCount} به پایان رسید!
            </h3>
            <p className="text-xs text-slate-600 font-bold">
              برای شروع دور بعد و ادامه مسابقه آماده شوید.
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
              {currentRound < settings.roundsCount ? `شروع دور ${currentRound + 1} ⚡` : 'مشاهده نتایج نهایی 🏆'}
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default GameplayScreen;
