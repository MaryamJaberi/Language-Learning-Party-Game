/**
 * Central Card Length & Pacing Configuration
 * Tunable constants for reading speeds, length caps, timers, TTS, and telemetry.
 */

import { CEFRLevel } from './types';

export type LengthClass = 'short' | 'medium' | 'long' | 'tooLong';

/**
 * Reading rate in units/sec per CEFR level (tunable)
 */
export const CARD_READING_RATES: Record<string, number> = {
  A1: 1.2,
  A2: 1.5,
  B1: 1.8,
  B2: 2.0,
  C1: 2.3,
  C2: 2.5,
  all: 1.8
};

/**
 * Level unit caps (target baseline units)
 */
export const CARD_LEVEL_CAPS: Record<string, number> = {
  A1: 6,
  A2: 9,
  B1: 12,
  B2: 16,
  C1: 22,
  C2: 28,
  all: 12
};

/**
 * Multipliers against LEVEL_CAP to determine lengthClass:
 * short   <= 0.6 * cap
 * medium  <= 1.0 * cap
 * long    <= 1.6 * cap
 * tooLong  > 1.6 * cap
 */
export const LENGTH_CLASS_MULTIPLIERS = {
  short: 0.6,
  medium: 1.0,
  long: 1.6
} as const;

/**
 * Pacing, Timing, Display, and Telemetry parameters
 */
export const CARD_PACING_CONFIG = {
  // Turn duration below which only short/medium or long with focus are eligible
  turnSecThreshold: 15,

  // Timer bonus calculation: clamp(readSec - timerBonusMinReadSec, 0, timerBonusMaxRatio * turnSec)
  timerBonusMinReadSec: 2.0,
  timerBonusMaxRatio: 0.5,

  // Reveal banner minimum display duration in seconds
  revealBannerMinSec: 2.5,

  // Maximum readSec for automatic sentence TTS playback (if > 4s, provide play button)
  autoTtsMaxReadSec: 4.0,

  // Display constraints
  displayMaxLines: 3,
  fontScaleMinPercent: 80,

  // Telemetry review thresholds
  telemetry: {
    minPlaysForReview: 10,
    skipRateThreshold: 0.5, // > 50%
    medianTimeMultiplier: 1.5 // > 1.5 * readSec
  }
} as const;
