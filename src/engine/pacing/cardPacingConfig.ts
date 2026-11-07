export type LengthClass = 'short' | 'medium' | 'long';
export type LevelBand = 'A' | 'B' | 'C';

export function getLevelBand(level: string): LevelBand {
  const l = (level || 'A1').trim();
  if (['A0', 'A0+', 'A1', 'A1+', 'A2', 'A2+', 'A2-B1'].includes(l)) return 'A';
  if (['B1', 'B1+', 'B2', 'B2+'].includes(l)) return 'B';
  if (['C1', 'C1+', 'C2'].includes(l)) return 'C';
  return 'A';
}

export interface CardPacingMetrics {
  units: number;
  readSec: number;
  lengthClass: LengthClass;
}

export interface PacingConfig {
  wordsPerMinuteByLevel: Record<string, number>;
  defaultWpm: number;
  levelCaps: Record<string, number>;
  languageFactors?: Record<string, number>;
  bandFactors?: Record<string, Record<LevelBand, number>>;
  defaultCap: number;
  sequencerRules: {
    maxLongPerWindow: number;
    rollingWindowSize: number;
    noLongAtTurnStart: boolean;
    c1LongMinTurnSec: number;
    enforceTeamParity: boolean;
  };
}

export const LEVEL_CAPS: Record<string, number> = {
  A0: 4,
  'A0+': 5.0,
  A1: 6,
  'A1+': 7.5,
  A2: 9,
  'A2+': 10.5,
  'A2-B1': 10.5,
  B1: 12,
  'B1+': 14,
  B2: 16,
  'B2+': 19,
  C1: 22,
  'C1+': 25,
  C2: 28,
};

export const LANGUAGE_PACING_FACTORS: Record<string, number> = {
  'en': 1,
  'en-GB': 1,
  'en-US': 1,
  'ar': 0.73,
  'fa': 0.8,
  'nl': 1,
  'de': 0.94,
  'fr': 1,
  'es': 1,
  'it': 0.93,
  'tr': 0.65,
  'pl': 0.75,
  'uk': 0.74,
  'zh': 0.85,
  'ja': 1.17,
  'ko': 0.6,
  'hi': 0.91,
  'pt': 0.95,
};

export const BAND_PACING_FACTORS: Record<string, Record<LevelBand, number>> = {
  'en': { A: 1, B: 1, C: 1 },
  'en-GB': { A: 1, B: 1, C: 1 },
  'en-US': { A: 1, B: 1, C: 1 },
  'ar': { A: 0.8, B: 0.67, C: 0.73 },
  'fa': { A: 0.86, B: 0.75, C: 0.82 },
  'nl': { A: 1, B: 1, C: 1 },
  'de': { A: 1, B: 1, C: 0.92 },
  'fr': { A: 1, B: 1, C: 1.06 },
  'es': { A: 1, B: 0.88, C: 1 },
  'it': { A: 1, B: 0.86, C: 0.94 },
  'tr': { A: 0.75, B: 0.6, C: 0.67 },
  'pl': { A: 0.83, B: 0.71, C: 0.75 },
  'uk': { A: 0.86, B: 0.67, C: 0.73 },
  'zh': { A: 1, B: 0.8, C: 0.87 },
  'ja': { A: 1.2, B: 1.11, C: 1.2 },
  'ko': { A: 0.67, B: 0.56, C: 0.62 },
  'hi': { A: 1, B: 0.83, C: 0.89 },
  'pt': { A: 1, B: 0.88, C: 1 },
};

export const DEFAULT_PACING_CONFIG: PacingConfig = {
  wordsPerMinuteByLevel: {
    A0: 100,
    'A0+': 110,
    A1: 120,
    'A1+': 130,
    A2: 140,
    'A2+': 150,
    'A2-B1': 155,
    B1: 165,
    'B1+': 175,
    B2: 190,
    'B2+': 200,
    C1: 220,
    'C1+': 230,
    C2: 250,
  },
  defaultWpm: 150,
  levelCaps: LEVEL_CAPS,
  languageFactors: LANGUAGE_PACING_FACTORS,
  bandFactors: BAND_PACING_FACTORS,
  defaultCap: 12,
  sequencerRules: {
    maxLongPerWindow: 1,
    rollingWindowSize: 3,
    noLongAtTurnStart: true,
    c1LongMinTurnSec: 15,
    enforceTeamParity: true,
  },
};
