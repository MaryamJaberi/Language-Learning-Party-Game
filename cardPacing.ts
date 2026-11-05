/**
 * Card Length & Pacing Engine
 * Pure measurement, eligibility filtering, and fair sequencing.
 */

import { LanguageCard, Language, CEFRLevel } from './types';
import { 
  CARD_READING_RATES, 
  CARD_LEVEL_CAPS, 
  LENGTH_CLASS_MULTIPLIERS, 
  CARD_PACING_CONFIG, 
  LengthClass 
} from './cardPacingConfig';

export interface CardMeasurement {
  units: number;
  readSec: number;
  lengthClass: LengthClass;
  measuredText: string;
  measuredLang: string;
}

/**
 * Counts word-like units in text according to linguistic rules:
 * - zh / ja: graphemes / 2
 * - ko: word-like segments
 * - other (en, nl, fa, ar, hi, etc.): word-like segments via Intl.Segmenter
 */
export function countCardUnits(text: string, lang: string): number {
  if (!text || text.trim().length === 0) return 0;
  const cleanLang = (lang || 'en').toLowerCase().split('-')[0];

  try {
    if (cleanLang === 'zh' || cleanLang === 'ja') {
      const seg = new Intl.Segmenter(cleanLang, { granularity: 'grapheme' });
      const graphemes = Array.from(seg.segment(text)).filter(s => s.segment.trim().length > 0);
      return Math.max(0.5, graphemes.length / 2);
    }

    const seg = new Intl.Segmenter(cleanLang, { granularity: 'word' });
    const words = Array.from(seg.segment(text)).filter(s => s.isWordLike);
    if (words.length > 0) return words.length;
  } catch (e) {
    // Fallback if segmenter fails
  }

  const fallback = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, fallback);
}

/**
 * Returns the exact text the active player must read based on translation mode
 */
export function getCardTextToRead(card: LanguageCard, isReverse: boolean = false): { text: string; lang: string } {
  if (isReverse) {
    return {
      text: card.translation || card.targetText || '',
      lang: card.nativeLanguage || 'en'
    };
  }
  return {
    text: card.targetText || card.translation || '',
    lang: card.targetLanguage || 'en'
  };
}

/**
 * Pure measurement function for a card given a language and optional reverse setting
 */
export function measureCard(
  card: LanguageCard, 
  langOverride?: string, 
  isReverse: boolean = false
): CardMeasurement {
  const { text, lang } = getCardTextToRead(card, isReverse);
  const effectiveLang = langOverride || lang;
  const level = (card.cefrLevel || 'A1') as CEFRLevel;

  const units = countCardUnits(text, effectiveLang);
  const rate = CARD_READING_RATES[level] || CARD_READING_RATES.A1;
  const cap = CARD_LEVEL_CAPS[level] || CARD_LEVEL_CAPS.A1;

  const readSec = Number((units / rate).toFixed(2));

  let lengthClass: LengthClass = 'medium';
  if (units <= LENGTH_CLASS_MULTIPLIERS.short * cap) {
    lengthClass = 'short';
  } else if (units <= LENGTH_CLASS_MULTIPLIERS.medium * cap) {
    lengthClass = 'medium';
  } else if (units <= LENGTH_CLASS_MULTIPLIERS.long * cap) {
    lengthClass = 'long';
  } else {
    lengthClass = 'tooLong';
  }

  const measurement: CardMeasurement = {
    units,
    readSec,
    lengthClass,
    measuredText: text,
    measuredLang: effectiveLang
  };

  // Cache on the card for quick runtime lookups
  card.measured = {
    units,
    readSec,
    lengthClass
  };

  return measurement;
}

/**
 * Validates that focus phrase appears verbatim in the text
 */
export function validateFocusVerbatim(text: string, focusPhrase: string): boolean {
  if (!text || !focusPhrase) return false;
  const trimmed = focusPhrase.trim();
  if (trimmed.length === 0) return false;
  return text.includes(trimmed);
}

/**
 * Retrieves valid verbatim focus phrase for card in target or native language
 */
export function getFocusPhrase(card: LanguageCard, lang: string = card.targetLanguage): string | undefined {
  if (!card.focus) return undefined;
  const cleanLang = (lang || 'en').toLowerCase().split('-')[0];
  const candidate = card.focus[cleanLang] || card.focus[lang] || card.focus[card.targetLanguage];
  if (!candidate) return undefined;

  const isReviewed = (card as any).focusReviewed === true;
  const units = countCardUnits(candidate, lang);
  const isValidLength = units >= 2 && units <= 5;
  const targetText = card.targetText || '';
  const translation = card.translation || '';
  const isVerbatim = validateFocusVerbatim(targetText, candidate) || validateFocusVerbatim(translation, candidate);

  if (isReviewed || (isVerbatim && isValidLength)) {
    return candidate;
  }
  return undefined;
}

