import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Language,
  GameSettings, 
  GameStatus, 
  GameHistoryEntry, 
  Team, 
  Player, 
  TeamColor, 
  LanguageCard, 
  PlayedCardRecord, 
  OnlineRoomState,
  SinglePlayerSettings,
  SinglePlayerSessionReport
} from './types';
import { buildSessionCardPool } from './cardsData';
import { getUniqueCardsForSession } from './contentEngine';
import IntroScreen from './screens/IntroScreen';
import LanguageSelectScreen from './screens/LanguageSelectScreen';
import SetupScreen from './screens/SetupScreen';
import CategoryScreen from './screens/CategoryScreen';
import PlayerNameScreen from './screens/PlayerNameScreen';
import SeatingConfirmScreen from './screens/SeatingConfirmScreen';
import GameplayScreen from './screens/GameplayScreen';
import HistoryScreen from './screens/HistoryScreen';
import HelpScreen from './screens/HelpScreen';
import OnlineLobbyScreen from './screens/OnlineLobbyScreen';
import OnlineGameplayScreen from './screens/OnlineGameplayScreen';
import SinglePlayerScreen from './screens/SinglePlayerScreen';
import SinglePlayerReportScreen from './screens/SinglePlayerReportScreen';
import DuelScreen from './screens/DuelScreen';
import SinglePlayerSetupModal from './components/SinglePlayerSetupModal';
import { DuelSetupModal, DuelSettings } from './components/DuelSetupModal';
import LeaderboardModal from './components/LeaderboardModal';
import OfflineIndicator from './components/OfflineIndicator';
import FeedbackOverlay from './components/FeedbackOverlay';
import { feedbackDirector } from './feedbackDirector';
import { sound } from './soundManager';
import { auth, saveMatchToCloud, syncSettingsToCloud } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getRandomCharacters } from './characters';
import { isRtlLang } from './ui';
import { PLAYER_AVATARS } from './constants';

const DEFAULT_SETTINGS: GameSettings = {
  playerCount: 4,
  roundsCount: 3,
  roundDuration: 60,
  difficulty: 'easy',
  cefrLevel: 'all',
  nativeLanguage: 'fa',
  targetLanguages: ['nl', 'en'],
  cardGameMode: 'mixed',
  autoPronounceOnCorrect: true,
  selectedCategories: [
    "CAT_EVERYDAY",
    "CAT_RESTAURANT",
    "CAT_FOOD",
    "CAT_TRAVEL",
    "CAT_SHOPPING",
    "CAT_WORK",
    "CAT_SMALLTALK"
  ],
  playerNames: getRandomCharacters('fa', 8),
  language: 'fa',
  passPhoneScreenEnabled: false,
  soundEnabled: true,
  powerCardsEnabled: true
};

