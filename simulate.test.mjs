// simulate.test.mjs — Monte-Carlo validation of the Dor adaptive engine.
// Run: node simulate.test.mjs [seedBase]
import { Session, MultiplayerGame, createPlayer, createItemStats, mulberry32, retrievability,
  CEFR_B, CEFR_ORDER, TYPE_OFFSET, DAY } from './src/engine/adaptive/dor-adaptive-engine.ts';

const seedBase = Number(process.argv[2] || 7);
const sig = (x) => 1 / (1 + Math.exp(-x));
function gauss(rng) { let u = 0, v = 0; while (!u) u = rng(); while (!v) v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

// ---- synthetic item bank (≈ size of her dataset ×2) ----
function makeBank(rng, n = 660) {
  const bank = [];
  for (let i = 0; i < n; i++) {
    const cefr = CEFR_ORDER[Math.floor(rng() * CEFR_ORDER.length)];
    bank.push({ id: 'w' + i, cefr, trueOffset: gauss(rng) * 0.5 }); // true difficulty unknown to engine
  }
  return bank;
}

// ---- simulated learner (ground truth the engine never sees) ----
function makeLearner(rng, trueLevel, { learnRate = 0.6, speed = 1, fatigueAfter = 999 } = {}) {
  return { thetaTrue: CEFR_B[trueLevel] + 0.3 + gauss(rng) * 0.2, learnRate, speed, fatigueAfter, mem: {}, cardsDone: 0 };
}
function trueP(L, item, type, hint, now) {
  const b = CEFR_B[item.cefr] + item.trueOffset + TYPE_OFFSET[type] - (hint ? 0.7 : 0);
  const pA = sig(L.thetaTrue - b);
  const m = L.mem[item.id]; const pM = m ? retrievability(now - m.last, m.S) : 0;
  return 1 - (1 - pA) * (1 - pM);
}
function respond(L, card, rng, now) {
  const p = trueP(L, card.item, card.type, card.hint, now);
  const correct = rng() < p;
  const fatigue = L.cardsDone > L.fatigueAfter ? 1.8 : 1;
  const ms = 4000 * L.speed * (1.2 - 0.7 * p) * Math.exp(gauss(rng) * 0.25) * fatigue;
  // learning from feedback (the correct answer is always shown)
  const m = L.mem[card.item.id];
  if (!m) { if (rng() < L.learnRate) L.mem[card.item.id] = { S: correct ? 2 : 0.6, last: now }; }
  else { const R = retrievability(now - m.last, m.S); m.S = correct ? m.S * (1 + 2.2 * (1 - R) + 0.3) : Math.max(0.3, m.S * 0.5); m.last = now; }
  L.cardsDone++;
  return { correct, ms, pTrue: p };
}

// ---- baseline: random card from same levels, fixed type (what the app does today) ----
class RandomSession {
  constructor(player, bank, opts) { this.bank = bank.filter((i) => [opts.level].includes(i.cefr)); this.rng = opts.rng; this.shown = new Set(); this.history = []; }
  next() { const c = this.bank.filter((i) => !this.shown.has(i.id)); const pool = c.length ? c : (this.bank.length ? this.bank : [{ id: 'fallback', cefr: 'A1', trueOffset: 0 }]); const item = pool[Math.floor(this.rng() * pool.length)]; this.shown.add(item.id); this.pending = { item, type: 'translate', hint: false, bucket: 'new' }; return this.pending; }
  answer({ correct }) { this.history.push({ ...this.pending, correct, credit: correct ? 1 : 0 }); }
}

const results = []; let failures = 0;
function check(name, ok, detail) { results.push({ name, ok, detail }); if (!ok) failures++; console.log(`${ok ? '✅' : '❌'} ${name} — ${detail}`); }
const pct = (x) => (100 * x).toFixed(1) + '%';
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(p * (s.length - 1))]; };

const PROFILES = [
  { name: 'beginner A1', level: 'A1', declared: 'A1' },
  { name: 'intermediate B1', level: 'B1', declared: 'B1' },
  { name: 'advanced C1', level: 'C1', declared: 'C1' },
  { name: 'struggler A2 (low learning)', level: 'A2', declared: 'A2', opts: { learnRate: 0.25, speed: 1.4 } },
  { name: 'fast learner A2', level: 'A2', declared: 'A2', opts: { learnRate: 0.9, speed: 0.7 } },
  { name: 'over-declared (says B1, is A1)', level: 'A1', declared: 'B1' },
  { name: 'under-declared (says A1, is B2)', level: 'B2', declared: 'A1' },
];

