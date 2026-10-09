import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DuelSetupModal, DuelSettings } from '../components/DuelSetupModal';
import { DuelScreen } from '../screens/DuelScreen';
import { LanguageCard, Language } from '../types';
import { sound } from '../soundManager';
import {
  getLeitnerState,
  saveLeitnerState,
  enrollCardsInLeitner,
  getDueLeitnerCards,
  recordLeitnerCardReview,
  checkAndApplyDailyDecay,
  addDaysToDateString,
  getTodayDateString,
  calculateDaysDifference
} from '../leitnerBoxService';
import { evaluateAnswer, normalizeText, stripAccents } from '../answerEvaluator';

describe('Diverse Scenarios & Deep Feature Testing', () => {
  beforeEach(() => {
    localStorage.clear();
    sound.setMuted(true);
    vi.clearAllMocks();
  });

  describe('Scenario Group 1: 1v1 Duel Setup & Modal Routing (Local & Online)', () => {
    test('1. DuelSetupModal renders with Local and Online 2-phones tabs', () => {
      const handleStartDuel = vi.fn();
      const handleStartOnlineDuel = vi.fn();
      const handleClose = vi.fn();

      render(
        <DuelSetupModal
          isOpen={true}
          onClose={handleClose}
          onStartDuel={handleStartDuel}
          onStartOnlineDuel={handleStartOnlineDuel}
          currentLanguage="nl"
          uiLanguage="fa"
          isRTL={true}
        />
      );

      // Verify header and titles
      expect(screen.getByText(/دوئل سرعتی دونفره ⚔️/i)).toBeInTheDocument();
      expect(screen.getByText(/مسابقه سرعتی دونفره/i)).toBeInTheDocument();

      // Verify 1v1 Online Matchmaking banner
      expect(screen.getByText(/مچ‌یابی آنلاین دونفره/i)).toBeInTheDocument();
      const onlineMatchBtn = screen.getByRole('button', { name: /مچ آنلاین ⚡/i });
      expect(onlineMatchBtn).toBeInTheDocument();

      // Click Online Match banner button
      fireEvent.click(onlineMatchBtn);
      expect(handleClose).toHaveBeenCalled();
      expect(handleStartOnlineDuel).toHaveBeenCalledWith('__matchmake__');
    });

    test('2. DuelSetupModal toggles to 2-Phones Online mode and allows room hosting and joining', () => {
      const handleStartDuel = vi.fn();
      const handleStartOnlineDuel = vi.fn();
      const handleClose = vi.fn();

      render(
        <DuelSetupModal
          isOpen={true}
          onClose={handleClose}
          onStartDuel={handleStartDuel}
          onStartOnlineDuel={handleStartOnlineDuel}
          currentLanguage="de"
          uiLanguage="fa"
          isRTL={true}
        />
      );

      // Click Online 2-Phones toggle
      const twoPhonesTab = screen.getByRole('button', { name: /🌐 آنلاین \(۲ گوشی\)/i });
      fireEvent.click(twoPhonesTab);

      // Verify Online Duel panel appears
      expect(screen.getByText(/مسابقه زنده دونفره روی دو گوشی جداگانه/i)).toBeInTheDocument();
      expect(screen.getByText(/👑 ایجاد اتاق دوئل آنلاین \(میزبان\)/i)).toBeInTheDocument();

      // Test host room button
      const hostRoomBtn = screen.getByRole('button', { name: /👑 ایجاد اتاق دوئل آنلاین \(میزبان\)/i });
      fireEvent.click(hostRoomBtn);
      expect(handleStartOnlineDuel).toHaveBeenCalled();

      // Test joining with custom room code
      const roomInput = screen.getByPlaceholderText(/کد اتاق حریف/i);
      fireEvent.change(roomInput, { target: { value: 'DL89' } });
      const joinBtn = screen.getByRole('button', { name: 'ورود' });
      fireEvent.click(joinBtn);
      expect(handleStartOnlineDuel).toHaveBeenCalledWith('DL89');
    });

    test('3. DuelSetupModal starts local shared-screen duel with custom settings', () => {
      const handleStartDuel = vi.fn();

      render(
        <DuelSetupModal
          isOpen={true}
          onClose={vi.fn()}
          onStartDuel={handleStartDuel}
          currentLanguage="es"
          uiLanguage="fa"
          isRTL={true}
        />
      );

      // Click start duel button
      const startDuelBtn = screen.getByRole('button', { name: /شروع مسابقه دوئل/i });
      fireEvent.click(startDuelBtn);

      expect(handleStartDuel).toHaveBeenCalledTimes(1);
      const settingsPassed = handleStartDuel.mock.calls[0][0] as DuelSettings;
      expect(settingsPassed.targetLanguage).toBe('es');
      expect(settingsPassed.winningScore).toBeGreaterThanOrEqual(3);
      expect(settingsPassed.faceToFaceRotation).toBe(true);
    });
  });

  describe('Scenario Group 2: Head-to-Head DuelScreen Gameplay & Mechanics', () => {
    const mockCards: LanguageCard[] = [
      { id: 'd1', targetText: 'fiets', translation: 'دوچرخه', targetLanguage: 'nl', nativeLanguage: 'fa', cefrLevel: 'A1', topic: 'CAT_TRAVEL', contentType: 'Vocabulary', learningMode: 'Translate', prompt: 'Prompt', difficulty: 'easy', points: 10 },
      { id: 'd2', targetText: 'huis', translation: 'خانه', targetLanguage: 'nl', nativeLanguage: 'fa', cefrLevel: 'A1', topic: 'CAT_EVERYDAY', contentType: 'Vocabulary', learningMode: 'Translate', prompt: 'Prompt', difficulty: 'easy', points: 10 },
      { id: 'd3', targetText: 'appel', translation: 'سیب', targetLanguage: 'nl', nativeLanguage: 'fa', cefrLevel: 'A1', topic: 'CAT_FOOD', contentType: 'Vocabulary', learningMode: 'Translate', prompt: 'Prompt', difficulty: 'easy', points: 10 },
    ];

    const duelSettings: DuelSettings = {
      player1Name: 'آرش (آبی)',
      player1Avatar: '🕹️',
      player2Name: 'سارا (قرمز)',
      player2Avatar: '👾',
      targetLanguage: 'nl',
      nativeLanguage: 'fa',
      cefrLevel: 'A1',
      winningScore: 2,
      faceToFaceRotation: true,
      sabotageEnabled: true
    };

    test('4. DuelScreen renders both player zones, prompt and reflex buttons', () => {
      const handleExit = vi.fn();
      render(
        <DuelScreen
          settings={duelSettings}
          cards={mockCards}
          uiLanguage="fa"
          onExit={handleExit}
          isRTL={true}
        />
      );

      // Verify player names
      expect(screen.getByText('آرش (آبی)')).toBeInTheDocument();
      expect(screen.getByText('سارا (قرمز)')).toBeInTheDocument();

      // Verify the prompt is shown (translation of current card: دوچرخه)
      expect(screen.getAllByText('دوچرخه').length).toBeGreaterThan(0);

      // Both players should have the correct answer 'fiets' in their choice buttons
      const fietsButtons = screen.getAllByRole('button', { name: 'fiets' });
      expect(fietsButtons.length).toBe(2);
    });

    test('5. Player 1 answering correctly scores point and reaches victory', () => {
      const handleExit = vi.fn();
      render(
        <DuelScreen
          settings={{ ...duelSettings, winningScore: 1 }}
          cards={mockCards}
          uiLanguage="fa"
          onExit={handleExit}
          isRTL={true}
        />
      );

      // P1 clicks correct answer 'fiets' (first of the two buttons)
      const fietsButtons = screen.getAllByRole('button', { name: 'fiets' });
      fireEvent.click(fietsButtons[0]);

      // Victory dialog should appear because winningScore is 1
      expect(screen.getByText(/پیروزی در دوئل سرعتی!/i)).toBeInTheDocument();
      expect(screen.getAllByText('آرش (آبی)').length).toBeGreaterThan(0);
    });
  });

  describe('Scenario Group 3: Leitner Box 5-Stage Spaced Repetition Engine', () => {
    test('6. Enrolling cards populates Box 0 (First stage) with today as due date', () => {
      const state = enrollCardsInLeitner('nl', 'fa', 'A1', 10);
      expect(state.cards.length).toBe(10);
      expect(state.cards.every(c => c.boxIndex === 0)).toBe(true);

      const dueCards = getDueLeitnerCards(state);
      expect(dueCards.length).toBe(10);
      expect(dueCards[0].entertainingQuestion).toBeDefined();
    });

    test('7. Correct recall promotes card from Box 0 -> Box 1 -> Box 2 with multiplied intervals', () => {
      enrollCardsInLeitner('nl', 'fa', 'A1', 5);
      const stateBefore = getLeitnerState();
      const cardToTest = stateBefore.cards[0];

      // Review 1: Correct -> moves to boxIndex 1
      const res1 = recordLeitnerCardReview(cardToTest.id, true);
      expect(res1.promotedToBox).toBe(2); // 1-indexed box number (Box 2)
      let stateAfter = getLeitnerState();
      let updatedCard = stateAfter.cards.find(c => c.id === cardToTest.id);
      expect(updatedCard?.boxIndex).toBe(1);
      expect(updatedCard?.reviewHistory.length).toBe(1);

      // Review 2: Correct -> moves to boxIndex 2
      const res2 = recordLeitnerCardReview(cardToTest.id, true);
      expect(res2.promotedToBox).toBe(3); // (Box 3)
      stateAfter = getLeitnerState();
      updatedCard = stateAfter.cards.find(c => c.id === cardToTest.id);
      expect(updatedCard?.boxIndex).toBe(2);
    });

    test('8. Incorrect recall demotes card from higher box back to Box 0', () => {
      enrollCardsInLeitner('nl', 'fa', 'A1', 5);
      const state = getLeitnerState();
      const card = state.cards[0];

      // Move to Box 3
      recordLeitnerCardReview(card.id, true);
      recordLeitnerCardReview(card.id, true);
      recordLeitnerCardReview(card.id, true);
      let currentState = getLeitnerState();
      expect(currentState.cards.find(c => c.id === card.id)?.boxIndex).toBe(3);

      // Mistake made: demote back to Box 0
      const resMistake = recordLeitnerCardReview(card.id, false);
      expect(resMistake.promotedToBox).toBe(1); // Back in House 1
      currentState = getLeitnerState();
      expect(currentState.cards.find(c => c.id === card.id)?.boxIndex).toBe(0);
    });

    test('9. Missing consecutive days applies strict reset penalty for unmastered cards', () => {
      const state = enrollCardsInLeitner('nl', 'fa', 'A1', 5);
      // Simulate last visit was 3 days ago
      const threeDaysAgo = addDaysToDateString(getTodayDateString(), -3);
      state.lastVisitDate = threeDaysAgo;
      state.consecutiveStreak = 5;
      // Set card to Box 2
      state.cards[0].boxIndex = 2;

      // Apply decay
      const decayedState = checkAndApplyDailyDecay(state);
      expect(decayedState.consecutiveStreak).toBe(0);
      expect(decayedState.missedDayWarningShown).toBe(true);
      expect(decayedState.cards[0].boxIndex).toBe(0);
    });
  });

  describe('Scenario Group 4: Answer Evaluator Diverse Orthographic & Language Tolerances', () => {
    test('10. Persian & Arabic orthography normalization (ی/ي, ک/ك, zero-width space)', () => {
      // Arabic yeh and kaf should normalize to Persian
      const arabicForm = 'كتاب يار';
      const persianForm = 'کتاب یار';
      expect(normalizeText(arabicForm)).toBe(normalizeText(persianForm));

      // Zero-width non-joiner (نیم‌فاصله) handled cleanly
      const withZwnj = 'می\u200cروم';
      const withoutZwnj = 'می روم';
      expect(normalizeText(withZwnj)).toBe(normalizeText(withoutZwnj));
    });

    test('11. Accents and umlauts evaluation in European languages', () => {
      const card: LanguageCard = {
        id: 'acc1',
        targetText: 'Café',
        translation: 'کافه',
        targetLanguage: 'fr',
        nativeLanguage: 'fa',
        cefrLevel: 'A1',
        topic: 'CAT_FOOD',
        contentType: 'Vocabulary',
        learningMode: 'Translate',
        prompt: 'Prompt',
        difficulty: 'easy',
        points: 10
      };

      // Tolerant evaluation: typing "cafe" without accent should be accepted as correct
      const result = evaluateAnswer(card, 'cafe');
      expect(result.isCorrect).toBe(true);

      // German umlaut tolerant evaluation
      const deCard: LanguageCard = {
        id: 'acc2',
        targetText: 'Mädchen',
        translation: 'دختر',
        targetLanguage: 'de',
        nativeLanguage: 'fa',
        cefrLevel: 'A1',
        topic: 'CAT_EVERYDAY',
        contentType: 'Vocabulary',
        learningMode: 'Translate',
        prompt: 'Prompt',
        difficulty: 'easy',
        points: 10
      };
      const deResult = evaluateAnswer(deCard, 'Madchen');
      expect(deResult.isCorrect).toBe(true);
    });

    test('12. Conversational contractions (I am vs I\'m, cannot vs can\'t)', () => {
      const card: LanguageCard = {
        id: 'con1',
        targetText: "I'm happy",
        translation: 'من خوشحالم',
        targetLanguage: 'en',
        nativeLanguage: 'fa',
        cefrLevel: 'A1',
        topic: 'CAT_EVERYDAY',
        contentType: 'Sentence',
        learningMode: 'Translate',
        prompt: 'Prompt',
        difficulty: 'easy',
        points: 10
      };

      const result = evaluateAnswer(card, 'I am happy');
      expect(result.isCorrect).toBe(true);
    });

    test('13. Punctuation stripping and case insensitivity', () => {
      const card: LanguageCard = {
        id: 'punc1',
        targetText: 'Hello, World!',
        translation: 'سلام، دنیا!',
        targetLanguage: 'en',
        nativeLanguage: 'fa',
        cefrLevel: 'A1',
        topic: 'CAT_EVERYDAY',
        contentType: 'Sentence',
        learningMode: 'Translate',
        prompt: 'Prompt',
        difficulty: 'easy',
        points: 10
      };

      const result = evaluateAnswer(card, 'hello world');
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('Scenario Group 5: Calendar and Date Calculation Reliability', () => {
    test('14. calculateDaysDifference and addDaysToDateString behave accurately', () => {
      const dateA = '2026-10-01';
      const dateB = '2026-10-05';
      expect(calculateDaysDifference(dateA, dateB)).toBe(4);

      const added = addDaysToDateString('2026-10-01', 7);
      expect(added).toBe('2026-10-08');
    });
  });
});