type ScreenType = 'INTRO' | 'LANGUAGE_SELECT' | 'CATEGORIES' | 'SETUP' | 'PLAYERS' | 'SEATING_CONFIRM' | 'GAME' | 'HISTORY' | 'HELP' | 'ONLINE_LOBBY' | 'ONLINE_GAME' | 'SINGLE_PLAYER' | 'SINGLE_REPORT' | 'DUEL_GAME';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('INTRO');
  const [prevScreen, setPrevScreen] = useState<ScreenType>('INTRO');
  const [activeHelpSection, setActiveHelpSection] = useState<string>('intro');
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);

  // 2-Player Shared Screen Duel State
  const [isDuelSetupOpen, setIsDuelSetupOpen] = useState(false);
  const [duelSettings, setDuelSettings] = useState<DuelSettings | null>(null);
  const [duelCards, setDuelCards] = useState<LanguageCard[]>([]);

  // Single-Player State
  const [isSingleSetupOpen, setIsSingleSetupOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [singlePlayerSettings, setSinglePlayerSettings] = useState<SinglePlayerSettings>({
    targetLanguage: 'nl',
    nativeLanguage: 'fa',
    cefrLevel: 'all',
    displayMode: 'text_and_audio',
    questionCount: 10,
    timeLimitSeconds: 0,
    autoPlayAudio: true,
    selectedCategories: DEFAULT_SETTINGS.selectedCategories
  });
  const [singlePlayerCards, setSinglePlayerCards] = useState<LanguageCard[]>([]);
  const [singlePlayerReport, setSinglePlayerReport] = useState<SinglePlayerSessionReport | null>(null);

  // Online Multiplayer Room State
  const [onlineRoom, setOnlineRoom] = useState<OnlineRoomState | null>(null);
  const [onlinePlayerId, setOnlinePlayerId] = useState<number>(0);
  const [initialRoomCode, setInitialRoomCode] = useState<string>('');

  // Check URL query parameters for ?room=CODE
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        setInitialRoomCode(roomParam.trim().toUpperCase());
        setCurrentScreen('ONLINE_LOBBY');
      }
    }
  }, []);

  // Sync document root direction and language
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const isRTL = isRtlLang(settings.language);
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = settings.language;
    }
  }, [settings.language]);

  // Game Feel Screen Shake Subscription
  const [shakeStyle, setShakeStyle] = useState<React.CSSProperties>({});
  useEffect(() => {
    const unsub = feedbackDirector.subscribe(() => {
      const s = feedbackDirector.currentShake;
      if (s.active) {
        setShakeStyle({
          transform: `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0)`,
          transition: 'transform 60ms cubic-bezier(0.16, 1, 0.3, 1)'
        });
      } else {
        setShakeStyle({
          transform: 'translate3d(0, 0, 0)',
          transition: 'transform 80ms ease-out'
        });
      }
    });
    return () => unsub();
  }, []);

  // Gameplay State
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.Setup);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [roundTimer, setRoundTimer] = useState(0);
  
  // SESSION LANGUAGE CARD POOL
  const [sessionCardPool, setSessionCardPool] = useState<LanguageCard[]>([]);
  const [poolPointer, setPoolPointer] = useState(0);
  const [currentCard, setCurrentCard] = useState<LanguageCard | null>(null);
  const [swapCooldown, setSwapCooldown] = useState(20000);
  const [isPoolExhausted, setIsPoolExhausted] = useState(false);
  const [playedCards, setPlayedCards] = useState<PlayedCardRecord[]>([]);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const savedSettings = localStorage.getItem('dor_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        let uiLang = parsed?.language || 'fa';
        const isEnglish = uiLang === 'en' || uiLang === 'en-US' || parsed?.nativeLanguage === 'en' || parsed?.nativeLanguage === 'en-US';
        const nativeLang = isEnglish ? 'en' : (parsed?.nativeLanguage || uiLang || 'fa');
        const isEnglishNative = isEnglish;
        
        // Normalize player names: if native language is English, ensure no leftover Persian names
        let loadedNames: string[] = Array.isArray(parsed?.playerNames) ? parsed.playerNames : [];
        const hasPersianNames = loadedNames.some(name => typeof name === 'string' && /[\u0600-\u06FF]/.test(name));
        if (isEnglishNative && (hasPersianNames || loadedNames.length === 0)) {
          loadedNames = getRandomCharacters('en-US', 8);
        }

        // Normalize UI language: if native is English and language was 'fa', switch to 'en-US'
        if (isEnglishNative && uiLang === 'fa') {
          uiLang = 'en-US';
        }

        // Target languages
        let targets = Array.isArray(parsed?.targetLanguages) && parsed.targetLanguages.length > 0 
          ? parsed.targetLanguages 
          : (isEnglishNative ? ['nl', 'es'] : ['nl', 'en']);
        if (isEnglishNative) {
          targets = targets.filter((t: string) => t !== 'en' && t !== 'en-US');
          if (targets.length === 0) targets = ['nl', 'es'];
        }

        // Validate numbers and enums against corrupted or outdated data
        const validRounds = [3, 4, 5, 6, 7, 8, 9, 10];
        const rounds = validRounds.includes(Number(parsed?.roundsCount)) ? Number(parsed.roundsCount) : 5;
        const parsedDuration = Number(parsed?.roundDuration);
        const duration = !isNaN(parsedDuration) && parsedDuration >= 5 && parsedDuration <= 600 ? parsedDuration : 60;
        const playerCount = [4, 6, 8].includes(Number(parsed?.playerCount)) ? (Number(parsed.playerCount) as 4 | 6 | 8) : 4;
        const cardGameMode = ['mixed', 'reverse', 'standard'].includes(parsed?.cardGameMode) ? parsed.cardGameMode : 'mixed';

        setSettings(prev => ({ 
          ...prev, 
          ...parsed,
          roundsCount: rounds,
          roundDuration: duration,
          playerCount,
          cardGameMode,
          nativeLanguage: nativeLang,
          language: uiLang,
          targetLanguages: targets,
          selectedCategories: Array.isArray(parsed?.selectedCategories) && parsed.selectedCategories.length > 0 
            ? parsed.selectedCategories 
            : (prev.selectedCategories || ["CAT_EVERYDAY", "CAT_RESTAURANT", "CAT_FOOD", "CAT_TRAVEL", "CAT_SHOPPING", "CAT_WORK", "CAT_SMALLTALK"]),
          playerNames: loadedNames.length >= 8 ? loadedNames : getRandomCharacters(isEnglishNative ? 'en-US' : nativeLang, 8)
        }));
      } catch (e) {
        // Fallback
      }
    }
    const savedHistory = localStorage.getItem('dor_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        // Fallback
      }
    }
  }, []);

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        syncSettingsToCloud(user.uid, settingsRef.current).catch(console.error);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const isSoundOn = settings.soundEnabled ?? true;
    sound.setSoundEnabled(isSoundOn);
    if (isSoundOn && currentScreen !== 'GAME') {
      sound.startMenuBGM();
    } else if (currentScreen === 'GAME') {
      sound.stopMenuBGM();
    }
  }, [settings.soundEnabled, currentScreen]);

  useEffect(() => {
    if (typeof sound?.addMuteListener === 'function') {
      const unsub = sound.addMuteListener((muted) => {
        setSettings(prev => ({ ...prev, soundEnabled: !muted }));
      });
      return unsub;
    }
  }, []);

  const saveSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    localStorage.setItem('dor_settings', JSON.stringify(newSettings));
    if (auth.currentUser) {
      syncSettingsToCloud(auth.currentUser.uid, newSettings).catch(console.error);
    }
  };

  const handleGlobalLanguageChange = (newLang: Language) => {
    const isRTL = isRtlLang(newLang);
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = newLang;
    }

    const newNative = newLang;
    const newPlayerNames = getRandomCharacters(newNative, settings.playerCount || 8);
    
    // Ensure targets do not include the player's native language
    let targets = (settings.targetLanguages || []).filter(t => t !== newLang && !(newLang.startsWith('en') && t.startsWith('en')));
    if (targets.length === 0) {
      if (newLang === 'fa' || newLang === 'ar' || newLang === 'tr') {
        targets = ['en', 'de'];
      } else if (newLang === 'en' || newLang === 'en-US') {
        targets = ['es', 'fr'];
      } else {
        targets = ['en', 'es'];
      }
    }

    const updatedSettings: GameSettings = {
      ...settings,
      language: newLang,
      nativeLanguage: newNative,
      playerNames: newPlayerNames,
      targetLanguages: targets
    };

    saveSettings(updatedSettings);

    // Also update single player settings
    setSinglePlayerSettings(prev => {
      let singleTarget = prev.targetLanguage;
      if (singleTarget === newLang || (newLang.startsWith('en') && singleTarget.startsWith('en'))) {
        singleTarget = newLang.startsWith('en') ? 'es' : 'en';
      }
      return {
        ...prev,
        nativeLanguage: newNative,
        targetLanguage: singleTarget
      };
    });
  };

  /**
   * Card Selection from shuffled session pool
   */
  const getNextWord = useCallback(() => {
    setPoolPointer(currentPtr => {
      if (currentPtr >= sessionCardPool.length) {
        setIsPoolExhausted(true);
        setGameStatus(GameStatus.WordExhaustion);
        return currentPtr;
      }

      const card = sessionCardPool[currentPtr];
      if (card) {
        setCurrentCard(card);
      }
      
      setSwapCooldown(20000);
      return currentPtr + 1;
    });
  }, [sessionCardPool]);

  /**
   * Prepares Teams, Seating, and Multi-Language Card Pool, then shows SEATING_CONFIRM
   */
  const prepareGameSeating = () => {
    const teamColors = [TeamColor.Blue, TeamColor.Red, TeamColor.Green, TeamColor.Yellow];
    const teamCount = settings.playerCount / 2;
    const initialRoundMs = settings.roundDuration * 1000;

    // Team 1: (P1, P_opposite), Team 2: (P2, P_opposite), etc.
    const initialTeams: Team[] = Array.from({ length: teamCount }).map((_, i) => ({
      id: i,
      color: teamColors[i],
      timeRemaining: initialRoundMs,
      isEliminated: false,
      playerIds: [i, i + teamCount],
      score: 0,
      comboStreak: 0
    }));

    const effectiveNative = settings.nativeLanguage || settings.language || 'en-US';
    const isEnNative = effectiveNative === 'en-US' || effectiveNative === 'en';
    const randomCartoonDefaults = getRandomCharacters(effectiveNative, settings.playerCount);
    
    const initialPlayers: Player[] = Array.from({ length: settings.playerCount }).map((_, i) => {
      const teamId = i % teamCount;
      const customName = settings.playerNames?.[i]?.trim();
      const defaultName = customName && customName.length > 0 
        ? customName 
        : (effectiveNative === 'fa' ? `بازیکن ${i + 1}` : `Player ${i + 1}`);
      const avatar = PLAYER_AVATARS[i % PLAYER_AVATARS.length];
      return {
        id: i,
        name: defaultName,
        avatar: avatar,
        teamId: teamId,
        teamColor: teamColors[teamId]
      };
    });

    // Build the Multi-Language balanced card pool from user selections
    let activeTargets = settings.targetLanguages || ['nl', 'es'];
    activeTargets = activeTargets.filter(t => t !== effectiveNative && !(isEnNative && (t === 'en' || t === 'en-US')));
    if (activeTargets.length === 0) {
      activeTargets = isEnNative ? ['es', 'fr'] : ['en', 'es'];
    }

    const pool = buildSessionCardPool(
      activeTargets,
      settings.selectedCategories,
      settings.cefrLevel || 'all',
      effectiveNative,
      settings.cardGameMode || 'mixed'
    );
    setSessionCardPool(pool);
    setPoolPointer(0);
    setIsPoolExhausted(false);
    setPlayedCards([]);
    
    setTeams(initialTeams);
    setPlayers(initialPlayers);
    setCurrentRound(1);
    setActivePlayerIndex(0);
    setRoundTimer(settings.roundDuration * 1000);

    if (pool.length > 0) {
      setCurrentCard(pool[0]);
      setPoolPointer(1);
    }

    setGameStatus(GameStatus.SeatingConfirm);
    setCurrentScreen('SEATING_CONFIRM');
  };

  /**
   * Start Round 1 after Seating Confirmation
   */
  const startConfirmedGame = () => {
    setGameStatus(GameStatus.ActiveTurn);
    setCurrentScreen('GAME');
  };

  const handleResume = () => {
    getNextWord();
    setGameStatus(prev => prev === GameStatus.WinnerScreen || prev === GameStatus.GameEnded ? prev : GameStatus.ActiveTurn);
  };

  const openHelp = (section: string) => {
    setActiveHelpSection(section);
    if (currentScreen === 'GAME') setGameStatus(GameStatus.Paused);
    setPrevScreen(currentScreen);
    setCurrentScreen('HELP');
  };

  const closeHelp = () => {
    setCurrentScreen(prevScreen);
    if (prevScreen === 'GAME') {
      handleResume();
    }
  };

  // Rock-solid delta timer loop for ACTIVE_TURN (50ms interval, no drift)
  const lastTickRef = useRef<number>(Date.now());
  useEffect(() => {
    if (gameStatus === GameStatus.ActiveTurn) {
      lastTickRef.current = Date.now();
      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        const delta = Math.min(500, Math.max(10, now - lastTickRef.current));
        lastTickRef.current = now;

        setRoundTimer(prev => {
          if (prev <= delta) {
            setGameStatus(GameStatus.RoundEnded);
            return 0;
          }
          return prev - delta;
        });

        const activePlayer = players[activePlayerIndex];
        if (activePlayer) {
          setTeams(prev => prev.map(t => {
            if (t.id === activePlayer.teamId && !t.isEliminated) {
              const newTime = Math.max(0, t.timeRemaining - delta);
              return { ...t, timeRemaining: newTime };
            }
            return t;
          }));
        }

        setSwapCooldown(prev => Math.max(0, prev - delta));
      }, 50);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStatus, activePlayerIndex, players]);

  // Auto-pause when tab is hidden or app switched (Interrupt & resume safety)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && gameStatus === GameStatus.ActiveTurn) {
        setGameStatus(GameStatus.Paused);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [gameStatus]);

  // Record Game to Local & Firebase History
  const handleGameFinish = (entry: GameHistoryEntry) => {
    const updated = [entry, ...history];
    setHistory(updated);
    localStorage.setItem('dor_history', JSON.stringify(updated));
    if (auth.currentUser) {
      saveMatchToCloud(auth.currentUser.uid, entry).catch(console.error);
    }
  };

  const handleExitGame = () => {
    setGameStatus(GameStatus.Setup);
    setCurrentScreen('INTRO');
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('dor_history');
  };

  // Single Player Flow
  const handleOpenSinglePlayer = () => {
    setSinglePlayerSettings(prev => ({
      ...prev,
      nativeLanguage: settings.nativeLanguage || settings.language || 'fa',
      selectedCategories: settings.selectedCategories
    }));
    setIsSingleSetupOpen(true);
  };

  const handleStartSinglePlayer = (config: SinglePlayerSettings) => {
    setIsSingleSetupOpen(false);
    const effectiveNative = config.nativeLanguage || settings.nativeLanguage || settings.language || 'fa';
    const effectiveConfig = {
      ...config,
      nativeLanguage: effectiveNative
    };
    const cards = getUniqueCardsForSession(
      effectiveConfig.targetLanguage,
      effectiveNative,
      effectiveConfig.cefrLevel,
      effectiveConfig.selectedCategories,
      effectiveConfig.questionCount,
      true
    );
    setSinglePlayerCards(cards);
    setSinglePlayerSettings(effectiveConfig);
    setCurrentScreen('SINGLE_PLAYER');
  };

  const handleSinglePlayerFinish = (report: SinglePlayerSessionReport) => {
    setSinglePlayerReport(report);
    setCurrentScreen('SINGLE_REPORT');
  };

  const handlePracticeWeakCards = (weakCards: LanguageCard[]) => {
    setSinglePlayerCards(weakCards);
    setSinglePlayerSettings(prev => ({
      ...prev,
      nativeLanguage: settings.nativeLanguage || settings.language || 'fa'
    }));
    setCurrentScreen('SINGLE_PLAYER');
  };

  const handleOpenDuel = () => {
    sound.playClick();
    setIsDuelSetupOpen(true);
  };

  const handleStartDuel = (duelSet: DuelSettings) => {
    setDuelSettings(duelSet);
    setIsDuelSetupOpen(false);
    const isEn = settings.language === 'en' || settings.language === 'en-US' || !isRtlLang(settings.language);
    const effectiveNative = isEn ? 'en' : (duelSet.nativeLanguage || settings.nativeLanguage || settings.language || 'fa');
    const cards = getUniqueCardsForSession(
      duelSet.targetLanguage,
      effectiveNative,
      duelSet.cefrLevel,
      settings.selectedCategories,
      Math.max(duelSet.winningScore * 4, 30),
      false
    );
    setDuelCards(cards.length > 0 ? cards : buildSessionCardPool({
      ...settings,
      nativeLanguage: effectiveNative,
      targetLanguages: [duelSet.targetLanguage],
      cefrLevel: duelSet.cefrLevel,
      difficulty: 'all',
      roundsCount: 3,
      roundDuration: 60
    }));
    setCurrentScreen('DUEL_GAME');
  };

  return (
    <main 
      className="w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto flex flex-col relative bg-[var(--bg)] text-[var(--ink)] min-h-0 flex-1 min-h-screen overflow-x-hidden overflow-y-auto" 
      style={{ 
        height: '100%', 
        maxHeight: '100dvh',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        ...shakeStyle
      }}
    >
      {/* Decoupled Game Feel & Juice Feedback Overlay (Layers 1, 2, 3) */}
      <FeedbackOverlay />
      
      {/* Offline PWA Connectivity Indicator */}
      <OfflineIndicator language={settings.language} />

      {/* 1. INTRO SCREEN */}
      {currentScreen === 'INTRO' && (
        <IntroScreen
          language={settings.language}
          settings={settings}
          onUpdateSettings={saveSettings}
          onLanguageChange={handleGlobalLanguageChange}
          onNext={() => setCurrentScreen('SETUP')}
          onOpenSinglePlayer={handleOpenSinglePlayer}
          onOpenDuel={handleOpenDuel}
          onOpenOnline={() => setCurrentScreen('ONLINE_LOBBY')}
          onOpenHistory={() => setCurrentScreen('HISTORY')}
          onOpenHelp={() => openHelp('intro')}
        />
      )}

      {/* 1.5 ONLINE MULTIPLAYER LOBBY */}
      {currentScreen === 'ONLINE_LOBBY' && (
        <OnlineLobbyScreen
          language={settings.language}
          initialSettings={settings}
          initialRoomCode={initialRoomCode}
          onStartGame={(room, myPlayerId) => {
            setOnlineRoom(room);
            setOnlinePlayerId(myPlayerId);
            setCurrentScreen('ONLINE_GAME');
          }}
          onBack={() => setCurrentScreen('INTRO')}
        />
      )}

      {/* 1.6 ONLINE GAMEPLAY SCREEN */}
      {currentScreen === 'ONLINE_GAME' && onlineRoom && (
        <OnlineGameplayScreen
          initialRoom={onlineRoom}
          myPlayerId={onlinePlayerId}
          language={settings.language}
          onExit={() => {
            setOnlineRoom(null);
            setCurrentScreen('INTRO');
          }}
        />
      )}

      {/* 2. LANGUAGE SELECT SCREEN (Optional fallback / deep link) */}
      {currentScreen === 'LANGUAGE_SELECT' && (
        <LanguageSelectScreen
          settings={settings}
          onSave={saveSettings}
          onNext={() => setCurrentScreen('SETUP')}
          onBack={() => setCurrentScreen('INTRO')}
          onOpenHelp={() => openHelp('languageSelect')}
        />
      )}

      {/* 3. CATEGORY SELECT SCREEN (Optional fallback / deep link) */}
      {currentScreen === 'CATEGORIES' && (
        <CategoryScreen
          settings={settings}
          onSave={saveSettings}
          onNext={() => setCurrentScreen('SETUP')}
          onBack={() => setCurrentScreen('SETUP')}
          onOpenHelp={() => openHelp('categories')}
        />
      )}

      {/* 4. SETUP SCREEN (Unified fast setup: Languages, CEFR, Players, Topics, Duration) */}
      {currentScreen === 'SETUP' && (
        <SetupScreen
          settings={settings}
          onSave={saveSettings}
          onNext={prepareGameSeating}
          onBack={() => setCurrentScreen('INTRO')}
          onOpenHelp={() => openHelp('rules')}
        />
      )}

      {/* 5. PLAYER NAMES SCREEN (Optional fallback / deep link) */}
      {currentScreen === 'PLAYERS' && (
        <PlayerNameScreen
          settings={settings}
          onSave={saveSettings}
          onStart={prepareGameSeating}
          onBack={() => setCurrentScreen('SETUP')}
          onOpenHelp={() => openHelp('setup')}
        />
      )}

      {/* 6. SEATING CONFIRM SCREEN */}
      {currentScreen === 'SEATING_CONFIRM' && (
        <SeatingConfirmScreen
          players={players}
          teams={teams}
          settings={settings}
          onConfirm={startConfirmedGame}
          onBack={() => setCurrentScreen('SETUP')}
          onOpenHelp={() => openHelp('rules')}
        />
      )}

      {/* 7. GAMEPLAY SCREEN */}
      {currentScreen === 'GAME' && (
        <GameplayScreen
          settings={settings}
          onUpdateSettings={saveSettings}
          gameStatus={gameStatus}
          setGameStatus={setGameStatus}
          teams={teams}
          setTeams={setTeams}
          players={players}
          currentRound={currentRound}
          setCurrentRound={setCurrentRound}
          activePlayerIndex={activePlayerIndex}
          setActivePlayerIndex={setActivePlayerIndex}
          roundTimer={roundTimer}
          setRoundTimer={setRoundTimer}
          currentCard={currentCard}
          swapCooldown={swapCooldown}
          onGetNextWord={getNextWord}
          onResume={handleResume}
          isPoolExhausted={isPoolExhausted}
          onFinish={handleGameFinish}
          onExit={handleExitGame}
          onOpenHelp={() => openHelp('rules')}
          playedCards={playedCards}
          setPlayedCards={setPlayedCards}
        />
      )}

      {/* 8. HISTORY SCREEN */}
      {currentScreen === 'HISTORY' && (
        <HistoryScreen
          history={history}
          onBack={() => setCurrentScreen('INTRO')}
          language={settings.language}
        />
      )}

      {/* 9. HELP SCREEN */}
      {currentScreen === 'HELP' && (
        <HelpScreen
          language={settings.language}
          initialSection={activeHelpSection}
          onClose={closeHelp}
        />
      )}

      {/* 10. SINGLE-PLAYER FLASHCARDS & VOICE CHALLENGE */}
      {currentScreen === 'SINGLE_PLAYER' && (
        <SinglePlayerScreen
          key={`${singlePlayerSettings.displayMode}-${singlePlayerSettings.targetLanguage}-${singlePlayerCards.length}`}
          initialCards={singlePlayerCards}
          initialSettings={singlePlayerSettings}
          uiLanguage={settings.language}
          onFinish={handleSinglePlayerFinish}
          onExit={() => setCurrentScreen('INTRO')}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        />
      )}

      {/* 11. SINGLE-PLAYER REPORT & ANALYTICS */}
      {currentScreen === 'SINGLE_REPORT' && singlePlayerReport && (
        <SinglePlayerReportScreen
          report={singlePlayerReport}
          uiLanguage={settings.language}
          onPlayAgain={() => handleStartSinglePlayer(singlePlayerSettings)}
          onPracticeWeakCards={handlePracticeWeakCards}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onExit={() => setCurrentScreen('INTRO')}
        />
      )}

      {/* 12. TWO-PLAYER HEAD-TO-HEAD SHARED SCREEN DUEL */}
      {currentScreen === 'DUEL_GAME' && duelSettings && (
        <DuelScreen
          settings={duelSettings}
          cards={duelCards}
          uiLanguage={settings.language}
          onExit={() => setCurrentScreen('INTRO')}
          isRTL={isRtlLang(settings.language)}
        />
      )}

      {/* MODALS */}
      <SinglePlayerSetupModal
        isOpen={isSingleSetupOpen}
        language={settings.language}
        initialSettings={singlePlayerSettings}
        onClose={() => setIsSingleSetupOpen(false)}
        onStart={handleStartSinglePlayer}
      />

      <DuelSetupModal
        isOpen={isDuelSetupOpen}
        onClose={() => setIsDuelSetupOpen(false)}
        onStartDuel={handleStartDuel}
        currentLanguage={settings.targetLanguages?.[0] || 'nl'}
        uiLanguage={settings.language}
        isRTL={isRtlLang(settings.language)}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        language={settings.language}
        onClose={() => setIsLeaderboardOpen(false)}
      />

    </main>
  );
};

export default App;
