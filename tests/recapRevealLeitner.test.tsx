import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EndGameScreen from '../screens/EndGameScreen';
import GameplayScreen from '../screens/GameplayScreen';
import { LeitnerScreen } from '../screens/LeitnerScreen';
import { 
  TeamColor, 
  LanguageCard, 
  PlayedCardRecord, 
  GameStatus, 
  GameSettings 
} from '../types';
import { sound } from '../soundManager';
import { 
  getLeitnerState, 
  enrollMissedCardsInLeitner, 
  recordLeitnerCardReview,
  LEITNER_INTERVALS, 
  MAX_LEITNER_CARDS 
} from '../leitnerBoxService';
import { saveWeakCards, getSavedWeakCards, migrateGuestWeakCardsToCloud } from '../contentEngine';
import { auth, db } from '../firebase';
import { setDoc, getDocs } from 'firebase/firestore';

vi.mock('../firebase', () => ({
  auth: { currentUser: null },
  db: {},
  saveMatchToCloud: vi.fn(),
  syncSettingsToCloud: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, ...parts) => ({ path: parts.join('/') })),
  setDoc: vi.fn().mockResolvedValue(undefined),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  collection: vi.fn((_db, ...parts) => ({ path: parts.join('/') })),
  getDocs: vi.fn().mockResolvedValue({ empty: true, forEach: vi.fn() }),
  addDoc: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn()
}));

const dummySettings: GameSettings = {
  playerCount: 4,
  roundsCount: 2,
  roundDuration: 60,
  selectedCategories: ['Food'],
  playerNames: ['P1', 'P2', 'P3', 'P4'],
  language: 'en-US',
  targetLanguages: ['en-US'],
  cardRevealEnabled: true
};

const dummyTeams = [
  { id: 1, color: TeamColor.Blue, timeRemaining: 45, isEliminated: false, playerIds: [1] },
  { id: 2, color: TeamColor.Red, timeRemaining: 30, isEliminated: false, playerIds: [2] }
];
const dummyPlayers = [
  { id: 1, name: 'Sara', teamId: 1, teamColor: TeamColor.Blue },
  { id: 2, name: 'Reza', teamId: 2, teamColor: TeamColor.Red }
];

describe('1. End-screen Recap Tests', () => {
  const sampleCards: PlayedCardRecord[] = [
    {
      card: {
        id: 'card_en_1',
        targetText: 'Apple',
        targetLanguage: 'en-US',
        translation: 'سیب',
        topic: 'Food',
        cefrLevel: 'A1',
        contentType: 'Vocabulary',
        learningMode: 'Translate',
        difficulty: 'easy',
        points: 1,
        prompt: 'I eat an apple every morning.'
      },
      guessedCorrectly: true,
      answeringPlayerName: 'Sara',
      answeringTeamColor: TeamColor.Blue,
      timeSpentSeconds: 4,
      wasSpeedBonus: true,
      pointsEarned: 2,
      usedHint: false
    },
    {
      card: {
        id: 'card_nl_2',
        targetText: 'Fiets',
        targetLanguage: 'nl',
        translation: 'دوچرخه',
        topic: 'Transport',
        cefrLevel: 'A1',
        contentType: 'Vocabulary',
        learningMode: 'Translate',
        difficulty: 'easy',
        points: 1,
        prompt: 'Ik heb een nieuwe fiets.'
      },
      guessedCorrectly: false,
      answeringPlayerName: 'Reza',
      answeringTeamColor: TeamColor.Red,
      timeSpentSeconds: 15,
      wasSpeedBonus: false,
      pointsEarned: 0,
      usedHint: false
    }
  ];

  test('all played cards tagged by team and missed ones highlighted', () => {
    vi.spyOn(sound, 'hasVoice').mockReturnValue(true);
    render(
      <EndGameScreen
        winners={[dummyTeams[0]]}
        players={dummyPlayers}
        playedCards={sampleCards}
        onRestart={() => {}}
        language="en-US"
      />
    );

    // Switch to cards tab
    const reviewTab = screen.getByRole('button', { name: /Review/i });
    fireEvent.click(reviewTab);

    // Tagged by team
    expect(screen.getAllByText(/Blue/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Red/i).length).toBeGreaterThan(0);

    // Missed card highlighted with Missed badge
    expect(screen.getAllByText(/Missed/i).length).toBeGreaterThan(0);
  });

  test('1-tap TTS replay shows when voice exists, hidden when no voice', () => {
    // If voice exists for English but not for Dutch
    vi.spyOn(sound, 'hasVoice').mockImplementation((lang) => lang === 'en-US');
    const speakSpy = vi.spyOn(sound, 'speak').mockImplementation(() => {});

    render(
      <EndGameScreen
        winners={[dummyTeams[0]]}
        players={dummyPlayers}
        playedCards={sampleCards}
        onRestart={() => {}}
        language="en-US"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Review/i }));

    const audioButtons = screen.getAllByTitle(/audio/i);
    expect(audioButtons.length).toBe(1); // Only for English, Dutch has no voice

    fireEvent.click(audioButtons[0]);
    expect(speakSpy).toHaveBeenCalledWith('Apple', 'en-US', expect.anything());
  });
});

