import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameSettings, GameStatus, GameHistoryEntry, Team, Player, TeamColor, LanguageCard, PlayedCardRecord } from './types';
import { buildSessionCardPool } from './cardsData';
import IntroScreen from './screens/IntroScreen';
import LanguageSelectScreen from './screens/LanguageSelectScreen';
import SetupScreen from './screens/SetupScreen';
import CategoryScreen from './screens/CategoryScreen';
import PlayerNameScreen from './screens/PlayerNameScreen';
import SeatingConfirmScreen from './screens/SeatingConfirmScreen';
import GameplayScreen from './screens/GameplayScreen';
import HistoryScreen from './screens/HistoryScreen';
import HelpScreen from './screens/HelpScreen';
import OfflineIndicator from './components/OfflineIndicator';
import { sound } from './soundManager';
import { auth, saveMatchToCloud, syncSettingsToCloud } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

const DEFAULT_SETTINGS: GameSettings = {
  playerCount: 4,
  roundsCount: 3,
  roundDuration: 90,
  difficulty: 'easy',
  cefrLevel: 'all',
  nativeLanguage: 'fa',
  targetLanguages: ['nl', 'en'],
  selectedCategories: [
    "CAT_EVERYDAY",
    "CAT_RESTAURANT",
    "CAT_FOOD",
    "CAT_TRAVEL",
    "CAT_SHOPPING",
    "CAT_WORK",
    "CAT_SMALLTALK"
  ],
  playerNames: Array(8).fill(''),
  language: 'fa',
  passPhoneScreenEnabled: false,
  soundEnabled: true,
  powerCardsEnabled: true
};

