// src/engine/adaptive/dor-adaptive-engine.ts — TypeScript implementation of the "Mastery Proximity" adaptive engine
// for «دور: زبان». Pure TypeScript/JS, no external runtime dependencies, deterministic when given a seeded rng.
// Science basis: IRT/Elo ability-difficulty model (as in Duolingo Birdbrain),
// 85% rule (Wilson et al., 2019), FSRS power-law forgetting curve, peak-end rule.

export type CEFR = 
  | 'A0' 
  | 'A0+' 
  | 'A1' 
  | 'A1+' 
  | 'A2' 
  | 'A2+' 
  | 'B1' 
  | 'B1+' 
  | 'B2' 
  | 'B2+' 
  | 'C1' 
  | 'C1+' 
  | 'C2';
export type ExerciseType = 'choice2' | 'recognize' | 'translate' | 'produce';
export type CardBucket = 'new' | 'due' | 'learned' | 'requeue' | 'consolidate';
export type EngineMode = 'normal' | 'easier' | 'harder' | 'rescue';
export type CardIndicator = 'review' | 'challenge' | 'balanced';

export const CEFR_B: Record<CEFR, number> = {
  A0: -2.25,
  'A0+': -1.85,
  A1: -1.5,
  'A1+': -1.15,
  A2: -0.75,
  'A2+': -0.35,
  B1: 0,
  'B1+': 0.35,
  B2: 0.75,
  'B2+': 1.15,
  C1: 1.5,
  'C1+': 1.85,
  C2: 2.25
};

export const CEFR_ORDER: CEFR[] = [
  'A0', 'A0+', 'A1', 'A1+', 'A2', 'A2+', 'B1', 'B1+', 'B2', 'B2+', 'C1', 'C1+', 'C2'
];

export const TYPE_OFFSET: Record<ExerciseType, number> = {
  choice2: -1.2,
  recognize: 0,
  translate: 0.5,
  produce: 1.0
};
// choice2 = picture + 2 options (A1 scaffold); recognize = 4-option MC; translate = type/say the translation; produce = use it in a sentence / explain it

export interface AdaptiveEngineOptions {
  targetP?: number;
  band?: [number, number];
  easierTarget?: number;
  harderTarget?: number;
  rescueTarget?: number;
  finaleTarget?: number;
  window?: number;
  failStreakEasier?: number;
  failStreakRescue?: number;
  successStreakHarder?: number;
  easierCards?: number;
  harderCards?: number;
  slowFactor?: number;
  slowCredit?: number;
  hintCredit?: number;
  hintBonus?: number;
  kThetaMax?: number;
  kThetaMin?: number;
  kThetaDecay?: number;
  kB?: number;
  requeueGap?: [number, number];
  desiredRetention?: number;
  topK?: number;
  fatigueRatio?: number;
  allowTypes?: ExerciseType[];
  consolidateGap?: number;
  placementCards?: number;
  placementTarget?: number;
  rng?: () => number;
  now?: number;
  level?: CEFR;
  autoLevel?: boolean;
}

export const DEFAULTS: Required<Omit<AdaptiveEngineOptions, 'rng' | 'now' | 'level' | 'autoLevel'>> = {
  targetP: 0.80,          // desired predicted success (85% rule, slightly lower for productive tasks)
  band: [0.70, 0.90],     // "flow band"
  easierTarget: 0.92,
  harderTarget: 0.68,
  rescueTarget: 0.96,
  finaleTarget: 0.93,     // peak-end: last card of a turn/session
  window: 6,
  failStreakEasier: 2,
  failStreakRescue: 3,
  successStreakHarder: 4,
  easierCards: 2,
  harderCards: 3,
  slowFactor: 1.6,        // answer slower than 1.6× personal median = weak recall
  slowCredit: 0.75,
  hintCredit: 0.5,
  hintBonus: 0.7,         // logit reduction of difficulty when a hint is shown
  kThetaMax: 0.9,
  kThetaMin: 0.12,
  kThetaDecay: 0.15,      // big steps first (placement), then stable
  kB: 0.03,
  requeueGap: [3, 5],
  desiredRetention: 0.9,
  topK: 4,                // randomness: choose among top-K candidates
  fatigueRatio: 1.45,
  allowTypes: ['choice2', 'recognize', 'translate', 'produce'],
  consolidateGap: 3,      // finale/rescue may reuse an item answered correctly ≥3 cards ago
  placementCards: 8,      // new player: first cards aim at p≈0.6 (max information, CAT-style)
  placementTarget: 0.6,
};