describe('2. Card Reveal on Correct / Skip Tests', () => {

  test('card reveal overlay displays targetText, translation, and example sentence for Vocabulary', () => {
    const vocabCard: LanguageCard = {
      id: 'v1',
      targetText: 'Water',
      targetLanguage: 'en-US',
      translation: 'آب',
      topic: 'Food',
      cefrLevel: 'A1',
      contentType: 'Vocabulary',
      learningMode: 'Translate',
      difficulty: 'easy',
      points: 1,
      prompt: 'Please drink more water.'
    };

    let currentStatus = GameStatus.ActiveTurn;
    const setGameStatus = vi.fn((s) => { currentStatus = s; });

    render(
      <GameplayScreen
        settings={dummySettings}
        onUpdateSettings={() => {}}
        gameStatus={GameStatus.ActiveTurn}
        setGameStatus={setGameStatus}
        teams={dummyTeams}
        setTeams={() => {}}
        players={dummyPlayers}
        currentRound={1}
        setCurrentRound={() => {}}
        activePlayerIndex={0}
        setActivePlayerIndex={() => {}}
        roundTimer={40000}
        setRoundTimer={() => {}}
        currentCard={vocabCard}
        swapCooldown={0}
        onGetNextWord={() => {}}
        onResume={() => {}}
        isPoolExhausted={false}
        onFinish={() => {}}
        onExit={() => {}}
      />
    );

    // Click Correct button
    const correctBtn = screen.getByRole('button', { name: /^correct!$/i });
    fireEvent.click(correctBtn);

    // Pauses game / timer
    expect(setGameStatus).toHaveBeenCalledWith(GameStatus.Paused);

    // Displays targetText and translation in reveal overlay
    expect(screen.getAllByText('Water').length).toBeGreaterThan(0);
    expect(screen.getAllByText('آب').length).toBeGreaterThan(0);

    // Displays example sentence for Vocabulary
    expect(screen.getAllByText('Please drink more water.').length).toBeGreaterThan(0);

    // Dismiss on tap
    const continueBtn = screen.getByText(/Continue/i);
    fireEvent.click(continueBtn);
  });

  test('card reveal omits example sentence for non-Vocabulary cards', () => {
    const idiomCard: LanguageCard = {
      id: 'i1',
      targetText: 'Break a leg',
      targetLanguage: 'en-US',
      translation: 'موفق باشی',
      topic: 'Idioms',
      cefrLevel: 'B1',
      contentType: 'Phrase',
      learningMode: 'Translate',
      difficulty: 'medium',
      points: 2,
      prompt: 'Good luck before a show'
    };

    const setGameStatus = vi.fn();

    render(
      <GameplayScreen
        settings={dummySettings}
        onUpdateSettings={() => {}}
        gameStatus={GameStatus.ActiveTurn}
        setGameStatus={setGameStatus}
        teams={dummyTeams}
        setTeams={() => {}}
        players={dummyPlayers}
        currentRound={1}
        setCurrentRound={() => {}}
        activePlayerIndex={0}
        setActivePlayerIndex={() => {}}
        roundTimer={40000}
        setRoundTimer={() => {}}
        currentCard={idiomCard}
        swapCooldown={0}
        onGetNextWord={() => {}}
        onResume={() => {}}
        isPoolExhausted={false}
        onFinish={() => {}}
        onExit={() => {}}
      />
    );

    const skipBtn = screen.getByRole('button', { name: /skip/i });
    fireEvent.click(skipBtn);

    expect(screen.getAllByText('Break a leg').length).toBeGreaterThan(0);
    expect(screen.getAllByText('موفق باشی').length).toBeGreaterThan(0);
    // Non-vocabulary cards do NOT render the example sentence block
    expect(screen.queryByText('Example Sentence:')).toBeNull();
  });
});