type ScreenType = 'INTRO' | 'LANGUAGE_SELECT' | 'CATEGORIES' | 'SETUP' | 'PLAYERS' | 'SEATING_CONFIRM' | 'GAME' | 'HISTORY' | 'HELP';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('INTRO');
  const [prevScreen, setPrevScreen] = useState<ScreenType>('INTRO');
  const [activeHelpSection, setActiveHelpSection] = useState<string>('intro');
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);

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
        setSettings(prev => ({ 
          ...prev, 
          ...parsed,
          targetLanguages: Array.isArray(parsed?.targetLanguages) && parsed.targetLanguages.length > 0 
            ? parsed.targetLanguages 
            : (prev.targetLanguages || ['nl', 'en']),
          selectedCategories: Array.isArray(parsed?.selectedCategories) && parsed.selectedCategories.length > 0 
            ? parsed.selectedCategories 
            : (prev.selectedCategories || ["CAT_EVERYDAY", "CAT_RESTAURANT", "CAT_FOOD", "CAT_TRAVEL", "CAT_SHOPPING", "CAT_WORK", "CAT_SMALLTALK"]),
          playerNames: Array.isArray(parsed?.playerNames) 
            ? parsed.playerNames 
            : Array(8).fill('')
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        syncSettingsToCloud(user.uid, settings).catch(console.error);
      }
    });
    return () => unsubscribe();
  }, [settings]);

  useEffect(() => {
    const isSoundOn = settings.soundEnabled ?? true;
    sound.setSoundEnabled(isSoundOn);
    if (isSoundOn && currentScreen !== 'GAME') {
      sound.startMenuBGM();
    } else if (currentScreen === 'GAME') {
      sound.stopMenuBGM();
    }
  }, [settings.soundEnabled, currentScreen]);

  const saveSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    localStorage.setItem('dor_settings', JSON.stringify(newSettings));
    if (auth.currentUser) {
      syncSettingsToCloud(auth.currentUser.uid, newSettings).catch(console.error);
    }
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
    const totalGameTime = settings.roundsCount * settings.roundDuration * 1000;
    const timePerTeam = totalGameTime / teamCount;

    // Team 1: (P1, P_opposite), Team 2: (P2, P_opposite), etc.
    const initialTeams: Team[] = Array.from({ length: teamCount }).map((_, i) => ({
      id: i,
      color: teamColors[i],
      timeRemaining: timePerTeam,
      isEliminated: false,
      playerIds: [i, i + teamCount],
      score: 0,
      comboStreak: 0
    }));

    const initialPlayers: Player[] = Array.from({ length: settings.playerCount }).map((_, i) => {
      const teamId = i % teamCount;
      const defaultName = settings.language === 'fa' ? `بازیکن ${i + 1}` : `Player ${i + 1}`;
      return {
        id: i,
        name: settings.playerNames[i]?.trim() || defaultName,
        teamId: teamId,
        teamColor: teamColors[teamId]
      };
    });

    // Build the Multi-Language balanced card pool from user selections
    const pool = buildSessionCardPool(
      settings.targetLanguages || ['nl', 'en'],
      settings.selectedCategories,
      settings.cefrLevel || 'all',
      settings.nativeLanguage || settings.language || 'fa'
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

  // Millisecond Timer loop for ACTIVE_TURN
  useEffect(() => {
    if (gameStatus === GameStatus.ActiveTurn) {
      timerRef.current = window.setInterval(() => {
        setRoundTimer(prev => {
          if (prev <= 10) {
            setGameStatus(GameStatus.RoundEnded);
            return 0;
          }
          return prev - 10;
        });

        const activePlayer = players[activePlayerIndex];
        if (activePlayer) {
          setTeams(prev => prev.map(t => {
            if (t.id === activePlayer.teamId && !t.isEliminated) {
              const newTime = t.timeRemaining - 10;
              return { ...t, timeRemaining: Math.max(0, newTime) };
            }
            return t;
          }));
        }

        setSwapCooldown(prev => Math.max(0, prev - 10));
      }, 10);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStatus, activePlayerIndex, players]);

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

  return (
    <main className="w-full h-full max-w-md mx-auto flex flex-col justify-between overflow-hidden shadow-2xl relative bg-[#170B2C]">
      
      {/* Offline PWA Connectivity Indicator */}
      <OfflineIndicator language={settings.language} />

      {/* 1. INTRO SCREEN */}
      {currentScreen === 'INTRO' && (
        <IntroScreen
          language={settings.language}
          onLanguageChange={(l) => saveSettings({ ...settings, language: l, nativeLanguage: l })}
          onNext={() => setCurrentScreen('LANGUAGE_SELECT')}
          onOpenHistory={() => setCurrentScreen('HISTORY')}
          onOpenHelp={() => openHelp('intro')}
        />
      )}

      {/* 2. LANGUAGE SELECT SCREEN (STEP 1: Multi-target languages & CEFR) */}
      {currentScreen === 'LANGUAGE_SELECT' && (
        <LanguageSelectScreen
          settings={settings}
          onSave={saveSettings}
          onNext={() => setCurrentScreen('CATEGORIES')}
          onBack={() => setCurrentScreen('INTRO')}
          onOpenHelp={() => openHelp('languageSelect')}
        />
      )}

      {/* 3. CATEGORY SELECT SCREEN (STEP 2: Topics & Situations) */}
      {currentScreen === 'CATEGORIES' && (
        <CategoryScreen
          settings={settings}
          onSave={saveSettings}
          onNext={() => setCurrentScreen('SETUP')}
          onBack={() => setCurrentScreen('LANGUAGE_SELECT')}
          onOpenHelp={() => openHelp('categories')}
        />
      )}

      {/* 4. SETUP SCREEN (STEP 3: Players count, Duration, Power cards) */}
      {currentScreen === 'SETUP' && (
        <SetupScreen
          settings={settings}
          onSave={saveSettings}
          onNext={() => setCurrentScreen('PLAYERS')}
          onBack={() => setCurrentScreen('CATEGORIES')}
          onOpenHelp={() => openHelp('rules')}
        />
      )}

      {/* 5. PLAYER NAMES SCREEN (STEP 4) */}
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
          onBack={() => setCurrentScreen('PLAYERS')}
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

    </main>
  );
};

export default App;