const sig = (x: number): number => 1 / (1 + Math.exp(-x));
const clamp = (x: number, a: number, b: number): number => Math.max(a, Math.min(b, x));
export const DAY = 86400000;

// FSRS-4.5 power-law forgetting curve: R(t,S) = (1 + F*t/S)^C, with R(S,S)=0.9
const F = 19 / 81;
const C = -0.5;

export function retrievability(elapsedMs: number, S: number): number {
  if (!S) return 0;
  return Math.pow(1 + F * (elapsedMs / DAY) / S, C);
}

export function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Adaptive Data Models ----------

export interface AdaptiveItem {
  id: string;
  cefr: CEFR;
  bOffset?: number;
  prompt?: string;
  targetText?: string;
  translation?: string;
  topic?: string;
  options?: string[];
  [key: string]: any;
}

export interface PlayerMemoryItem {
  S: number;
  reps: number;
  lapses: number;
  last: number;
}

export interface AdaptivePlayer {
  id: string;
  theta: number;
  n: number;
  declaredLevel: CEFR;
  mem: Record<string, PlayerMemoryItem>;
  medianMs: number | null;
  rtSamples: number[];
}

export type ItemStats = Record<string, { bAdj: number; n: number }>;

export function createPlayer(id: string, declaredLevel: CEFR = 'A1'): AdaptivePlayer {
  return {
    id,
    theta: CEFR_B[declaredLevel],
    n: 0,
    declaredLevel,
    mem: {},
    medianMs: null,
    rtSamples: [],
  };
}

export function createItemStats(): ItemStats {
  return {};
}

function itemB(item: AdaptiveItem, stats: ItemStats): number {
  const s = stats[item.id];
  return CEFR_B[item.cefr] + (item.bOffset || 0) + (s ? s.bAdj : 0);
}

export function predict(
  player: AdaptivePlayer,
  item: AdaptiveItem,
  type: ExerciseType,
  stats: ItemStats,
  now: number,
  options: { hint?: boolean } = {}
): number {
  const b = itemB(item, stats) + TYPE_OFFSET[type] - (options.hint ? DEFAULTS.hintBonus : 0);
  const pAbility = sig(player.theta - b);
  const m = player.mem[item.id];
  let pMem = 0;
  if (m && m.S) {
    const strength = Math.min(1, m.reps / 3);
    pMem = retrievability(now - m.last, m.S) * strength * (1 - TYPE_OFFSET[type] * 0.2);
  }
  return 1 - (1 - pAbility) * (1 - pMem);
}

export interface CardNextFlags {
  finale?: boolean;
  stretch?: boolean;
  freeHint?: boolean;
  types?: ExerciseType[];
}

export interface SelectedAdaptiveCard {
  item: AdaptiveItem;
  type: ExerciseType;
  pPred: number;
  bucket: CardBucket;
  hint: boolean;
  target: number;
  mode: EngineMode;
  indicator: CardIndicator;
  idx: number;
}

export interface AnswerPayload {
  correct: boolean;
  ms?: number;
  hintUsed?: boolean;
}

export interface AnswerResult {
  credit: number;
  mode: EngineMode;
  rollingAcc: number;
  fatigue: boolean;
  message: string | null;
}

export interface CardHistoryEntry extends SelectedAdaptiveCard {
  correct: boolean;
  credit: number;
  ms?: number;
}

// ---------- Session (one player, one sitting / one turn sequence) ----------
export class Session {
  p: AdaptivePlayer;
  bank: AdaptiveItem[];
  stats: ItemStats;
  o: Required<Omit<AdaptiveEngineOptions, 'rng' | 'now' | 'level' | 'autoLevel'>> & AdaptiveEngineOptions;
  rng: () => number;
  now: number;
  shown: Set<string>;
  requeue: Array<{ item: AdaptiveItem; at: number }>;
  history: CardHistoryEntry[];
  mode: EngineMode;
  modeLeft: number;
  failStreak: number;
  successStreak: number;
  cardIdx: number;
  events: Array<{ type: string; card: number; [key: string]: any }>;
  declaredIdx: number;
  autoLevel: boolean;
  levels: CEFR[];
  suggested?: boolean;
  consolidated?: Set<string>;
  pending: SelectedAdaptiveCard | null = null;

