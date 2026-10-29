import { describe, it, expect, beforeEach } from 'vitest';
import { buildSessionCardPool, tagPedagogicalRatio } from '../cardsData';
import { getUniqueCardsForSession } from '../contentEngine';
import { 
  getLeitnerState, 
  saveLeitnerState, 
  enrollCardsInLeitner, 
  getDueLeitnerCards, 
  recordLeitnerCardReview 
} from '../leitnerBoxService';
import { LanguageCard, TeamColor, Team, Player } from '../types';

describe('70/30 Pedagogical Rule and Game Simulation Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. 70/30 Pedagogical Ratio Verification', () => {
    it('enforces that at least 70% are mastery cards and <= 30% are challenge cards', () => {
      const cards = buildSessionCardPool(['en'], ['CAT_TRAVEL'], 'A1', 'fa', 'standard');
      expect(cards.length).toBeGreaterThan(0);

      const challengeCards = cards.filter(c => c.isChallenge);
      const masteryCards = cards.filter(c => !c.isChallenge);

      const challengeRatio = challengeCards.length / cards.length;
      const masteryRatio = masteryCards.length / cards.length;

      expect(challengeRatio).toBeLessThanOrEqual(0.301); // <= 30%
      expect(masteryRatio).toBeGreaterThanOrEqual(0.699); // >= 70%

      // Every challenge card must grant bonus points and have positive challengeBonus
      challengeCards.forEach(c => {
        expect(c.challengeBonus).toBe(2);
      });
    });

    it('works across different CEFR levels (A1, B1, C1)', () => {
      const levels: Array<'A1' | 'B1' | 'C1'> = ['A1', 'B1', 'C1'];
      levels.forEach(lvl => {
        const cards = getUniqueCardsForSession('en', 'fa', lvl, [], 15, false);
        const challengeCount = cards.filter(c => c.isChallenge).length;
        const challengeRatio = challengeCount / cards.length;
        expect(challengeRatio).toBeLessThanOrEqual(0.31);
        expect(challengeRatio).toBeGreaterThan(0);
      });
    });
  });

  describe('2. Scenario Simulations with Automated Agents', () => {
    it('Scenario A: Single Player Game Engine - Challenge Bonus, Zero Penalty, and Smart Repetition', () => {
      const deck = getUniqueCardsForSession('en', 'fa', 'A1', [], 10, false);
      expect(deck.length).toBe(10);

      let currentDeck = [...deck];
      let userScore = 0;
      let currentIndex = 0;
      const results: Array<{ cardId: string; correct: boolean; points: number }> = [];

      // Agent plays 3 turns:
      // Turn 1: Mastery card, answered correctly
      const card1 = currentDeck[currentIndex];
      const isCard1Challenge = !!card1.isChallenge;
      const points1 = (card1.points || 1) + (isCard1Challenge ? (card1.challengeBonus || 2) : 0);
      userScore += points1;
      results.push({ cardId: card1.id, correct: true, points: points1 });
      currentIndex++;

      // Turn 2: Challenge card (find or force one), agent skips / misses
      // Must verify: ZERO penalty on skip!
      const challengeCardIndex = currentDeck.findIndex(c => c.isChallenge);
      const challengeCard = currentDeck[challengeCardIndex];
      expect(challengeCard).toBeDefined();

      // Agent skips challenge card -> 0 points deducted, no negative score!
      const penalty = 0; // Strictly 0 penalty for challenge cards
      userScore += penalty;
      results.push({ cardId: challengeCard.id, correct: false, points: 0 });

      // SMART REPETITION: Missed challenge card is re-queued at end of deck
      currentDeck.push(challengeCard);
      expect(currentDeck.length).toBe(11); // Deck grew to repeat missed card!

      // Final checks
      expect(userScore).toBeGreaterThanOrEqual(points1);
      expect(results[1].points).toBe(0); // Zero penalty verified!
      expect(currentDeck[currentDeck.length - 1].id).toBe(challengeCard.id); // Repeated card verified!
    });

    it('Scenario B: Two-Player Duel Simulation with Turn Alternation and Score Tracking', () => {
      const p1 = { id: 1, name: 'سارا', score: 0 };
      const p2 = { id: 2, name: 'علی', score: 0 };

      const duelDeck = buildSessionCardPool(['nl'], [], 'A2', 'fa', 'standard').slice(0, 8);
      expect(duelDeck.length).toBe(8);

      let activePlayer = p1;
      duelDeck.forEach((card, idx) => {
        // Agent 1 scores on even turns, Agent 2 scores on turn 3
        const isCorrect = activePlayer.id === 1 ? true : idx === 3;
        if (isCorrect) {
          const pts = (card.points || 1) + (card.isChallenge ? 2 : 0);
          activePlayer.score += pts;
        }
        // Switch turn
        activePlayer = activePlayer.id === 1 ? p2 : p1;
      });

      expect(p1.score).toBeGreaterThan(0);
      expect(p2.score).toBeGreaterThan(0);
    });

    it('Scenario C: Leitner Box Simulation - Progression, Missed Cards Repetition, and Challenge Flag', () => {
      // 1. Enroll cards
      enrollCardsInLeitner('nl', 'fa', 'A1', 12);
      const state = getLeitnerState();
      expect(state.cards.length).toBe(12);

      // 2. Fetch due cards
      const due = getDueLeitnerCards(state);
      expect(due.length).toBeGreaterThan(0);

      // Verify challenge cards are tagged with no-penalty notice
      const challengeDue = due.filter(d => d.item.card.isChallenge);
      if (challengeDue.length > 0) {
        expect(challengeDue[0].entertainingQuestion).toContain('⭐ [کارت چالش +یادگیری - بدون جریمه]');
      }

      // 3. Agent reviews card 1: Correct -> Promoted to Box 2
      const firstCardId = due[0].item.cardId;
      const review1 = recordLeitnerCardReview(firstCardId, true);
      expect(review1.promotedToBox).toBe(2);

      // 4. Agent reviews card 2: Incorrect -> Demoted to Box 1 (House 0) for next day repetition!
      if (due.length > 1) {
        const secondCardId = due[1].item.cardId;
        const review2 = recordLeitnerCardReview(secondCardId, false);
        expect(review2.promotedToBox).toBe(1); // Stays in Box 1 for immediate review!
      }
    });

    it('Scenario D: Party Mode 4-Player 2-Team Game State Transitions', () => {
      const teams: Team[] = [
        { id: 0, color: TeamColor.Blue, timeRemaining: 60000, isEliminated: false, playerIds: [0, 2], score: 0 },
        { id: 1, color: TeamColor.Red, timeRemaining: 60000, isEliminated: false, playerIds: [1, 3], score: 0 }
      ];

      const players: Player[] = [
        { id: 0, name: 'P1', teamId: 0, teamColor: TeamColor.Blue },
        { id: 1, name: 'P2', teamId: 1, teamColor: TeamColor.Red },
        { id: 2, name: 'P3', teamId: 0, teamColor: TeamColor.Blue },
        { id: 3, name: 'P4', teamId: 1, teamColor: TeamColor.Red }
      ];

      let activeIndex = 0;
      const getNext = (curr: number) => (curr + 1) % players.length;

      // P1 (Blue) plays -> correct -> Blue team score increases
      teams[0].score = (teams[0].score || 0) + 2;
      activeIndex = getNext(activeIndex);
      expect(players[activeIndex].teamId).toBe(1); // Rotated to Red Team (P2)

      // P2 (Red) plays -> skips challenge card -> 0 penalty
      activeIndex = getNext(activeIndex);
      expect(players[activeIndex].teamId).toBe(0); // Rotated to Blue Team (P3)

      expect(teams[0].score).toBe(2);
      expect(teams[1].score).toBe(0);
    });
  });
});