/**
 * Determines whether a card has a valid verbatim focus phrase
 */
export function hasValidFocus(card: LanguageCard, lang?: string): boolean {
  return !!getFocusPhrase(card, lang || card.targetLanguage);
}

/**
 * Checks eligibility of a card based on base turn duration (configured at turn start, bonus excluded)
 * and focus phrase presence.
 */
export function isCardEligible(
  card: LanguageCard, 
  baseTurnSec: number, 
  langOverride?: string, 
  isReverse: boolean = false
): boolean {
  const measurement = card.measured || measureCard(card, langOverride, isReverse);
  const hasFocus = hasValidFocus(card, langOverride || card.targetLanguage);

  // C1 long cards: eligible only when base turnSec at turn start >= 15 (bonus excluded); strictly excluded below 15s
  if (card.cefrLevel === 'C1' && (measurement.lengthClass === 'long' || measurement.lengthClass === 'tooLong')) {
    return baseTurnSec >= CARD_PACING_CONFIG.turnSecThreshold;
  }

  // tooLong without focus: never in timed play
  if (measurement.lengthClass === 'tooLong') {
    return hasFocus;
  }

  // baseTurnSec < 15: only short/medium, or long WITH focus
  if (baseTurnSec < CARD_PACING_CONFIG.turnSecThreshold) {
    if (measurement.lengthClass === 'long') {
      return hasFocus;
    }
  }

  return true;
}

/**
 * Pre-measures and filters a pool of cards for eligibility
 */
export function filterEligibleCards(
  cards: LanguageCard[], 
  turnSec: number, 
  langOverride?: string, 
  isReverse: boolean = false
): LanguageCard[] {
  return cards.filter(card => isCardEligible(card, turnSec, langOverride, isReverse));
}

/**
 * Clamps per-card bonus added to turn timer: clamp(readSec - 2, 0, 0.5 * turnSec)
 */
export function calculateTimeBonus(readSec: number, turnSec: number): number {
  const excess = readSec - CARD_PACING_CONFIG.timerBonusMinReadSec;
  const maxBonus = CARD_PACING_CONFIG.timerBonusMaxRatio * turnSec;
  const rawBonus = Math.min(Math.max(0, excess), maxBonus);
  return Math.round(rawBonus);
}

/**
 * Reveal banner display duration: max(2.5s, readSec)
 */
export function getRevealDuration(readSec: number): number {
  return Math.max(CARD_PACING_CONFIG.revealBannerMinSec, readSec);
}

/**
 * Auto-TTS rule: focus if present, else the sentence only if readSec <= 4; otherwise a play button
 */
export function shouldAutoTTS(readSec: number, hasFocus: boolean): boolean {
  if (hasFocus) return true;
  return readSec <= CARD_PACING_CONFIG.autoTtsMaxReadSec;
}

/**
 * PRNG helper (Mulberry32) for deterministic seeded card sequencing
 */