  constructor(
    player: AdaptivePlayer,
    bank: AdaptiveItem[],
    stats: ItemStats,
    opts: AdaptiveEngineOptions = {}
  ) {
    this.p = player;
    this.bank = bank;
    this.stats = stats;
    this.o = { ...DEFAULTS, ...opts };
    this.rng = opts.rng || Math.random;
    this.now = opts.now || Date.now();
    this.shown = new Set<string>();
    this.requeue = [];
    this.history = [];
    this.mode = 'normal';
    this.modeLeft = 0;
    this.failStreak = 0;
    this.successStreak = 0;
    this.cardIdx = 0;
    this.events = [];
    this.declaredIdx = CEFR_ORDER.indexOf(opts.level || player.declaredLevel);
    this.autoLevel = opts.autoLevel !== false;
    this.levels = [];
    this.updateLevels();
  }

  // Card pool = declared level ±1, widened toward the *estimated* level (θ̂) so mis-declared players are not stuck.
  updateLevels(): void {
    const est = CEFR_ORDER.reduce(
      (best, lv, i) =>
        Math.abs(CEFR_B[lv] - this.p.theta) < Math.abs(CEFR_B[CEFR_ORDER[best]] - this.p.theta) ? i : best,
      0
    );
    const lo = this.autoLevel ? Math.min(this.declaredIdx, est) : this.declaredIdx;
    const hi = this.autoLevel ? Math.max(this.declaredIdx, est) : this.declaredIdx;
    this.levels = CEFR_ORDER.slice(Math.max(0, lo - 1), Math.min(CEFR_ORDER.length, hi + 2));
    if (Math.abs(est - this.declaredIdx) >= 2 && this.p.n >= 15 && !this.suggested) {
      this.suggested = true;
      this.log('level_suggestion', {
        declared: CEFR_ORDER[this.declaredIdx],
        estimated: CEFR_ORDER[est]
      });
    }
  }

  log(type: string, data: Record<string, any> = {}): void {
    this.events.push({ type, card: this.cardIdx, ...data });
  }

  currentTarget(flags: CardNextFlags): number {
    const o = this.o;
    if (flags.finale) return o.finaleTarget;
    if (this.mode === 'rescue') return o.rescueTarget;
    const r = this.history.slice(-5);
    const acing = this.p.n < 20 && r.length === 5 && r.every((h) => h.credit === 1); // still too easy → keep probing
    if ((this.p.n < o.placementCards || acing) && this.mode === 'normal') return o.placementTarget;
    if (flags.stretch) return o.harderTarget;
    if (this.mode === 'easier') return o.easierTarget;
    if (this.mode === 'harder') return o.harderTarget;
    return o.targetP;
  }

