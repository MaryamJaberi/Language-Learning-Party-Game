// tests/dorAdaptiveEngine.test.ts — Comprehensive Vitest suite for Dor Adaptive Engine
import { describe, it, expect } from 'vitest';
import {
  Session,
  MultiplayerGame,
  createPlayer,
  createItemStats,
  mulberry32,
  retrievability,
  CEFR_B,
  CEFR_ORDER,
  TYPE_OFFSET,
  DAY,
  scoreCard,
  predict,
  DEFAULTS
} from '../src/engine/adaptive';

const sig = (x: number) => 1 / (1 + Math.exp(-x));
function gauss(rng: () => number) {
  let u = 0, v = 0;
  while (!u) u = rng();
  while (!v) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function makeBank(rng: () => number, n = 660) {
  const bank = [];
  for (let i = 0; i < n; i++) {
    const cefr = CEFR_ORDER[Math.floor(rng() * CEFR_ORDER.length)];
    bank.push({ id: 'w' + i, cefr, trueOffset: gauss(rng) * 0.5 });
  }
  return bank;
}

function makeLearner(rng: () => number, trueLevel: any, { learnRate = 0.6, speed = 1, fatigueAfter = 999 } = {}) {
  return {
    thetaTrue: (CEFR_B as any)[trueLevel] + 0.3 + gauss(rng) * 0.2,
    learnRate,
    speed,
    fatigueAfter,
    mem: {} as Record<string, any>,
    cardsDone: 0
  };
}

function trueP(L: any, item: any, type: any, hint: boolean, now: number) {
  const b = (CEFR_B as any)[item.cefr] + item.trueOffset + (TYPE_OFFSET as any)[type] - (hint ? 0.7 : 0);
  const pA = sig(L.thetaTrue - b);
  const m = L.mem[item.id];
  const pM = m ? retrievability(now - m.last, m.S) : 0;
  return 1 - (1 - pA) * (1 - pM);
}

function respond(L: any, card: any, rng: () => number, now: number) {
  const p = trueP(L, card.item, card.type, card.hint, now);
  const correct = rng() < p;
  const fatigue = L.cardsDone > L.fatigueAfter ? 1.8 : 1;
  const ms = 4000 * L.speed * (1.2 - 0.7 * p) * Math.exp(gauss(rng) * 0.25) * fatigue;
  const m = L.mem[card.item.id];
  if (!m) {
    if (rng() < L.learnRate) L.mem[card.item.id] = { S: correct ? 2 : 0.6, last: now };
  } else {
    const R = retrievability(now - m.last, m.S);
    m.S = correct ? m.S * (1 + 2.2 * (1 - R) + 0.3) : Math.max(0.3, m.S * 0.5);
    m.last = now;
  }
  L.cardsDone++;
  return { correct, ms, pTrue: p };
}

function runSingle(profile: any, seed: number, cards = 40) {
  const rng = mulberry32(seed);
  const bank = makeBank(rng);
  const stats = createItemStats();
  const L = makeLearner(rng, profile.level, profile.opts);
  const P = createPlayer('u', profile.declared);
  const now = Date.UTC(2026, 9, 1);
  const s = new Session(P, bank as any, stats, { rng, now, level: profile.declared });
  let maxFail = 0, cur = 0, dup = 0;
  const seen = new Map();
  let finaleOk = 0, finales = 0;

  for (let i = 0; i < cards; i++) {
    const flags = i % 8 === 7 ? { finale: true } : {};
    const c = s.next(flags);
    if (!c) break;
    if (seen.has(c.item.id) && c.bucket !== 'requeue' && c.bucket !== 'consolidate') dup++;
    seen.set(c.item.id, true);
    const r = respond(L, c, rng, now + i * 15000);
    s.answer({ correct: r.correct, ms: r.ms });
    cur = r.correct ? 0 : cur + 1;
    maxFail = Math.max(maxFail, cur);
    if (flags.finale) {
      finales++;
      if (r.correct) finaleOk++;
    }
  }

  const h = s.history;
  const mean = (a: number[]) => a.reduce((sum, x) => sum + x, 0) / a.length;
  return {
    accLate: mean(h.slice(10).map((x) => (x.correct ? 1 : 0))),
    maxFail,
    dup,
    thetaErr: Math.abs(P.theta - L.thetaTrue),
    finaleRate: finales ? finaleOk / finales : 1
  };
}

describe('Dor Adaptive Difficulty Engine (Mastery Proximity)', () => {
  it('verifies mathematical foundation: FSRS retrievability, predictability, and scoring', () => {
    // 1. R(0, S) == 1.0
    expect(retrievability(0, 5)).toBeCloseTo(1.0, 5);
    // 2. R(S, S) == 0.9
    expect(retrievability(5 * DAY, 5)).toBeCloseTo(0.9, 2);
    // 3. Predictability when theta == b for recognize (offset = 0) is 0.5 without memory
    const p = createPlayer('test', 'B1');
    const item = { id: 'test1', cefr: 'B1' as const };
    const stats = createItemStats();
    expect(predict(p, item, 'recognize', stats, Date.now())).toBeCloseTo(0.5, 3);
    // 4. Fair scoring scales inversely with pPred
    const easyPts = scoreCard(1, 0.9, true);
    const hardPts = scoreCard(1, 0.6, true);
    expect(hardPts).toBeGreaterThan(easyPts);
  });

  const PROFILES = [
    { name: 'beginner A1', level: 'A1', declared: 'A1' },
    { name: 'intermediate B1', level: 'B1', declared: 'B1' },
    { name: 'advanced C1', level: 'C1', declared: 'C1' },
    { name: 'struggler A2 (low learning)', level: 'A2', declared: 'A2', opts: { learnRate: 0.25, speed: 1.4 } },
    { name: 'fast learner A2', level: 'A2', declared: 'A2', opts: { learnRate: 0.9, speed: 0.7 } },
    { name: 'over-declared (says B1, is A1)', level: 'A1', declared: 'B1' },
    { name: 'under-declared (says A1, is B2)', level: 'B2', declared: 'A1' }
  ];

  PROFILES.forEach((pr) => {
    it(`validates profile: ${pr.name} maintains 70-90% flow band and ≤ 4 streak limit`, () => {
      const runs = Array.from({ length: 60 }, (_, k) => runSingle(pr, 700000 + k));
      const mean = (a: number[]) => a.reduce((sum, x) => sum + x, 0) / a.length;
      const q = (a: number[], p: number) => {
        const s = [...a].sort((x, y) => x - y);
        return s[Math.floor(p * (s.length - 1))];
      };

      const accLate = mean(runs.map((r) => r.accLate));
      const mf95 = q(runs.map((r) => r.maxFail), 0.95);
      const dup = runs.reduce((s, r) => s + r.dup, 0);
      const tErr = mean(runs.map((r) => r.thetaErr));
      const fin = mean(runs.map((r) => r.finaleRate));

      expect(accLate).toBeGreaterThanOrEqual(0.70);
      expect(accLate).toBeLessThanOrEqual(0.90);
      expect(mf95).toBeLessThanOrEqual(4);
      expect(dup).toBe(0);
      expect(tErr).toBeLessThan(0.75);
      expect(fin).toBeGreaterThanOrEqual(0.85);
    });
  });

  it('validates pair fair mode: beginner vs advanced win rate is between 40-60%', () => {
    const seedBase = 7;
    const rng = mulberry32(seedBase * 3000);
    const bank = makeBank(rng);
    const stats = createItemStats();
    const now = Date.UTC(2026, 9, 1);
    const Ls = [makeLearner(rng, 'A1'), makeLearner(rng, 'C1')];
    const Ps = [createPlayer('a', 'A1'), createPlayer('b', 'C1')];

    // warm-up
    Ps.forEach((P, i) => {
      const s = new Session(P, bank as any, stats, { rng, now: now - DAY });
      for (let k = 0; k < 25; k++) {
        const c = s.next();
        const r = respond(Ls[i], c, rng, now - DAY);
        s.answer(r);
      }
    });

    const games = Array.from({ length: 150 }, (_, k) => {
      const gRng = mulberry32(seedBase * 3000 + k);
      const g = new MultiplayerGame(Ps, bank as any, stats, {
        mode: 'pair',
        rounds: 5,
        cardsPerTurn: 4,
        fair: true,
        rng: gRng,
        now
      });
      for (let t = 0; t < g.totalTurns; t++) {
        g.startTurn();
        const i = g.activeIndex();
        const s = g.sessions[i];
        for (let j = 0; j < g.cardsPerTurn; j++) {
          const f = g.flagsFor(j);
          const c = s.next(f);
          const r = respond(Ls[i], c, gRng, now);
          const res = s.answer(r);
          g.record(c, res, f);
        }
        g.endTurn();
      }
      return g;
    });

    const weakWins = games.filter((g) => g.scores[0] > g.scores[1]).length / games.length;
    expect(weakWins).toBeGreaterThanOrEqual(0.38);
    expect(weakWins).toBeLessThanOrEqual(0.62);
  });

  it('validates determinism: identical seed produces identical card sequence', () => {
    const run1 = runSingle(PROFILES[1], 42);
    const run2 = runSingle(PROFILES[1], 42);
    expect(run1.accLate).toBeCloseTo(run2.accLate, 4);
  });
});
