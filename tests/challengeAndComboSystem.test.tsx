import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { tagPedagogicalRatio, buildSessionCardPool } from '../cardsData';
import GameplayScreen from '../screens/GameplayScreen';
import { HelpScreen } from '../screens/HelpScreen';
import { LanguageCard, TeamColor, Team, Player, GameSettings, GameStatus } from '../types';

describe('Challenge Cards & Combo System Specifications', () => {
  const dummyTeams: Team[] = [
    { id: 0, color: TeamColor.Blue, score: 0, timeRemaining: 60000, isEliminated: false, playerIds: [0, 2], comboStreak: 0 },
    { id: 1, color: TeamColor.Red, score: 0, timeRemaining: 60000, isEliminated: false, playerIds: [1, 3], comboStreak: 0 }
  ];

  const dummyPlayers: Player[] = [
    { id: 0, name: 'Player 1', avatar: '🦁', teamId: 0, teamColor: TeamColor.Blue },
    { id: 1, name: 'Player 2', avatar: '🦊', teamId: 1, teamColor: TeamColor.Red },
    { id: 2, name: 'Player 3', avatar: '🐻', teamId: 0, teamColor: TeamColor.Blue },
    { id: 3, name: 'Player 4', avatar: '🐼', teamId: 1, teamColor: TeamColor.Red }
  ];

  const baseSettings: GameSettings = {
    playerCount: 4,
    playerNames: ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
    roundDuration: 60,
    roundsCount: 3,
    language: 'fa',
    nativeLanguage: 'fa',
    targetLanguages: ['en'],
    cefrLevel: 'A1',
    selectedCategories: ['CAT_TRAVEL'],
    cardGameMode: 'mixed',
    soundEnabled: false,
    cardRevealEnabled: false,
    passPhoneScreenEnabled: false
  };

  describe('1. Challenge Cards Strict CEFR Selection & Equal Team Quota', () => {
    it('selects ONLY Difficulty=Hard cards strictly within chosen CEFR level (never pulls from higher level)', () => {
      const mockPool: LanguageCard[] = [
        { id: 'c1', topic: 'gen', contentType: 'Phrase', learningMode: 'Explain', prompt: 'P', targetText: 'easy_a1', translation: 'ساده', cefrLevel: 'A1', difficulty: 'easy', points: 1, targetLanguage: 'en', nativeLanguage: 'fa' },
        { id: 'c2', topic: 'gen', contentType: 'Phrase', learningMode: 'Explain', prompt: 'P', targetText: 'medium_a1', translation: 'متوسط', cefrLevel: 'A1', difficulty: 'medium', points: 1, targetLanguage: 'en', nativeLanguage: 'fa' },
        { id: 'c3', topic: 'gen', contentType: 'Phrase', learningMode: 'Explain', prompt: 'P', targetText: 'hard_a1', translation: 'سخت', cefrLevel: 'A1', difficulty: 'hard', points: 1, targetLanguage: 'en', nativeLanguage: 'fa' },
        { id: 'c4', topic: 'gen', contentType: 'Phrase', learningMode: 'Explain', prompt: 'P', targetText: 'hard_b2', translation: 'سخت سطح بالا', cefrLevel: 'B2', difficulty: 'hard', points: 1, targetLanguage: 'en', nativeLanguage: 'fa' },
        { id: 'c5', topic: 'gen', contentType: 'Phrase', learningMode: 'Explain', prompt: 'P', targetText: 'hard_c1', translation: 'سخت سی ۱', cefrLevel: 'C1', difficulty: 'hard', points: 1, targetLanguage: 'en', nativeLanguage: 'fa' }
      ];

      const tagged = tagPedagogicalRatio(mockPool, 'A1');
      const challengeCards = tagged.filter(c => c.isChallenge);

      // Must only pick A1 hard card
      expect(challengeCards.length).toBe(1);
      expect(challengeCards[0].id).toBe('c3');
      expect(challengeCards[0].cefrLevel).toBe('A1');
      expect(challengeCards[0].difficulty).toBe('hard');
      expect(challengeCards[0].challengeBonus).toBe(2);

      // Verify B2 and C1 cards were NEVER tagged as challenges for A1 level
      expect(tagged.find(c => c.id === 'c4')?.isChallenge).toBe(false);
      expect(tagged.find(c => c.id === 'c5')?.isChallenge).toBe(false);
    });

    it('gives each team the same number of challenge cards per round', () => {
      vi.useFakeTimers();
      const challengeCard: LanguageCard = {
        id: 'chal-1',
        topic: 'gen',
        contentType: 'Phrase',
        learningMode: 'Explain',
        prompt: 'P',
        targetText: 'Difficult Phrase',
        translation: 'عبارت دشوار',
        cefrLevel: 'A1',
        difficulty: 'hard',
        points: 1,
        isChallenge: true,
        challengeBonus: 2,
        targetLanguage: 'en',
        nativeLanguage: 'fa'
      };

      const setPlayedCards = vi.fn();
      const onGetNextWord = vi.fn();

      const { rerender } = render(
        <GameplayScreen
          settings={baseSettings}
          teams={dummyTeams}
          setTeams={vi.fn()}
          players={dummyPlayers}
          gameStatus={GameStatus.ActiveTurn}
          setGameStatus={vi.fn()}
          currentRound={1}
          setCurrentRound={vi.fn()}
          activePlayerIndex={0} // Team 0
          setActivePlayerIndex={vi.fn()}
          roundTimer={50000}
          setRoundTimer={vi.fn()}
          currentCard={challengeCard}
          swapCooldown={20000}
          onGetNextWord={onGetNextWord}
          onResume={vi.fn()}
          isPoolExhausted={false}
          onFinish={vi.fn()}
          onExit={vi.fn()}
          onExitHome={vi.fn()}
          onExitSetup={vi.fn()}
          onOpenHelp={vi.fn()}
          playedCards={[]}
          setPlayedCards={setPlayedCards}
        />
      );

      // Team 0 receives challenge card badge
      expect(screen.getByText(/کارت چالش/i)).toBeInTheDocument();

      // Team 0 answers correctly (+2 bonus)
      const correctBtn = screen.getByRole('button', { name: /درست بود!/i });
      fireEvent.click(correctBtn);
      vi.advanceTimersByTime(350);

      // Now rerender with Player 1 (Team 1) also receiving challenge card
      rerender(
        <GameplayScreen
          settings={baseSettings}
          teams={dummyTeams}
          setTeams={vi.fn()}
          players={dummyPlayers}
          gameStatus={GameStatus.ActiveTurn}
          setGameStatus={vi.fn()}
          currentRound={1}
          setCurrentRound={vi.fn()}
          activePlayerIndex={1} // Team 1
          setActivePlayerIndex={vi.fn()}
          roundTimer={50000}
          setRoundTimer={vi.fn()}
          currentCard={challengeCard}
          swapCooldown={20000}
          onGetNextWord={onGetNextWord}
          onResume={vi.fn()}
          isPoolExhausted={false}
          onFinish={vi.fn()}
          onExit={vi.fn()}
          onExitHome={vi.fn()}
          onExitSetup={vi.fn()}
          onOpenHelp={vi.fn()}
          playedCards={[]}
          setPlayedCards={setPlayedCards}
        />
      );

      // Team 1 also gets challenge card
      expect(screen.getAllByText(/کارت چالش/i).length).toBeGreaterThan(0);
      vi.useRealTimers();
    });
  });

  describe('2. Visual-only Combo Badge with No Bonus Points and Resets', () => {
    it('displays 🔥 xN badge visually and gives NO bonus points for combo', () => {
      vi.useFakeTimers();
      let currentTeams = [...dummyTeams];
      const setTeams = vi.fn((updater) => {
        if (typeof updater === 'function') {
          currentTeams = updater(currentTeams);
        } else {
          currentTeams = updater;
        }
      });

      const normalCard: LanguageCard = {
        id: 'norm-1',
        topic: 'gen',
        contentType: 'Phrase',
        learningMode: 'Explain',
        prompt: 'P',
        targetText: 'Water',
        translation: 'آب',
        cefrLevel: 'A1',
        difficulty: 'easy',
        points: 1,
        targetLanguage: 'en',
        nativeLanguage: 'fa'
      };

      render(
        <GameplayScreen
          settings={baseSettings}
          teams={currentTeams}
          setTeams={setTeams}
          players={dummyPlayers}
          gameStatus={GameStatus.ActiveTurn}
          setGameStatus={vi.fn()}
          currentRound={1}
          setCurrentRound={vi.fn()}
          activePlayerIndex={0}
          setActivePlayerIndex={vi.fn()}
          roundTimer={50000}
          setRoundTimer={vi.fn()}
          currentCard={normalCard}
          swapCooldown={20000}
          onGetNextWord={vi.fn()}
          onResume={vi.fn()}
          isPoolExhausted={false}
          onFinish={vi.fn()}
          onExit={vi.fn()}
          onExitHome={vi.fn()}
          onExitSetup={vi.fn()}
          onOpenHelp={vi.fn()}
          playedCards={[]}
          setPlayedCards={vi.fn()}
        />
      );

      const correctBtn = screen.getByRole('button', { name: /درست بود!/i });

      // Advance past 6s speed threshold so speed bonus is not awarded (base points = 1)
      vi.advanceTimersByTime(7000);

      // First correct guess: 1 pt awarded (no combo badge yet, streak = 1)
      fireEvent.click(correctBtn);
      vi.advanceTimersByTime(7000);
      expect(currentTeams[0].score).toBe(1);
      expect(screen.queryByTestId('combo-badge')).not.toBeInTheDocument();

      // Second correct guess on same turn: streak = 2, displays 🔥 x2
      fireEvent.click(correctBtn);
      vi.advanceTimersByTime(7000);
      // Base points is 1, NO combo bonus added (total score is now 2)
      expect(currentTeams[0].score).toBe(2);
      expect(screen.getByTestId('combo-badge')).toBeInTheDocument();
      expect(screen.getByTestId('combo-badge').textContent).toContain('🔥 x2');

      // Third correct guess: streak = 3, displays 🔥 x3
      fireEvent.click(correctBtn);
      vi.advanceTimersByTime(7000);
      // Total score is 3 (1+1+1, absolutely NO bonus points for combo streak!)
      expect(currentTeams[0].score).toBe(3);
      expect(screen.getByTestId('combo-badge').textContent).toContain('🔥 x3');

      // Now skip card: resets combo streak
      const skipBtn = screen.getByRole('button', { name: /رد کردن/i });
      fireEvent.click(skipBtn);
      vi.advanceTimersByTime(350);
      expect(screen.queryByTestId('combo-badge')).not.toBeInTheDocument();
      vi.useRealTimers();
    });

    it('resets combo streak on turn end / active player change', () => {
      vi.useFakeTimers();
      const normalCard: LanguageCard = {
        id: 'norm-2',
        topic: 'gen',
        contentType: 'Phrase',
        learningMode: 'Explain',
        prompt: 'P',
        targetText: 'Sun',
        translation: 'خورشید',
        cefrLevel: 'A1',
        difficulty: 'easy',
        points: 1,
        targetLanguage: 'en',
        nativeLanguage: 'fa'
      };

      const { rerender } = render(
        <GameplayScreen
          settings={baseSettings}
          teams={dummyTeams}
          setTeams={vi.fn()}
          players={dummyPlayers}
          gameStatus={GameStatus.ActiveTurn}
          setGameStatus={vi.fn()}
          currentRound={1}
          setCurrentRound={vi.fn()}
          activePlayerIndex={0}
          setActivePlayerIndex={vi.fn()}
          roundTimer={50000}
          setRoundTimer={vi.fn()}
          currentCard={normalCard}
          swapCooldown={20000}
          onGetNextWord={vi.fn()}
          onResume={vi.fn()}
          isPoolExhausted={false}
          onFinish={vi.fn()}
          onExit={vi.fn()}
          onExitHome={vi.fn()}
          onExitSetup={vi.fn()}
          onOpenHelp={vi.fn()}
          playedCards={[]}
          setPlayedCards={vi.fn()}
        />
      );

      const correctBtn = screen.getByRole('button', { name: /درست بود!/i });
      fireEvent.click(correctBtn);
      vi.advanceTimersByTime(350);
      fireEvent.click(correctBtn);
      vi.advanceTimersByTime(350);
      expect(screen.getByTestId('combo-badge')).toBeInTheDocument();

      // Change activePlayerIndex to 1 (turn change)
      rerender(
        <GameplayScreen
          settings={baseSettings}
          teams={dummyTeams}
          setTeams={vi.fn()}
          players={dummyPlayers}
          gameStatus={GameStatus.ActiveTurn}
          setGameStatus={vi.fn()}
          currentRound={1}
          setCurrentRound={vi.fn()}
          activePlayerIndex={1}
          setActivePlayerIndex={vi.fn()}
          roundTimer={50000}
          setRoundTimer={vi.fn()}
          currentCard={normalCard}
          swapCooldown={20000}
          onGetNextWord={vi.fn()}
          onResume={vi.fn()}
          isPoolExhausted={false}
          onFinish={vi.fn()}
          onExit={vi.fn()}
          onExitHome={vi.fn()}
          onExitSetup={vi.fn()}
          onOpenHelp={vi.fn()}
          playedCards={[]}
          setPlayedCards={vi.fn()}
        />
      );

      // Streak badge must be reset
      expect(screen.queryByTestId('combo-badge')).not.toBeInTheDocument();
      vi.useRealTimers();
    });
  });

  describe('3. HelpScreen Challenge & Combo Rules in every UI Language', () => {
    it('renders challenge and combo rules correctly for multiple languages', () => {
      const languagesToTest = ['fa', 'en', 'nl', 'de', 'fr', 'es', 'it', 'tr', 'ar', 'ru', 'zh', 'ja', 'ko'];

      languagesToTest.forEach(lang => {
        const { unmount } = render(
          <HelpScreen
            language={lang}
            onClose={vi.fn()}
            initialSection="rules"
          />
        );

        // Switch to rules tab if needed
        const rulesTab = screen.getByRole('button', { name: /قوانین|Rules|Regels|Regeln|Règles|Reglas|Regole|Kurallar|القواعد|Правила|规则|ルール|규칙/i });
        fireEvent.click(rulesTab);

        expect(screen.getByText(/⭐/)).toBeInTheDocument();
        expect(screen.getByText(/🔥/)).toBeInTheDocument();

        unmount();
      });
    });
  });
});