  next(flags: CardNextFlags = {}): SelectedAdaptiveCard | null {
    const o = this.o;
    const now = this.now;
    this.updateLevels();
    const target = this.currentTarget(flags);
    const hint = this.mode === 'easier' || this.mode === 'rescue' || !!flags.freeHint;

    // 1) due re-queue (failed earlier in this session)
    const rq = this.requeue.findIndex((r) => this.cardIdx >= r.at);
    let cands: Array<{ item: AdaptiveItem; bucket: CardBucket }> = [];

    if (rq >= 0 && this.mode !== 'harder' && !flags.stretch) {
      const r = this.requeue.splice(rq, 1)[0];
      cands = [{ item: r.item, bucket: 'requeue' }];
    } else {
      for (const item of this.bank) {
        if (!this.levels.includes(item.cefr) || this.shown.has(item.id)) continue;
        const m = this.p.mem[item.id];
        let bucket: CardBucket = 'new';
        if (m && m.S) {
          bucket = retrievability(now - m.last, m.S) < o.desiredRetention ? 'due' : 'learned';
        }
        cands.push({ item, bucket });
      }

      // finale / rescue: retrieval practice on something already answered correctly this session (certain win)
      if (flags.finale || this.mode === 'rescue') {
        const safe = this.history.filter(
          (h) => h.credit === 1 && this.cardIdx - h.idx >= o.consolidateGap && !this.consolidated?.has(h.item.id)
        );
        if (safe.length) {
          cands = safe.map((h) => ({ item: h.item, bucket: 'consolidate' }));
        }
      }
    }

    if (!cands.length) return null;

    const allowed = flags.types || o.allowTypes;
    const scored = cands
      .map(({ item, bucket }) => {
        let best: { t: ExerciseType; p: number; d: number } | null = null;
        for (const t of allowed) {
          const p = predict(this.p, item, t, this.stats, now, { hint });
          const d = Math.abs(p - target);
          if (!best || d < best.d) best = { t, p, d };
        }
        let score = -best!.d * 10;
        if (bucket === 'due') score += 0.6;
        if (bucket === 'requeue') score += 5;
        if (bucket === 'consolidate') score += 1;
        if (bucket === 'learned') score -= 0.4; // not due yet: low value
        score += this.rng() * 0.3; // keeps the "random card" feel
        return { item, bucket, type: best!.t, p: best!.p, score };
      })
      .sort((a, b) => b.score - a.score);

    const pick = scored[Math.floor(this.rng() * Math.min(o.topK, scored.length))];
    this.shown.add(pick.item.id);
    if (pick.bucket === 'consolidate') {
      (this.consolidated ||= new Set<string>()).add(pick.item.id);
    }

    const card: SelectedAdaptiveCard = {
      item: pick.item,
      type: pick.type,
      pPred: pick.p,
      bucket: pick.bucket,
      hint,
      target,
      mode: this.mode,
      indicator: indicatorFor(pick, this.mode, target),
      idx: this.cardIdx
    };

    this.pending = card;
    return card;
  }

  answer({ correct, ms, hintUsed }: AnswerPayload): AnswerResult {
    const o = this.o;
    const card = this.pending;
    const p = this.p;
    const now = this.now;

    if (!card) throw new Error('answer() without next()');
    this.pending = null;

    // ---- credit (partial for slow / hinted answers) ----
    let credit = correct ? 1 : 0;
    const med = p.medianMs;
    const slow = correct && med && ms !== undefined && ms > med * o.slowFactor;
    if (slow) credit = o.slowCredit;
    if (correct && (hintUsed ?? card.hint)) credit = Math.min(credit, o.hintCredit + 0.3);

    // ---- ability & difficulty update (Elo / 1PL-IRT) ----
    const err = credit - card.pPred;
    const k = Math.max(o.kThetaMin, o.kThetaMax / (1 + o.kThetaDecay * p.n));
    const memShare = card.bucket === 'new' ? 1 : 0.4;
    p.theta += k * err * memShare;
    p.n++;

    const st = this.stats[card.item.id] || (this.stats[card.item.id] = { bAdj: 0, n: 0 });
    st.bAdj = clamp(st.bAdj - o.kB * err, -1.5, 1.5);
    st.n++;

    // ---- memory (FSRS-lite) ----
    const m = p.mem[card.item.id] || (p.mem[card.item.id] = { S: 0, reps: 0, lapses: 0, last: now });
    const R = m.S ? retrievability(now - m.last, m.S) : 0;

    if (credit >= 0.6) {
      const grade = credit === 1 && !slow ? (med && ms !== undefined && ms < med * 0.6 ? 'easy' : 'good') : 'hard';
      const S0 = { easy: 4, good: 2, hard: 0.8 }[grade];
      m.S = m.S
        ? m.S *
            (1 +
              Math.exp(0.9) *
                Math.pow(m.S, -0.15) *
                (Math.exp((1 - R) * 1.1) - 1) *
                (grade === 'hard' ? 0.5 : grade === 'easy' ? 1.3 : 1)) +
          0.1
        : S0;
      m.reps++;
    } else {
      m.lapses++;
      m.S = m.S ? Math.max(0.2, m.S * 0.35) : 0.2;
      m.reps = Math.max(0, m.reps - 1);
      const [a, b] = o.requeueGap;
      this.requeue.push({
        item: card.item,
        at: this.cardIdx + a + Math.floor(this.rng() * (b - a + 1))
      });
    }
    m.last = now;

    // ---- response-time baseline ----
    if (correct && ms !== undefined) {
      p.rtSamples.push(ms);
      if (p.rtSamples.length > 30) p.rtSamples.shift();
      const s = [...p.rtSamples].sort((a, b) => a - b);
      p.medianMs = s[Math.floor(s.length / 2)];
    }

    // ---- streaks & rule branches ----
    if (credit >= 0.6) {
      this.successStreak++;
      this.failStreak = 0;
    } else {
      this.failStreak++;
      this.successStreak = 0;
    }

    this.history.push({ ...card, correct, credit, ms });
    const recent = this.history.slice(-o.window);
    const acc = recent.reduce((s, h) => s + h.credit, 0) / recent.length;
    const prevMode = this.mode;

    if (this.modeLeft > 0) {
      this.modeLeft--;
      if (this.modeLeft === 0) this.mode = 'normal';
    }

    if (this.failStreak >= o.failStreakRescue) {
      this.mode = 'rescue';
      this.modeLeft = 1;
    } else if (this.failStreak >= o.failStreakEasier || (recent.length >= o.window && acc < 0.55)) {
      this.mode = 'easier';
      this.modeLeft = o.easierCards;
    } else if (this.successStreak >= o.successStreakHarder && acc >= 0.9 && !slow) {
      this.mode = 'harder';
      this.modeLeft = o.harderCards;
      this.successStreak = 0;
    }

    if (this.mode !== prevMode) {
      this.log('mode_change', { from: prevMode, to: this.mode });
    }

    // ---- fatigue ----
    const last5 = this.history.slice(-5).filter((h) => h.ms !== undefined);
    let fatigue = false;
    if (this.history.length >= 12 && last5.length === 5 && med) {
      const avg = last5.reduce((s, h) => s + (h.ms || 0), 0) / 5;
      fatigue = avg > med * o.fatigueRatio;
      if (fatigue) this.log('fatigue');
    }

    this.cardIdx++;
    return {
      credit,
      mode: this.mode,
      rollingAcc: acc,
      fatigue,
      message: messageFor(prevMode, this.mode)
    };
  }

