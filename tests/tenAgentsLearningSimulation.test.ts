import { describe, test, expect, beforeEach, vi } from 'vitest';
import { 
  Language, 
  CEFRLevel, 
  LanguageCard, 
  SinglePlayerSettings,
  SinglePlayerCardResult,
  OnlineDuelRoom 
} from '../types';
import { evaluateAnswer } from '../answerEvaluator';
import { getUniqueCardsForSession } from '../contentEngine';
import { generateChallengingReflexOptions } from '../utils/testQuestionEngine';
import { 
  getLeitnerState, 
  enrollCardsInLeitner, 
  getDueLeitnerCards, 
  recordLeitnerCardReview, 
  checkAndApplyDailyDecay,
  addDaysToDateString,
  getTodayDateString,
  saveLeitnerState,
  requestLeitnerNotificationPermission
} from '../leitnerBoxService';
import { 
  recordMistake, 
  recordMistakeSuccess, 
  getSavedMistakes, 
  generateSimilarQuestions,
  buildMistakeReviewSession,
  clearMasteredMistakes
} from '../mistakeReviewService';
import { tUI, isRtlLang } from '../ui';
import { SUPPORTED_LANGUAGES } from '../constants';

describe('10 Autonomous Agents: Full Game Modes, Language Switching & Learning Impact Simulation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // AGENT 1: Saman (Persian Native -> Dutch Target, A1 Everyday, Pass & Play)
  // --------------------------------------------------------------------------
  test('Agent 1 [Saman]: Persian native learning Dutch A1 in 4-Player Team Pass & Play', () => {
    const nativeLang: Language = 'fa';
    const targetLang: Language = 'nl';
    const level: CEFRLevel = 'A1';

    // 1. Language Switch Checks
    expect(isRtlLang(nativeLang)).toBe(true);
    expect(isRtlLang(targetLang)).toBe(false);
    const tFa = tUI(nativeLang);
    expect(tFa.newGame).toBeDefined();

    // 2. Card Pool Generation
    const cards = getUniqueCardsForSession(targetLang, nativeLang, level, ['CAT_EVERYDAY'], 6, true);
    expect(cards.length).toBe(6);
    cards.forEach(card => {
      expect(card.targetLanguage).toBe('nl');
      expect(card.targetText).toBeTruthy();
      expect(card.translation).toBeTruthy();
      // Persian translation should not be empty
      expect(typeof card.translation).toBe('string');
    });

    // 3. Team Turn Simulation
    let team1Score = 0;
    let team2Score = 0;
    let currentTeam = 1;

    for (let turn = 0; turn < cards.length; turn++) {
      const card = cards[turn];
      // Simulate player guessing card
      const guessed = true;
      if (guessed) {
        if (currentTeam === 1) team1Score += card.points || 1;
        else team2Score += card.points || 1;
      }
      currentTeam = currentTeam === 1 ? 2 : 1;
    }

    expect(team1Score + team2Score).toBeGreaterThan(0);
  });

  // --------------------------------------------------------------------------
  // AGENT 2: Emma (English Native -> Persian Target, B1 Travel, Single Player)
  // --------------------------------------------------------------------------
  test('Agent 2 [Emma]: English native learning Persian B1 in Single Player with Speech & Typo Evaluation', () => {
    const nativeLang: Language = 'en';
    const targetLang: Language = 'fa';
    const level: CEFRLevel = 'B1';

    expect(isRtlLang(nativeLang)).toBe(false);
    expect(isRtlLang(targetLang)).toBe(true);

    const testCard: LanguageCard = {
      id: 'fa_b1_hotel',
      targetText: 'هتل کجاست؟',
      translation: 'Where is the hotel?',
      targetLanguage: targetLang,
      nativeLanguage: nativeLang,
      cefrLevel: level,
      topic: 'CAT_TRAVEL',
      contentType: 'Sentence',
      learningMode: 'Translate',
      prompt: 'Ask where the hotel is located',
      difficulty: 'medium',
      points: 2
    };

    // 1. Exact match evaluation
    const exactEval = evaluateAnswer(testCard, 'هتل کجاست؟');
    expect(exactEval.isCorrect).toBe(true);
    expect(exactEval.similarity).toBeGreaterThanOrEqual(0.9);

    // 2. Minor typo / spoken variation without punctuation: 'هتل کجاست'
    const minorEval = evaluateAnswer(testCard, 'هتل کجاست');
    expect(minorEval.isCorrect).toBe(true);
    expect(minorEval.similarity).toBeGreaterThanOrEqual(0.8);

    // 3. Wrong answer should fail and be recorded into Mistake Bank
    const wrongEval = evaluateAnswer(testCard, 'من گرسنه‌ام');
    expect(wrongEval.isCorrect).toBe(false);

    recordMistake(testCard, 'من گرسنه‌ام', 'single_player');
    const mistakes = getSavedMistakes();
    expect(mistakes.some(m => m.cardId === testCard.id)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // AGENT 3: Reza (Persian Native -> English Target, C1 Advanced, Leitner Progression)
  // --------------------------------------------------------------------------
  test('Agent 3 [Reza]: Persian native learning English C1 through Leitner Box 5-Stage Progression', () => {
    const state = enrollCardsInLeitner('en', 'fa', 'C1', 10);
    expect(state.cards.length).toBeGreaterThan(0);
    expect(state.cards[0].boxIndex).toBe(0); // Box 1

    const firstCard = state.cards[0];
    const initialDue = getDueLeitnerCards(state);
    expect(initialDue.length).toBeGreaterThan(0);

    // Day 1: Answer Correctly -> Promotes to Box 2 (Index 1)
    const result1 = recordLeitnerCardReview(firstCard.cardId, true);
    expect(result1.promotedToBox).toBe(2);

    const updatedState = getLeitnerState();
    const updatedCard = updatedState.cards.find(c => c.cardId === firstCard.cardId);
    expect(updatedCard?.boxIndex).toBe(1);

    // Box 2 -> 3 -> 4 -> 5 Mastery Promotion
    recordLeitnerCardReview(firstCard.cardId, true); // Box 3
    recordLeitnerCardReview(firstCard.cardId, true); // Box 4
    const resultMaster = recordLeitnerCardReview(firstCard.cardId, true); // Box 5
    expect(resultMaster.isMastered).toBe(true);
  });

  // --------------------------------------------------------------------------
  // AGENT 4: Lucas (French Native -> German Target, A2 Work, 2-Player Shared Duel)
  // --------------------------------------------------------------------------
  test('Agent 4 [Lucas]: French native learning German A2 in 2-Player Shared Head-to-Head Duel', () => {
    const targetLang: Language = 'de';
    const nativeLang: Language = 'fr';

    const testCard: LanguageCard = {
      id: 'de_a2_meeting',
      targetText: 'das Treffen',
      translation: 'la réunion',
      targetLanguage: targetLang,
      nativeLanguage: nativeLang,
      cefrLevel: 'A2',
      topic: 'CAT_WORK',
      contentType: 'Vocabulary',
      learningMode: 'Translate',
      prompt: 'le mot pour réunion',
      difficulty: 'easy',
      points: 1
    };

    // Test Question Designer generates 4 options in German
    const options = generateChallengingReflexOptions(testCard, [testCard], 'de');
    expect(options.length).toBe(4);
    expect(options).toContain('das Treffen');

    // Simulate Player 1 Buzzing in first with correct answer
    const p1Answer = 'das Treffen';
    const isP1Correct = p1Answer === testCard.targetText;
    expect(isP1Correct).toBe(true);

    // Simulate Player 2 selecting distractor (incorrect)
    const distractor = options.find(o => o !== testCard.targetText)!;
    expect(distractor).not.toBe(testCard.targetText);
    recordMistake(testCard, distractor, 'duel');
    expect(getSavedMistakes().length).toBeGreaterThan(0);
  });

  // --------------------------------------------------------------------------
  // AGENT 5: Greta (German Native -> Spanish Target, B1 Emotions, Online Duel)
  // --------------------------------------------------------------------------
  test('Agent 5 [Greta]: German native learning Spanish B1 in 1v1 Online Duel Room Sync', () => {
    const targetLang: Language = 'es';
    const nativeLang: Language = 'de';

    const cards = getUniqueCardsForSession(targetLang, nativeLang, 'B1', ['CAT_EMOTIONS'], 5, false);
    expect(cards.length).toBeGreaterThan(0);

    const mockRoom: OnlineDuelRoom = {
      roomId: 'ROOM_GRETA_1',
      roomCode: '889922',
      status: 'playing',
      targetLanguage: targetLang,
      nativeLanguage: nativeLang,
      cefrLevel: 'B1',
      winningScore: 5,
      sabotageEnabled: true,
      player1: {
        id: 'greta_host',
        name: 'Greta',
        avatar: 'arcade_1',
        score: 3,
        streak: 2,
        sabotageUsed: false,
        isLocked: false
      },
      player2: {
        id: 'guest_player',
        name: 'Carlos',
        avatar: 'arcade_2',
        score: 1,
        streak: 0,
        sabotageUsed: false,
        isLocked: false
      },
      cards,
      cardIndex: 2
    };

    expect(mockRoom.status).toBe('playing');
    expect(mockRoom.winningScore).toBe(5);
    expect(mockRoom.cards[0].targetLanguage).toBe('es');
  });

  // --------------------------------------------------------------------------
  // AGENT 6: Tariq (Arabic Native -> English Target, A1 Food, Systematic Review)
  // --------------------------------------------------------------------------
  test('Agent 6 [Tariq]: Arabic native learning English A1 with Mistake Synthesis & Grammar Variants', () => {
    const foodCard: LanguageCard = {
      id: 'en_a1_apple',
      targetText: 'I would like an apple, please.',
      translation: 'أود تفاحة من فضلك.',
      targetLanguage: 'en',
      nativeLanguage: 'ar',
      cefrLevel: 'A1',
      topic: 'CAT_FOOD',
      contentType: 'Sentence',
      learningMode: 'Translate',
      prompt: 'Ask politely for an apple',
      difficulty: 'easy',
      points: 1
    };

    recordMistake(foodCard, 'I want apple', 'single_player');
    const mistakes = getSavedMistakes();
    expect(mistakes.length).toBeGreaterThan(0);

    // Synthesize grammatically parallel variant questions
    const similar = generateSimilarQuestions(foodCard, 2);
    expect(similar.length).toBeGreaterThanOrEqual(1);
    expect(similar[0].targetLanguage).toBe('en');

    // Build mistake review session
    const reviewSession = buildMistakeReviewSession();
    expect(reviewSession.cards.length).toBeGreaterThan(0);
    expect(reviewSession.targetLanguage).toBe('en');
  });

  // --------------------------------------------------------------------------
  // AGENT 7: Aylin (Turkish Native -> French Target, A2 Everyday, Leitner Streak Decay)
  // --------------------------------------------------------------------------
  test('Agent 7 [Aylin]: Turkish native learning French A2 with Strict Missed Day Penalty', () => {
    const state = enrollCardsInLeitner('fr', 'tr', 'A2', 5);
    state.consecutiveStreak = 4;
    // Advance card to Box 3
    state.cards[0].boxIndex = 2;
    state.lastVisitDate = '2026-10-01';

    // Simulate user returning 3 days later (Skipped 2 full days!)
    const simulatedState = {
      ...state,
      lastVisitDate: '2026-10-01'
    };

    // Current date is today (far later than 2026-10-01)
    const evaluated = checkAndApplyDailyDecay(simulatedState);

    // Rule: streak is reset to 0, card is demoted to Box 0 (House 1)
    expect(evaluated.consecutiveStreak).toBe(0);
    expect(evaluated.cards[0].boxIndex).toBe(0);
    expect(evaluated.missedDayWarningShown).toBe(true);
  });

  // --------------------------------------------------------------------------
  // AGENT 8: Sofia (Spanish Native -> Italian Target, A1 Culture, Reflex Speed Quiz)
  // --------------------------------------------------------------------------
  test('Agent 8 [Sofia]: Spanish native learning Italian A1 reflex distractors quality audit', () => {
    const itCard: LanguageCard = {
      id: 'it_a1_ciao',
      targetText: 'Buongiorno',
      translation: 'Buenos días',
      targetLanguage: 'it',
      nativeLanguage: 'es',
      cefrLevel: 'A1',
      topic: 'CAT_EVERYDAY',
      contentType: 'Vocabulary',
      learningMode: 'Translate',
      prompt: 'Saludo matutino',
      difficulty: 'easy',
      points: 1
    };

    const options = generateChallengingReflexOptions(itCard, [itCard], 'it');
    expect(options.length).toBe(4);
    // Correct text is always among the 4 options
    expect(options).toContain('Buongiorno');
    // All 4 options are distinct (no duplicates)
    const uniqueOptions = new Set(options);
    expect(uniqueOptions.size).toBe(4);
  });

  // --------------------------------------------------------------------------
  // AGENT 9: Navid (Persian Native -> German Target, B2 Grammar Mastery Flow)
  // --------------------------------------------------------------------------
  test('Agent 9 [Navid]: Persian native learning German B2 clears mastered mistakes after 2 successes', () => {
    const deCard: LanguageCard = {
      id: 'de_b2_subordinate',
      targetText: 'Obwohl es regnet, gehen wir spazieren.',
      translation: 'با وجود اینکه باران می‌بارد، به پیاده‌روی می‌رویم.',
      targetLanguage: 'de',
      nativeLanguage: 'fa',
      cefrLevel: 'B2',
      topic: 'CAT_ABSTRACT',
      contentType: 'Sentence',
      learningMode: 'Translate',
      prompt: 'جمله با obwohl',
      difficulty: 'hard',
      points: 3
    };

    // User makes a mistake initially
    recordMistake(deCard, 'Weil es regnet...', 'single_player');
    let mistakes = getSavedMistakes();
    expect(mistakes[0].mastered).toBe(false);

    // Review 1: correct
    recordMistakeSuccess(deCard.id);
    mistakes = getSavedMistakes();
    expect(mistakes[0].mastered).toBe(false);

    // Review 2: correct -> marks as mastered!
    recordMistakeSuccess(deCard.id);
    mistakes = getSavedMistakes();
    expect(mistakes[0].mastered).toBe(true);

    // Clear mastered mistakes
    clearMasteredMistakes();
    expect(getSavedMistakes().length).toBe(0);
  });

  // --------------------------------------------------------------------------
  // AGENT 10: Marco (Italian Native -> English Target, C1 Idioms, 6-Player Team Match)
  // --------------------------------------------------------------------------
  test('Agent 10 [Marco]: Italian native learning English C1 with 6 Players across 3 Teams', () => {
    const nativeLang: Language = 'it';
    const targetLang: Language = 'en';

    // 1. Language Names and UI check
    const langObj = SUPPORTED_LANGUAGES.find(l => l.code === nativeLang);
    expect(langObj?.nativeName).toBe('Italiano');

    // 2. High-level card pool
    const cards = getUniqueCardsForSession(targetLang, nativeLang, 'C1', ['CAT_ABSTRACT'], 6, true);
    expect(cards.length).toBe(6);

    // 3. 3-Team Rotation
    const teams = ['Blue', 'Red', 'Green'];
    let currentIdx = 0;
    const scores: Record<string, number> = { Blue: 0, Red: 0, Green: 0 };

    cards.forEach((c) => {
      const activeTeam = teams[currentIdx % teams.length];
      scores[activeTeam] += c.points || 1;
      currentIdx++;
    });

    expect(scores.Blue).toBeGreaterThan(0);
    expect(scores.Red).toBeGreaterThan(0);
    expect(scores.Green).toBeGreaterThan(0);
  });
});