export function createSeededRandom(seed: number = 42) {
  let s = seed >>> 0;
  return function() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Sequencer: Replaces plain shuffle with pacing and fairness rules
 * 1. No two long cards in a row.
 * 2. Max 1 long per 3 cards in a turn (and rolling window).
 * 3. Pattern bias: short, short, medium/long.
 * 4. The first card of every turn is short or medium (fast start).
 * 5. Equal long-card share per team per round (fairness).
 * 6. Seeded RNG for reproducible testing.
 */
export function sequenceCards(
  cards: LanguageCard[],
  playerCount: number = 4,
  seed: number = 12345,
  cardsPerTurnEstimate: number = 4
): LanguageCard[] {
  if (!cards || cards.length === 0) return [];

  const rand = createSeededRandom(seed);
  const teamCount = Math.max(2, Math.floor(playerCount / 2));

  // Ensure all cards are measured
  cards.forEach(c => {
    if (!c.measured) measureCard(c);
  });

  const isLongCard = (c: LanguageCard) => c.measured?.lengthClass === 'long' || c.measured?.lengthClass === 'tooLong';

  // Dedupe input cards by id and targetLanguage
  const seenCardKeys = new Set<string>();
  const dedupedCards: LanguageCard[] = [];
  for (const c of cards) {
    const key = `${c.id}_${c.targetLanguage}`;
    if (!seenCardKeys.has(key)) {
      seenCardKeys.add(key);
      dedupedCards.push(c);
    }
  }

  // Partition cards into buckets
  const shortPool: LanguageCard[] = [];
  const mediumPool: LanguageCard[] = [];
  const longPool: LanguageCard[] = [];

  dedupedCards.forEach(c => {
    const lc = c.measured?.lengthClass || 'medium';
    if (lc === 'short') shortPool.push(c);
    else if (lc === 'medium') mediumPool.push(c);
    else longPool.push(c);
  });

  // Shuffle buckets deterministically with Fisher-Yates
  const shuffle = (arr: LanguageCard[]) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  };

  shuffle(shortPool);
  shuffle(mediumPool);
  shuffle(longPool);

  // If we have no long cards, return shuffled non-long pool directly
  if (longPool.length === 0) {
    const combined = [...shortPool, ...mediumPool];
    shuffle(combined);
    return combined;
  }

  // Fairness: Calculate maximum equal long cards per team per round
  // Each round has `teamCount` teams taking turns.
  const rounds = Math.max(1, Math.ceil(dedupedCards.length / (playerCount * cardsPerTurnEstimate)));
  const totalTurns = rounds * playerCount;
  
  // Total long cards available
  const availableLongs = longPool.length;
  // Each team has (playerCount / teamCount) turns per round.
  const turnsPerTeam = playerCount / teamCount;
  
  // Equal quota of long cards per team per round
  const maxPossibleLongsPerTeamRound = Math.floor(availableLongs / (teamCount * rounds));
  // At most 1 long per turn to satisfy max 1 long per 3 cards and first card not long
  const longQuotaPerTeamRound = Math.min(turnsPerTeam, maxPossibleLongsPerTeamRound);

  // Assign long card allowances per turn
  const longCardTurnAllowance = new Array(totalTurns).fill(0);
  for (let r = 0; r < rounds; r++) {
    for (let team = 0; team < teamCount; team++) {
      let longsAssigned = 0;
      // Distribute `longQuotaPerTeamRound` among this team's turns in round `r`
      for (let p = 0; p < playerCount; p++) {
        if (p % teamCount === team && longsAssigned < longQuotaPerTeamRound) {
          const turnIndex = r * playerCount + p;
          if (turnIndex < totalTurns) {
            longCardTurnAllowance[turnIndex] = 1;
            longsAssigned++;
          }
        }
      }
    }
  }

  // Now assemble the sequence turn-by-turn with pattern bias:
  // Position 0 of turn: always short or medium (non-long).
  // Following positions: short, short, medium/long, strictly respecting:
  // - no two long in a row
  // - at most 1 long per 3 cards in any turn window
  const sequenced: LanguageCard[] = [];
  let longIdx = 0;
  let shortIdx = 0;
  let medIdx = 0;

  const pullNonLong = (): LanguageCard | null => {
    // Bias: short, short, medium
    if (shortIdx < shortPool.length) {
      return shortPool[shortIdx++];
    }
    if (medIdx < mediumPool.length) {
      return mediumPool[medIdx++];
    }
    return null;
  };

  const pullLong = (): LanguageCard | null => {
    if (longIdx < longPool.length) {
      return longPool[longIdx++];
    }
    return null;
  };

  // Build sequence across turns
  for (let turn = 0; turn < totalTurns; turn++) {
    const hasLongQuota = (longCardTurnAllowance[turn] || 0) > 0;
    let turnLongsUsed = 0;

    for (let pos = 0; pos < cardsPerTurnEstimate; pos++) {
      const prev1 = sequenced.length >= 1 ? sequenced[sequenced.length - 1] : null;
      const prev2 = sequenced.length >= 2 ? sequenced[sequenced.length - 2] : null;
      
      const prev1IsLong = prev1 ? isLongCard(prev1) : false;
      const prev2IsLong = prev2 ? isLongCard(prev2) : false;

      // Position 0 is never long (fast start)
      // Position cannot be long if previous was long
      // Position cannot be long if there is already a long in the last 2 cards (max 1 long per 3 cards)
      const canBeLong = pos > 0 && 
                        hasLongQuota && 
                        turnLongsUsed === 0 && 
                        !prev1IsLong && 
                        !prev2IsLong && 
                        longIdx < longPool.length;

      // We place long card at pos 2 or pos 3 if allowed (pattern bias: short, short, medium/long)
      if (canBeLong && (pos >= 2 || (pos === 1 && rand() < 0.3))) {
        const longCard = pullLong();
        if (longCard) {
          sequenced.push(longCard);
          turnLongsUsed++;
          continue;
        }
      }

      // Otherwise pull non-long card
      const nonLongCard = pullNonLong();
      if (nonLongCard) {
        sequenced.push(nonLongCard);
      } else if (canBeLong) {
        const longCard = pullLong();
        if (longCard) {
          sequenced.push(longCard);
          turnLongsUsed++;
        }
      }
    }
  }

  // Append any leftover non-longs safely
  while (shortIdx < shortPool.length || medIdx < mediumPool.length) {
    const nonLongCard = pullNonLong();
    if (nonLongCard) {
      sequenced.push(nonLongCard);
    } else {
      break;
    }
  }

  return sequenced;
}
