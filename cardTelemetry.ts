/**
 * Local & Admin-Only Card Telemetry
 * Tracks per-card answer durations, skips, and identifies cards needing editorial review.
 * No personal data is stored.
 */

import { CARD_PACING_CONFIG } from './cardPacingConfig';

export interface CardTelemetryRecord {
  cardId: string;
  totalPlays: number;
  skipCount: number;
  skipRate: number; // 0.0 to 1.0
  answerTimes: number[]; // seconds
  medianTime: number; // seconds
  readSec: number;
  needsReview: boolean;
  lastPlayedAt: string;
}

const STORAGE_KEY = 'dor_card_telemetry';

function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

export function getAllCardTelemetry(): Record<string, CardTelemetryRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore parse error
  }
  return {};
}

/**
 * Record a telemetry event for a card play
 */
export function recordCardTelemetry(
  cardId: string,
  timeToAnswer: number,
  skipped: boolean,
  readSec: number
): CardTelemetryRecord {
  const all = getAllCardTelemetry();
  const existing = all[cardId] || {
    cardId,
    totalPlays: 0,
    skipCount: 0,
    skipRate: 0,
    answerTimes: [],
    medianTime: 0,
    readSec: readSec || 2.0,
    needsReview: false,
    lastPlayedAt: new Date().toISOString()
  };

  existing.totalPlays += 1;
  if (skipped) {
    existing.skipCount += 1;
  } else if (timeToAnswer > 0) {
    // Keep max 50 recent answer times per card
    existing.answerTimes.push(Number(timeToAnswer.toFixed(2)));
    if (existing.answerTimes.length > 50) {
      existing.answerTimes = existing.answerTimes.slice(-50);
    }
  }

  existing.skipRate = existing.totalPlays > 0 ? Number((existing.skipCount / existing.totalPlays).toFixed(3)) : 0;
  existing.medianTime = Number(calculateMedian(existing.answerTimes).toFixed(2));
  existing.readSec = readSec > 0 ? readSec : existing.readSec;
  existing.lastPlayedAt = new Date().toISOString();

  // Flag needsReview when skipRate > 50% over >= 10 plays or median time > 1.5 * readSec
  const minPlays = CARD_PACING_CONFIG.telemetry.minPlaysForReview;
  const skipThreshold = CARD_PACING_CONFIG.telemetry.skipRateThreshold;
  const timeMultiplier = CARD_PACING_CONFIG.telemetry.medianTimeMultiplier;

  existing.needsReview = 
    existing.totalPlays >= minPlays && 
    (existing.skipRate > skipThreshold || existing.medianTime > timeMultiplier * existing.readSec);

  all[cardId] = existing;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.warn('Failed to save card telemetry:', e);
  }

  return existing;
}

/**
 * Get sorted admin list of cards needing review or sorted by skip rate
 */
export function getAdminCardReviewList(): CardTelemetryRecord[] {
  const all = getAllCardTelemetry();
  return Object.values(all).sort((a, b) => b.skipRate - a.skipRate || b.totalPlays - a.totalPlays);
}

/**
 * Reset local telemetry data
 */
export function clearCardTelemetry(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // ignore
  }
}