  summary() {
    const h = this.history;
    return {
      cards: h.length,
      accuracy: h.filter((x) => x.correct).length / (h.length || 1),
      newItems: h.filter((x) => x.bucket === 'new').length,
      reviews: h.filter((x) => x.bucket !== 'new').length,
      theta: this.p.theta,
      events: this.events
    };
  }
}

export function indicatorFor(
  pick: { bucket: CardBucket; p: number },
  mode: EngineMode,
  target: number
): CardIndicator {
  if (
    mode === 'rescue' ||
    pick.bucket === 'requeue' ||
    pick.bucket === 'consolidate' ||
    pick.bucket === 'due' ||
    pick.p >= 0.9
  ) {
    return 'review'; // 🌱
  }
  if (mode === 'harder' || target <= 0.7 || pick.p < 0.72) {
    return 'challenge'; // 🔥
  }
  return 'balanced'; // ⚖️
}

export function messageFor(from: EngineMode, to: EngineMode): string | null {
  if (from === to) return null;
  const messages: Record<EngineMode, string | null> = {
    easier: 'این چند کارت سخت بود؛ دو کارت با راهنما می‌آید.',
    rescue: 'یک نفس بگیر — یک کارت آشنا برایت گذاشتیم.',
    harder: 'عالی پیش می‌روی! سه کارت چالشی 🔥 با امتیاز بیشتر.',
    normal: null
  };
  return messages[to] || null;
}

// ---------- Scoring ----------
// Fair mode: points scale with predicted difficulty so expected points are equal for all skill levels.
export function scoreCard(credit: number, pPred: number, fair: boolean = true): number {
  if (!fair) return Math.round(10 * credit);
  return Math.round(10 * credit * (2 - pPred) * (1 / (DEFAULTS.targetP * (2 - DEFAULTS.targetP))) * 0.96);
}

// ---------- Pair & Group Controllers ----------

export interface MultiplayerGameOptions {
  mode?: 'pair' | 'group';
  cardsPerTurn?: number;
  rounds?: number;
  fair?: boolean;
  rng?: () => number;
  now?: number;
  level?: Record<string, CEFR>;
}

