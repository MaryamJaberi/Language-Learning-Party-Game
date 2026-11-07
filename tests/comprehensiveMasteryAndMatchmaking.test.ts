// tests/comprehensiveMasteryAndMatchmaking.test.ts
// Comprehensive Test Suite for Mastery Proximity Adaptive Engine, Online Matchmaking, Fair Scoring & Storage

import { describe, it, expect, beforeEach } from 'vitest';
import {
  Session,
  MultiplayerGame,
  createPlayer,
  createItemStats,
  predict,
  scoreCard,
  retrievability,
  CEFR_B,
  TYPE_OFFSET,
  DEFAULTS,
  AdaptiveItem,
  AdaptivePlayer,
  ItemStats,
  DAY
} from '../src/engine/adaptive';
import {
  findOnlineDuelMatch,
  findOnlineMultiplayerMatch,
  spawnDuelAiChallenger,
  addAiTeammatesToPartyRoom
} from '../onlineRoomService';

describe('1. Adaptive Difficulty Engine Math & Flow Band', () => {
  it('correctly calculates FSRS power-law retrievability', () => {
    // R(S days, S) should be exactly 0.90
    const S = 5;
    const t = 5 * DAY;
    const r = retrievability(t, S);
    expect(r).toBeCloseTo(0.9, 2);

    // Immediate recall (t = 0) should be 1.0
    expect(retrievability(0, S)).toBe(1.0);

    // Very long delay (e.g. 100 days) with S = 5 days
    // FSRS: R(100, 5) = (1 + (19/81) * 100 / 5)^(-0.5) = (461/81)^(-0.5) = 9/sqrt(461) ≈ 0.41917
    expect(retrievability(100 * DAY, S)).toBeCloseTo(0.419, 3);
  });

  it('predicts success probability based on ability theta and item difficulty b', () => {
    const item: AdaptiveItem = { id: 'w1', cefr: 'B1' };
    const stats: ItemStats = createItemStats();
    
    // Equal ability and difficulty: p = 0.5 for recognize
    const pEqual = predict(0, item, 'recognize', stats, false, 0);
    expect(pEqual).toBeCloseTo(0.5, 2);

    // Higher ability (theta = 1.5, b = 0): p > 0.8
    const pHigher = predict(1.5, item, 'recognize', stats, false, 0);
    expect(pHigher).toBeGreaterThan(0.8);

    // Scaffold choice2 gives +1.2 logit boost for beginner A1
    const pChoice2 = predict(-1.5, { id: 'wA1', cefr: 'A1' }, 'choice2', stats, false, 0);
    expect(pChoice2).toBeGreaterThan(0.75);
  });

  it('maintains the flow band and triggers rescue after 3 consecutive failures', () => {
    const player: AdaptivePlayer = createPlayer('test-p1', 'B1');
    const stats: ItemStats = createItemStats();
    const bank: AdaptiveItem[] = [
      { id: 'b1', cefr: 'B1' },
      { id: 'b2', cefr: 'B1' },
      { id: 'b3', cefr: 'B1' },
      { id: 'b4', cefr: 'B1' },
      { id: 'b5', cefr: 'B1' },
      { id: 'b6', cefr: 'B1' }
    ];

    const session = new Session(player, bank, stats, { level: 'B1' });

    // Fail 3 cards in a row
    for (let i = 0; i < 3; i++) {
      session.next();
      session.answer({ correct: false, ms: 4000 });
    }

    // Next card should be in rescue mode aiming at rescueTarget (0.96)
    const rescueCard = session.next();
    expect(rescueCard.mode).toBe('rescue');
    expect(rescueCard.target).toBe(DEFAULTS.rescueTarget);
    expect(rescueCard.indicator).toBe('review');
  });

  it('peak-end rule: finale card of a turn/session targets >= 0.93 success', () => {
    const player: AdaptivePlayer = createPlayer('test-p2', 'A2');
    const stats: ItemStats = createItemStats();
    const bank: AdaptiveItem[] = [
      { id: 'a1', cefr: 'A2' },
      { id: 'a2', cefr: 'A2' },
      { id: 'a3', cefr: 'A2' }
    ];

    const session = new Session(player, bank, stats, { level: 'A2' });
    const finaleCard = session.next({ finale: true });
    expect(finaleCard.target).toBe(DEFAULTS.finaleTarget);
    expect(['review', 'balanced']).toContain(finaleCard.indicator);
  });
});

describe('2. Fair Scoring & Multiplayer Game Balancing', () => {
  it('fair scoring provides balanced mathematical expectation across CEFR levels', () => {
    // When an A1 player answers a card with pPred = 0.65, points are higher
    const pointsHard = scoreCard(1.0, 0.65, true);
    // When a C1 player answers an easy card with pPred = 0.90, points are lower
    const pointsEasy = scoreCard(1.0, 0.90, true);

    expect(pointsHard).toBeGreaterThan(pointsEasy);

    // Raw mode provides equal points
    const rawHard = scoreCard(1.0, 0.65, false);
    const rawEasy = scoreCard(1.0, 0.90, false);
    expect(rawHard).toBe(rawEasy);
  });

  it('guarantees at least one challenge card per turn in group hotseat mode', () => {
    const p1 = createPlayer('p1', 'A1');
    const p2 = createPlayer('p2', 'B2');
    const stats = createItemStats();
    const bank: AdaptiveItem[] = [
      { id: 'g1', cefr: 'A1' },
      { id: 'g2', cefr: 'A2' },
      { id: 'g3', cefr: 'B1' },
      { id: 'g4', cefr: 'B2' }
    ];

    const mg = new MultiplayerGame([p1, p2], bank, stats, { cardsPerTurn: 4 });
    const flagsTurn0 = mg.flagsFor(2); // Second to last card (j = cardsPerTurn - 2 = 2)
    expect(flagsTurn0.stretch).toBe(true);

    const flagsTurnLast = mg.flagsFor(3); // Finale card (j = cardsPerTurn - 1 = 3)
    expect(flagsTurnLast.finale).toBe(true);
  });
});

describe('3. Online Matchmaking & AI Challenger Resilience', () => {
  it('exports matchmaking and AI challenger support functions', () => {
    expect(typeof findOnlineDuelMatch).toBe('function');
    expect(typeof findOnlineMultiplayerMatch).toBe('function');
    expect(typeof spawnDuelAiChallenger).toBe('function');
    expect(typeof addAiTeammatesToPartyRoom).toBe('function');
  });
});
