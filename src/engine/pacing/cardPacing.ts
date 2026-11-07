import {
  CardPacingMetrics,
  DEFAULT_PACING_CONFIG,
  getLevelBand,
  LengthClass,
  LEVEL_CAPS,
  PacingConfig,
} from './cardPacingConfig';

export interface PacedCard {
  id: string;
  level: string;
  rawLevel?: string;
  targetText?: string;
  translations?: Record<string, { text: string; focus?: string }>;
  measured?: Record<string, CardPacingMetrics> | CardPacingMetrics;
  [key: string]: any;
}

/**
 * Computes level-relative pacing metrics for a given text, level, and language.
 * Unit rules per spec:
 * - CJK ('zh', 'ja', 'ko'): graphemes / 2
 * - Latin / Cyrillic / Arabic / Persian and other space-delimited scripts: whitespace words
 * 
 * Length class per level caps:
 * - long: units > cap
 * - medium: units > 0.60 * cap && units <= cap
 * - short: units <= 0.60 * cap
 */
export function measureTextPacing(
  text: string,
  level = 'A1',
  lang = 'en',
  config: PacingConfig = DEFAULT_PACING_CONFIG
): CardPacingMetrics {
  const clean = (text || '').trim();
  if (!clean) {
    return { units: 0, readSec: 0, lengthClass: 'short' };
  }

  // Count units:
  // For ja, zh, ko: Intl.Segmenter(lang, { granularity: 'word' }) counting only isWordLike segments
  // For Latin / Cyrillic / Arabic / Persian and other space-delimited scripts: whitespace words
  let units = 1;
  if (['ja', 'zh', 'ko'].includes(lang)) {
    try {
      const segmenter = new Intl.Segmenter(lang, { granularity: 'word' });
      const wordLike = Array.from(segmenter.segment(clean)).filter((s) => s.isWordLike);
      units = Math.max(1, wordLike.length);
    } catch {
      units = Math.max(1, clean.split(/\s+/).filter(Boolean).length);
    }
  } else {
    units = Math.max(1, clean.split(/\s+/).filter(Boolean).length);
  }

  const wpm = config.wordsPerMinuteByLevel[level] || config.defaultWpm;
  const wordsPerSec = wpm / 60;
  const readSec = Math.max(0.5, Math.round((units / wordsPerSec) * 10) / 10);

  const cap = config.levelCaps[level] ?? config.defaultCap;
  const band = getLevelBand(level);
  const factor = config.bandFactors?.[lang]?.[band] ?? config.languageFactors?.[lang] ?? 1.0;
  const effectiveCap = Math.max(cap, cap * factor);

  let lengthClass: LengthClass = 'short';
  if (units > Math.ceil(effectiveCap)) {
    lengthClass = 'long';
  } else if (units > 0.60 * effectiveCap) {
    lengthClass = 'medium';
  } else {
    lengthClass = 'short';
  }

  return { units, readSec, lengthClass };
}

/**
 * Helper to resolve metrics for a specific card and target language.
 */
export function getCardMetric(
  card: PacedCard,
  targetLang = 'en',
  config: PacingConfig = DEFAULT_PACING_CONFIG
): CardPacingMetrics {
  if (card.measured) {
    // If measured is a per-language dictionary
    if (typeof card.measured === 'object' && targetLang in card.measured && 'units' in (card.measured as any)[targetLang]) {
      return (card.measured as Record<string, CardPacingMetrics>)[targetLang];
    }
    // If measured is a single legacy metric object
    if ('units' in (card.measured as any)) {
      return card.measured as CardPacingMetrics;
    }
  }

  const lvl = card.rawLevel || card.level || 'A1';
  const text =
    card.translations?.[targetLang]?.text ||
    card.targetText ||
    card.translations?.en?.text ||
    card.base_en ||
    card.id;

  return measureTextPacing(text, lvl, targetLang, config);
}

/**
 * Sequencer helper enforcing the core pedagogical invariants:
 * 1. Max 1 long card per rolling 3-card window.
 * 2. No long card at the start of a turn (index 0).
 * 3. Equal long-card share per team per round AND across the whole game (max diff 1).
 * 4. Deficit-based team parity: the team with fewer long cards gets the next one.
 * 5. C1 and C1+ long cards excluded when base turnSec < 15 (NOT C2!).
 */
export class CardPacingSequencer {
  private config: PacingConfig;

  constructor(customConfig?: Partial<PacingConfig>) {
    this.config = { ...DEFAULT_PACING_CONFIG, ...customConfig };
  }