export class MultiplayerGame {
  mode: 'pair' | 'group';
  fair: boolean;
  rng: () => number;
  cardsPerTurn: number;
  rounds: number;
  sessions: Session[];
  scores: number[];
  stretchGot: number[];
  freeHints: number[];
  owedStretch: number[];
  turnStretch: number;
  turn: number;
  events: Array<{ type: string; [key: string]: any }>;
  groupState: 'normal' | 'party_boost' | 'wildcard' = 'normal';

  constructor(
    players: AdaptivePlayer[],
    bank: AdaptiveItem[],
    stats: ItemStats,
    options: MultiplayerGameOptions = {}
  ) {
    this.mode = options.mode || 'group';
    this.fair = options.fair !== false;
    this.rng = options.rng || Math.random;
    this.cardsPerTurn = options.cardsPerTurn || 4;
    this.rounds = options.rounds || 5;
    const now = options.now || Date.now();
    this.sessions = players.map(
      (p) => new Session(p, bank, stats, { rng: this.rng, now, level: options.level?.[p.id] })
    );
    this.scores = players.map(() => 0);
    this.stretchGot = players.map(() => 0);
    this.freeHints = players.map(() => 0);
    this.owedStretch = players.map(() => 0);
    this.turnStretch = 0;
    this.turn = 0;
    this.events = [];
  }

  get totalTurns(): number {
    return this.rounds * this.sessions.length;
  }

  activeIndex(): number {
    return this.turn % this.sessions.length;
  }

  // returns the card sequence plan flags for card j of the active player's turn
  flagsFor(j: number): CardNextFlags {
    const i = this.activeIndex();
    const s = this.sessions[i];
    const flags: CardNextFlags = {};

    if (j === this.cardsPerTurn - 1) {
      flags.finale = true; // end turn on a win
    }

    // ≥1 challenge per turn; if the player is in easier/rescue mode at that slot it is owed to a later card/turn
    const wantStretch =
      j === this.cardsPerTurn - 2 ||
      (this.owedStretch[i] > 0 && j < this.cardsPerTurn - 1 && this.turnStretch === 0);
    const modeOk =
      s.mode === 'normal' || s.mode === 'harder' || (s.mode === 'easier' && this.owedStretch[i] > 0);

    if (wantStretch && this.turnStretch === 0 && modeOk) {
      flags.stretch = true; // never during rescue
    }

    if (this.freeHints[i] > 0 && j === 0) {
      flags.freeHint = true;
      this.freeHints[i]--;
    }

    return flags;
  }

  startTurn(): { player: number; groupState: 'normal' | 'party_boost' | 'wildcard' } {
    // catch-up (rubber banding, Mario-Kart style): lowest score gets one free hint per cycle
    if (this.mode === 'group' && this.activeIndex() === 0 && this.turn > 0) {
      const min = Math.min(...this.scores);
      const i = this.scores.indexOf(min);
      this.freeHints[i]++;
      this.events.push({ type: 'catch_up_hint', player: i, turn: this.turn });
    }

    const accs = this.sessions.map((s) => {
      const r = s.history.slice(-6);
      return r.length ? r.reduce((a, h) => a + h.credit, 0) / r.length : 0.8;
    });

    const sorted = [...accs].sort((a, b) => a - b);
    const med = sorted[Math.floor(sorted.length / 2)];
    this.groupState = med < 0.6 ? 'party_boost' : med > 0.92 ? 'wildcard' : 'normal';

    if (this.groupState !== 'normal') {
      this.events.push({ type: this.groupState, turn: this.turn });
    }

    return { player: this.activeIndex(), groupState: this.groupState };
  }

  record(card: SelectedAdaptiveCard, res: AnswerResult, flags: CardNextFlags): void {
    const i = this.activeIndex();
    const mult = this.groupState === 'party_boost' ? 1.5 : 1;
    this.scores[i] += Math.round(scoreCard(res.credit, card.pPred, this.fair) * mult);
    if (flags.stretch || card.indicator === 'challenge') {
      this.stretchGot[i]++;
      this.turnStretch++;
    }
  }

  endTurn(): void {
    const i = this.activeIndex();
    if (this.turnStretch === 0) {
      this.owedStretch[i]++;
    } else {
      this.owedStretch[i] = Math.max(0, this.owedStretch[i] - 1);
    }
    this.turnStretch = 0;
    this.turn++;
  }

  winner(): number {
    const m = Math.max(...this.scores);
    return this.scores.indexOf(m);
  }
}