function runSingle(profile, seed, cards = 40, Engine = Session) {
  const rng = mulberry32(seed); const bank = makeBank(rng); const stats = createItemStats();
  const L = makeLearner(rng, profile.level, profile.opts); const P = createPlayer('u', profile.declared);
  const now = Date.UTC(2026, 9, 1);
  const s = new Engine(P, bank, stats, { rng, now, level: profile.declared });
  let maxFail = 0, cur = 0, dup = 0; const seen = new Map(); const inBand = []; let finaleOk = 0, finales = 0;
  for (let i = 0; i < cards; i++) {
    const flags = i % 8 === 7 ? { finale: true } : {};
    const c = s.next(flags); if (!c) break;
    if (seen.has(c.item.id) && c.bucket !== 'requeue' && c.bucket !== 'consolidate') dup++;
    seen.set(c.item.id, true);
    const r = respond(L, c, rng, now + i * 15000);
    s.answer({ correct: r.correct, ms: r.ms });
    inBand.push(r.pTrue >= 0.6 && r.pTrue <= 0.95);
    cur = r.correct ? 0 : cur + 1; maxFail = Math.max(maxFail, cur);
    if (flags.finale) { finales++; if (r.correct) finaleOk++; }
  }
  const h = s.history;
  return { acc: mean(h.map((x) => (x.correct ? 1 : 0))), accLate: mean(h.slice(10).map((x) => (x.correct ? 1 : 0))),
    maxFail, dup, thetaErr: Math.abs(P.theta - L.thetaTrue), inBand: mean(inBand.map(Number)),
    finaleRate: finales ? finaleOk / finales : 1, learner: L, player: P, bank, stats, session: s };
}

console.log(`\n=== Dor adaptive engine — simulation run (seedBase=${seedBase}) ===\n`);

// T1–T5: single-player behaviour per profile, 300 sessions each
for (const pr of PROFILES) {
  const runs = Array.from({ length: 300 }, (_, k) => runSingle(pr, seedBase * 100000 + k));
  const accLate = mean(runs.map((r) => r.accLate));
  const mf95 = q(runs.map((r) => r.maxFail), 0.95);
  const dup = runs.reduce((s, r) => s + r.dup, 0);
  const tErr = mean(runs.map((r) => r.thetaErr));
  const fin = mean(runs.map((r) => r.finaleRate));
  console.log(`\n— ${pr.name}: acc(after warm-up)=${pct(accLate)} | p95 max fail streak=${mf95} | θ error=${tErr.toFixed(2)} | finale success=${pct(fin)}`);
  check(`[${pr.name}] accuracy in flow band 70–90%`, accLate >= 0.70 && accLate <= 0.90, pct(accLate));
  check(`[${pr.name}] p95 longest fail streak ≤ 4`, mf95 <= 4, String(mf95));
  check(`[${pr.name}] no unintended repeats`, dup === 0, `${dup} repeats`);
  check(`[${pr.name}] ability estimate within one CEFR band (mean |θ̂-θ| < 0.75 after 40 cards)`, tErr < 0.75, tErr.toFixed(2));
  check(`[${pr.name}] turn-ending card succeeds ≥ 85%`, fin >= 0.85, pct(fin));
}

// T6: multi-day learning vs current random selection (7 daily sessions × 40 cards, retention measured day 14)
function multiDay(pr, seed, adaptive) {
  const rng = mulberry32(seed); const bank = makeBank(rng); const stats = createItemStats();
  const L = makeLearner(rng, pr.level, pr.opts); const P = createPlayer('u', pr.declared);
  const t0 = Date.UTC(2026, 9, 1); let accs = [];
  for (let d = 0; d < 7; d++) {
    const now = t0 + d * DAY;
    const s = adaptive ? new Session(P, bank, stats, { rng, now, level: pr.declared }) : new RandomSession(P, bank, { rng, level: pr.declared });
    for (let i = 0; i < 40; i++) { const c = s.next(); if (!c) break; const r = respond(L, c, rng, now + i * 15000); s.answer({ correct: r.correct, ms: r.ms }); }
    accs.push(mean(s.history.map((x) => (x.correct ? 1 : 0))));
  }
  const tEnd = t0 + 14 * DAY; // retained = items whose true recall prob ≥ 0.8 a week after the last session
  const retained = Object.values(L.mem).filter((m) => retrievability(tEnd - m.last, m.S) >= 0.8).length;
  return { retained, acc: mean(accs) };
}
for (const pr of [PROFILES[0], PROFILES[1], PROFILES[3]]) {
  const A = Array.from({ length: 120 }, (_, k) => multiDay(pr, seedBase * 7000 + k, true));
  const B = Array.from({ length: 120 }, (_, k) => multiDay(pr, seedBase * 7000 + k, false));
  const ra = mean(A.map((x) => x.retained)), rb = mean(B.map((x) => x.retained));
  console.log(`\n— learning ${pr.name}: adaptive retained=${ra.toFixed(1)} words (acc ${pct(mean(A.map((x) => x.acc)))}) vs random=${rb.toFixed(1)} (acc ${pct(mean(B.map((x) => x.acc)))})`);
  check(`[${pr.name}] adaptive retains more words at day 14 than random`, ra > rb, `${ra.toFixed(1)} vs ${rb.toFixed(1)} (+${pct(ra / rb - 1)})`);
}