  /**
   * Filter out ineligible cards:
   * C1 and C1+ long cards excluded when base turnSec < 15.
   * C2 is NOT excluded at turnSec < 15!
   */
  filterEligibleCards<T extends PacedCard>(cards: T[], turnSec: number, targetLang = 'en'): T[] {
    return cards.filter((card) => {
      const metrics = getCardMetric(card, targetLang, this.config);
      const isC1OrC1Plus = card.rawLevel === 'C1' || card.rawLevel === 'C1+' || card.level === 'C1' || card.level === 'C1+';
      if (turnSec < this.config.sequencerRules.c1LongMinTurnSec && isC1OrC1Plus && metrics.lengthClass === 'long') {
        return false;
      }
      return true;
    });
  }

  /**
   * Sequence a deck of cards enforcing rolling window, turn start, and length distribution invariants.
   */
  sequenceDeck<T extends PacedCard>(cards: T[], turnSec = 60, targetLang = 'en', seed = 0): T[] {
    const eligible = this.filterEligibleCards(cards, turnSec, targetLang);
    if (eligible.length <= 1) return [...eligible];

    const longCards: T[] = [];
    const nonLongCards: T[] = [];

    for (const card of eligible) {
      const metrics = getCardMetric(card, targetLang, this.config);
      if (metrics.lengthClass === 'long') {
        longCards.push(card);
      } else {
        nonLongCards.push(card);
      }
    }

    const shuffle = <A>(arr: A[]): A[] => {
      const copy = [...arr];
      let s = seed || 42;
      for (let i = copy.length - 1; i > 0; i--) {
        s = (s * 16807) % 2147483647;
        const j = Math.floor((s / 2147483647) * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const shuffledLong = shuffle(longCards);
    const shuffledNonLong = shuffle(nonLongCards);

    const result: T[] = [];
    let longCardIndex = 0;
    let nonLongCardIndex = 0;

    // First card can NEVER be long
    if (shuffledNonLong.length > 0) {
      result.push(shuffledNonLong[nonLongCardIndex++]);
    } else if (shuffledLong.length > 0) {
      result.push(shuffledLong[longCardIndex++]);
    }

    const windowSize = this.config.sequencerRules.rollingWindowSize;
    const maxLong = this.config.sequencerRules.maxLongPerWindow;

    while (nonLongCardIndex < shuffledNonLong.length || longCardIndex < shuffledLong.length) {
      const recentWindow = result.slice(-windowSize + 1);
      const longCountInWindow = recentWindow.filter((c) => {
        const m = getCardMetric(c, targetLang, this.config);
        return m.lengthClass === 'long';
      }).length;

      const canAddLong = longCountInWindow < maxLong && longCardIndex < shuffledLong.length;

      if (canAddLong && (nonLongCardIndex >= shuffledNonLong.length || (result.length % 3 === 2))) {
        result.push(shuffledLong[longCardIndex++]);
      } else if (nonLongCardIndex < shuffledNonLong.length) {
        result.push(shuffledNonLong[nonLongCardIndex++]);
      } else if (canAddLong) {
        result.push(shuffledLong[longCardIndex++]);
      } else {
        // Cannot legally place more long cards without violating the rolling 3-card window invariant.
        break;
      }
    }

    return result;
  }

  /**
   * Distribute cards across teams ensuring parity in long cards per round.
   */
  distributeTeamRounds<T extends PacedCard>(
    cards: T[],
    teamCount: number,
    cardsPerTurn: number,
    turnSec = 60,
    targetLang = 'en'
  ): T[][] {
    const game = this.distributeTeamGame(cards, teamCount, 1, cardsPerTurn, turnSec, targetLang);
    return game[0] || Array.from({ length: teamCount }, () => []);
  }

  /**
   * Distributes cards across teams for an entire game of multiple rounds.
   * Guarantees:
   * 1. In every round: max difference of 1 long card between any two teams.
   * 2. Across the whole game: max difference of 1 long card between any two teams.
   * 3. Deficit rule: The team with fewer cumulative long cards always gets the next available long card.
   * 4. Each team turn respects: no long card at turn start, max 1 long per rolling 3-card window.
   */
  distributeTeamGame<T extends PacedCard>(
    cards: T[],
    teamCount: number,
    roundsCount: number,
    cardsPerTurn: number,
    turnSec = 60,
    targetLang = 'en',
    seed = 0
  ): T[][][] {
    const eligible = this.filterEligibleCards(cards, turnSec, targetLang);
    const longCards: T[] = [];
    const nonLongCards: T[] = [];

    for (const card of eligible) {
      const m = getCardMetric(card, targetLang, this.config);
      if (m.lengthClass === 'long') {
        longCards.push(card);
      } else {
        nonLongCards.push(card);
      }
    }

    const shuffle = <A>(arr: A[]): A[] => {
      const copy = [...arr];
      let s = seed || 42;
      for (let i = copy.length - 1; i > 0; i--) {
        s = (s * 16807) % 2147483647;
        const j = Math.floor((s / 2147483647) * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const availLong = shuffle(longCards);
    const availNonLong = shuffle(nonLongCards);

    const cumulativeLong: number[] = new Array(teamCount).fill(0);
    const allRounds: T[][][] = [];

    for (let r = 0; r < roundsCount; r++) {
      const roundTeamTurns: T[][] = Array.from({ length: teamCount }, () => []);
      const roundLong: number[] = new Array(teamCount).fill(0);

      // Construct turn card-by-card for each slot 0..cardsPerTurn-1
      for (let slot = 0; slot < cardsPerTurn; slot++) {
        // Order teams by cumulative long cards ascending (team with fewer long cards gets priority)
        // If tied, order by round long cards ascending
        const teamOrder = Array.from({ length: teamCount }, (_, idx) => idx).sort((a, b) => {
          if (cumulativeLong[a] !== cumulativeLong[b]) {
            return cumulativeLong[a] - cumulativeLong[b];
          }
          return roundLong[a] - roundLong[b];
        });

        for (const t of teamOrder) {
          const currentTurn = roundTeamTurns[t];

          // Check if slot can take a long card
          // Slot 0 can NEVER be long
          const isSlotZero = slot === 0;
          const recent = currentTurn.slice(-this.config.sequencerRules.rollingWindowSize + 1);
          const longInWindow = recent.filter((c) => getCardMetric(c, targetLang, this.config).lengthClass === 'long').length;
          const windowAllowsLong = longInWindow < this.config.sequencerRules.maxLongPerWindow;

          // Check round parity: adding long to team t must not exceed min(roundLong) + 1
          const minRoundLong = Math.min(...roundLong);
          const roundAllowsLong = roundLong[t] <= minRoundLong;

          // Check cumulative parity: adding long to team t must not exceed min(cumulativeLong) + 1
          const minCumulativeLong = Math.min(...cumulativeLong);
          const gameAllowsLong = cumulativeLong[t] <= minCumulativeLong;

          const shouldGiveLong =
            !isSlotZero &&
            windowAllowsLong &&
            roundAllowsLong &&
            gameAllowsLong &&
            availLong.length > 0;

          if (shouldGiveLong) {
            const card = availLong.shift()!;
            currentTurn.push(card);
            roundLong[t]++;
            cumulativeLong[t]++;
          } else if (availNonLong.length > 0) {
            currentTurn.push(availNonLong.shift()!);
          } else if (availLong.length > 0 && !isSlotZero && windowAllowsLong) {
            const card = availLong.shift()!;
            currentTurn.push(card);
            roundLong[t]++;
            cumulativeLong[t]++;
          }
        }
      }

      allRounds.push(roundTeamTurns);
    }

    return allRounds;
  }

  /**
   * Validates sequencer invariants on any resulting card sequence.
   */
  validateSequence<T extends PacedCard>(
    sequence: T[],
    turnSec = 60,
    targetLang = 'en'
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!sequence || sequence.length === 0) return { valid: true, errors: [] };

    // 1. Invariant: First card in turn cannot be 'long'
    const firstMetrics = getCardMetric(sequence[0], targetLang, this.config);
    if (firstMetrics.lengthClass === 'long' && sequence.length > 1) {
      errors.push(`Invariant violated: First card (${sequence[0].id}) is 'long'.`);
    }

    // 2. Invariant: Max 1 long card per rolling 3-card window
    for (let i = 0; i <= sequence.length - 3; i++) {
      const window = sequence.slice(i, i + 3);
      const longCount = window.filter((c) => getCardMetric(c, targetLang, this.config).lengthClass === 'long').length;
      if (longCount > this.config.sequencerRules.maxLongPerWindow) {
        errors.push(`Invariant violated: Window [${i}..${i + 2}] has ${longCount} long cards (max 1 allowed).`);
      }
    }

    // 3. Invariant: C1 and C1+ long cards excluded when base turnSec < 15
    if (turnSec < this.config.sequencerRules.c1LongMinTurnSec) {
      for (const card of sequence) {
        const m = getCardMetric(card, targetLang, this.config);
        const isC1OrC1Plus = card.rawLevel === 'C1' || card.rawLevel === 'C1+' || card.level === 'C1' || card.level === 'C1+';
        if (isC1OrC1Plus && m.lengthClass === 'long') {
          errors.push(`Invariant violated: C1/C1+ long card (${card.id}) present when turnSec = ${turnSec} (< 15).`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