describe('3. Missed-cards Review & Leitner Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('guests save missed cards to localStorage', async () => {
    // auth.currentUser is null (guest)
    (auth as any).currentUser = null;

    const missedCard: LanguageCard = {
      id: 'mc_1',
      targetText: 'House',
      targetLanguage: 'en-US',
      translation: 'خانه',
      topic: 'Everyday',
      cefrLevel: 'A1',
      contentType: 'Vocabulary',
      learningMode: 'Translate',
      difficulty: 'easy',
      points: 1,
      prompt: 'My house is near the park.'
    };

    await saveWeakCards([missedCard]);

    const stored = getSavedWeakCards();
    expect(stored.length).toBe(1);
    expect(stored[0].cardId).toBe('mc_1');
    expect(stored[0].card.targetText).toBe('House');
    expect(setDoc).not.toHaveBeenCalled();
  });

  test('signed-in users sync missed cards to users/{uid}/weak_cards', async () => {
    (auth as any).currentUser = { uid: 'user_456' };

    const missedCard: LanguageCard = {
      id: 'mc_2',
      targetText: 'Bread',
      targetLanguage: 'en-US',
      translation: 'نان',
      topic: 'Food',
      cefrLevel: 'A1',
      contentType: 'Vocabulary',
      learningMode: 'Translate',
      difficulty: 'easy',
      points: 1,
      prompt: 'Fresh bread smells amazing.'
    };

    await saveWeakCards([missedCard]);

    expect(setDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'users/user_456/weak_cards/mc_2' }),
      expect.objectContaining({
        cardId: 'mc_2',
        targetText: 'Bread',
        translation: 'نان'
      }),
      { merge: true }
    );
  });

  test('Leitner state has 3 boxes [1, 3, 7 days] and caps at 100 cards', () => {
    expect(LEITNER_INTERVALS).toEqual([1, 3, 7]);
    expect(MAX_LEITNER_CARDS).toBe(100);

    const cards: LanguageCard[] = Array.from({ length: 110 }, (_, i) => ({
      id: `c_${i}`,
      targetText: `Word ${i}`,
      targetLanguage: 'en-US',
      translation: `Trans ${i}`,
      topic: 'General',
      cefrLevel: 'A1',
      contentType: 'Vocabulary',
      learningMode: 'Translate',
      difficulty: 'easy',
      points: 1,
      prompt: `Prompt ${i}`
    }));

    enrollMissedCardsInLeitner(cards);

    const state = getLeitnerState();
    expect(state.cards.length).toBeLessThanOrEqual(100);

    // Promotion advances boxIndex up to box 3 (index 2)
    const reviewResult = recordLeitnerCardReview(state.cards[0].id, true);
    expect(reviewResult.promotedToBox).toBe(2);
  });

  test('cloud migration enforces cap 100 on cloud TOTAL and clears localStorage', async () => {
    // Mock that cloud already has 98 cards
    const existingCloudDocs: any[] = [];
    for (let i = 0; i < 98; i++) {
      existingCloudDocs.push({ id: `cloud_${i}`, data: () => ({ cardId: `cloud_${i}` }) });
    }
    (getDocs as any).mockResolvedValueOnce({
      size: 98,
      empty: false,
      forEach: (fn: any) => existingCloudDocs.forEach(fn)
    });

    // LocalStorage has 5 cards
    const localWeak = [
      { cardId: 'c1', card: { id: 'c1', targetText: 'W1', targetLanguage: 'en-US', translation: 'T1', topic: 'General', cefrLevel: 'A1', contentType: 'Vocabulary', learningMode: 'Translate', difficulty: 'easy', points: 1, prompt: '' }, mistakeCount: 1, lastPracticed: '' },
      { cardId: 'c2', card: { id: 'c2', targetText: 'W2', targetLanguage: 'en-US', translation: 'T2', topic: 'General', cefrLevel: 'A1', contentType: 'Vocabulary', learningMode: 'Translate', difficulty: 'easy', points: 1, prompt: '' }, mistakeCount: 1, lastPracticed: '' },
      { cardId: 'c3', card: { id: 'c3', targetText: 'W3', targetLanguage: 'en-US', translation: 'T3', topic: 'General', cefrLevel: 'A1', contentType: 'Vocabulary', learningMode: 'Translate', difficulty: 'easy', points: 1, prompt: '' }, mistakeCount: 1, lastPracticed: '' },
      { cardId: 'c4', card: { id: 'c4', targetText: 'W4', targetLanguage: 'en-US', translation: 'T4', topic: 'General', cefrLevel: 'A1', contentType: 'Vocabulary', learningMode: 'Translate', difficulty: 'easy', points: 1, prompt: '' }, mistakeCount: 1, lastPracticed: '' },
      { cardId: 'c5', card: { id: 'c5', targetText: 'W5', targetLanguage: 'en-US', translation: 'T5', topic: 'General', cefrLevel: 'A1', contentType: 'Vocabulary', learningMode: 'Translate', difficulty: 'easy', points: 1, prompt: '' }, mistakeCount: 1, lastPracticed: '' },
    ];
    localStorage.setItem('dor_weak_cards', JSON.stringify(localWeak));

    await migrateGuestWeakCardsToCloud('user_123');

    // Only 2 slots were available (100 - 98 = 2), so setDoc called only 2 times
    expect(setDoc).toHaveBeenCalledTimes(2);

    // localStorage dor_weak_cards was cleared
    expect(localStorage.getItem('dor_weak_cards')).toBeNull();
  });

  test('skipped cards do NOT re-queue into game queue and are sent only to playedCards review', () => {
    const onRequeueCard = vi.fn();
    const setPlayedCards = vi.fn();
    const cardToSkip: LanguageCard = {
      id: 's1',
      targetText: 'SkipMe',
      targetLanguage: 'en-US',
      translation: 'SkipMeFa',
      topic: 'General',
      cefrLevel: 'A1',
      contentType: 'Vocabulary',
      learningMode: 'Translate',
      difficulty: 'easy',
      points: 1,
      prompt: ''
    };

    render(
      <GameplayScreen
        settings={dummySettings}
        onUpdateSettings={() => {}}
        gameStatus={GameStatus.ActiveTurn}
        setGameStatus={() => {}}
        teams={dummyTeams}
        setTeams={() => {}}
        players={dummyPlayers}
        currentRound={1}
        setCurrentRound={() => {}}
        activePlayerIndex={0}
        setActivePlayerIndex={() => {}}
        roundTimer={40000}
        setRoundTimer={() => {}}
        currentCard={cardToSkip}
        swapCooldown={0}
        onGetNextWord={() => {}}
        onResume={() => {}}
        isPoolExhausted={false}
        onFinish={() => {}}
        onExit={() => {}}
        onRequeueCard={onRequeueCard}
        setPlayedCards={setPlayedCards}
      />
    );

    const skipBtn = screen.getByRole('button', { name: /skip/i });
    fireEvent.click(skipBtn);

    // Verify onRequeueCard was NOT called
    expect(onRequeueCard).not.toHaveBeenCalled();

    // Verify setPlayedCards was called to record missed card
    expect(setPlayedCards).toHaveBeenCalledWith(expect.any(Function));
  });
});