// T7: pair mode fairness (A1 beginner vs C1 advanced)
function pairGame(seed, fair) {
  const rng = mulberry32(seed); const bank = makeBank(rng); const stats = createItemStats(); const now = Date.UTC(2026, 9, 1);
  const Ls = [makeLearner(rng, 'A1'), makeLearner(rng, 'C1')];
  const Ps = [createPlayer('a', 'A1'), createPlayer('b', 'C1')];
  // warm-up history so the engine knows both players (returning users)
  Ps.forEach((P, i) => { const s = new Session(P, bank, stats, { rng, now: now - DAY }); for (let k = 0; k < 25; k++) { const c = s.next(); const r = respond(Ls[i], c, rng, now - DAY); s.answer(r); } });
  const g = new MultiplayerGame(Ps, bank, stats, { mode: 'pair', rounds: 5, cardsPerTurn: 4, fair, rng, now });
  for (let t = 0; t < g.totalTurns; t++) {
    g.startTurn(); const i = g.activeIndex(); const s = g.sessions[i];
    for (let j = 0; j < g.cardsPerTurn; j++) { const f = g.flagsFor(j); const c = s.next(f); const r = respond(Ls[i], c, rng, now); const res = s.answer(r); g.record(c, res, f); }
    g.endTurn();
  }
  return g;
}
for (const fair of [true, false]) {
  const games = Array.from({ length: 600 }, (_, k) => pairGame(seedBase * 3000 + k, fair));
  const weakWins = games.filter((g) => g.scores[0] > g.scores[1]).length / games.length;
  const ties = games.filter((g) => g.scores[0] === g.scores[1]).length / games.length;
  console.log(`\n— pair ${fair ? 'FAIR' : 'RAW'} mode: beginner win rate=${pct(weakWins)} (ties ${pct(ties)})`);
  if (fair) check('[pair fair] beginner vs advanced win rate 40–60%', weakWins >= 0.40 && weakWins <= 0.60, pct(weakWins));
  else console.log('   (info) raw scoring is already partly balanced because each player gets cards at their own level');
}

// T8: group mode (6 mixed players)
{
  const levels = ['A1', 'A1', 'A2', 'B1', 'B2', 'C1']; const okBand = [], stretchOk = [], spread = [];
  for (let k = 0; k < 300; k++) {
    const rng = mulberry32(seedBase * 9000 + k); const bank = makeBank(rng); const stats = createItemStats(); const now = Date.UTC(2026, 9, 1);
    const Ls = levels.map((lv) => makeLearner(rng, lv)); const Ps = levels.map((lv, i) => createPlayer('p' + i, lv));
    const g = new MultiplayerGame(Ps, bank, stats, { mode: 'group', rounds: 4, cardsPerTurn: 4, rng, now });
    for (let t = 0; t < g.totalTurns; t++) {
      g.startTurn(); const i = g.activeIndex(); const s = g.sessions[i];
      for (let j = 0; j < g.cardsPerTurn; j++) { const f = g.flagsFor(j); const c = s.next(f); const r = respond(Ls[i], c, rng, now); const res = s.answer(r); g.record(c, res, f); }
      g.endTurn();
    }
    g.sessions.forEach((s) => okBand.push(mean(s.history.map((x) => (x.correct ? 1 : 0)))));
    g.stretchGot.forEach((n) => stretchOk.push(n >= g.rounds - 1));
    spread.push(Math.max(...g.scores) - Math.min(...g.scores));
  }
  const a = mean(okBand), lo = q(okBand, 0.1), hi = q(okBand, 0.9);
  console.log(`\n— group 6p mixed: per-player acc mean=${pct(a)} (p10 ${pct(lo)}, p90 ${pct(hi)}) | stretch guarantee=${pct(mean(stretchOk.map(Number)))}`);
  check('[group] mean per-player accuracy 70–90% despite A1…C1 mix', a >= 0.7 && a <= 0.9, pct(a));
  check('[group] every player gets a challenge card each turn (≤1 deferred)', mean(stretchOk.map(Number)) >= 0.99, pct(mean(stretchOk.map(Number))));
}

// T9: determinism
{
  const a = runSingle(PROFILES[1], 42), b = runSingle(PROFILES[1], 42);
  check('[determinism] same seed → identical session', JSON.stringify(a.session.history.map((h) => h.item.id)) === JSON.stringify(b.session.history.map((h) => h.item.id)), 'ok');
}

console.log(`\n=== ${results.length - failures}/${results.length} checks passed ===`);
export { results, failures };
