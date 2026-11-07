import { Language, CEFRLevel, LanguageCard, ContentType, LearningMode, CardGameMode } from './types';
import { CardPacingSequencer } from './src/engine/pacing/cardPacing';

export interface CuratedRawCard {
  id: string;
  conceptId: string;
  level: string | null;
  rawLevel?: string;
  topic?: string;
  type: string;
  translations: Record<string, {
    text: string;
    article?: string;
    note?: string;
    alternatives?: string[];
  }>;
  is_collocation_excluded?: boolean;
  is_c1_final_excluded?: boolean;
  excluded?: boolean;
}

export interface CardMetaItem {
  id: string;
  conceptId: string;
  level: string | null;
  rawLevel?: string;
  topic?: string;
  type: string;
  excluded?: boolean;
}

export interface DeckTranslationItem {
  text: string;
  article?: string;
  note?: string;
  alternatives?: string[];
  units?: number;
  lengthClass?: 'short' | 'medium' | 'long';
}

// Global in-memory cache for lazy-loaded decks
let cachedMeta: CardMetaItem[] | null = null;
const cachedDecks: Record<string, Record<string, DeckTranslationItem>> = {};

function getMetaCardsSync(): CardMetaItem[] {
  if (cachedMeta) return cachedMeta;
  if (typeof process !== 'undefined' && process.env?.VITEST) {
    try {
      const fs = require('fs');
      const path = require('path');
      const p = path.resolve('data/decks/meta.json');
      if (fs.existsSync(p)) {
        const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
        cachedMeta = raw.filter((c: any) => !c.excluded);
        return cachedMeta!;
      }
    } catch {}
  }
  return [];
}

function getLanguageDeckSync(lang: string): Record<string, DeckTranslationItem> {
  if (cachedDecks[lang]) return cachedDecks[lang];
  if (typeof process !== 'undefined' && process.env?.VITEST) {
    try {
      const fs = require('fs');
      const path = require('path');
      const p = path.resolve(`data/decks/${lang}.json`);
      if (fs.existsSync(p)) {
        cachedDecks[lang] = JSON.parse(fs.readFileSync(p, 'utf-8'));
        return cachedDecks[lang];
      }
    } catch {}
  }
  return {};
}

/**
 * Lazy loads decks for player-selected languages via HTTP fetch (cached by Service Worker)
 */
export async function preloadLanguageDecks(languages: string[]): Promise<void> {
  if (typeof window === 'undefined' || (typeof process !== 'undefined' && process.env?.VITEST)) return;
  const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || './';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';

  // 1. Load meta if needed
  if (!cachedMeta) {
    try {
      const res = await fetch(`${cleanBase}data/decks/meta.json`);
      if (res.ok) {
        const raw: CardMetaItem[] = await res.json();
        cachedMeta = raw.filter((c) => !c.excluded);
      }
    } catch (e) {
      console.warn('Failed to fetch deck meta.json:', e);
    }
  }

  // 2. Load requested languages in parallel
  const needed = languages.filter((l) => !cachedDecks[l]);
  await Promise.all(
    needed.map(async (lang) => {
      try {
        const res = await fetch(`${cleanBase}data/decks/${lang}.json`);
        if (res.ok) {
          cachedDecks[lang] = await res.json();
        }
      } catch (e) {
        console.warn(`Failed to fetch deck for ${lang}:`, e);
      }
    })
  );
}

export const PHRASE_STATS = {
  PreA1: 327,
  A0: 133,
  A0Plus: 63,
  A1: 771,
  A1Plus: 64,
  A2: 1026,
  A2Plus: 43,
  B1: 1000,
  B1Plus: 21,
  B2: 1545,
  B2Plus: 21,
  C1: 1902,
  C1Plus: 21,
  C2: 467,
  total: 6910,
};

function typeOf(raw: string): ContentType {
  const r = (raw || '').toLowerCase();
  if (r.includes('question')) return 'Question';
  if (r.includes('sentence')) return 'Sentence';
  if (r.includes('vocab')) return 'Vocabulary';
  if (r.includes('situation')) return 'Situation';
  return 'Phrase';
}

function modeOf(content: ContentType, reverse: boolean): LearningMode {
  if (reverse) return 'Reverse';
  if (content === 'Question') return 'Speak';
  if (content === 'Vocabulary') return 'Explain';
  return 'Translate';
}

function pointsFor(rawLevel: string | undefined, type: string): number {
  if (type === 'vocabulary') return 1;
  const lvl = (rawLevel || 'A1').toUpperCase();
  if (lvl.startsWith('A0') || lvl === 'EASY') return 1;
  if (lvl.startsWith('A1') || lvl.startsWith('A2')) return 2;
  if (lvl.startsWith('B1') || lvl.startsWith('B2')) return 3;
  return 4;
}

function difficultyFor(points: number): 'easy' | 'medium' | 'hard' {
  if (points <= 1) return 'easy';
  if (points <= 2) return 'medium';
  return 'hard';
}

const LANG_FA: Record<string, string> = {
  'en-US': 'انگلیسی آمریکایی 🇺🇸',
  en: 'انگلیسی بریتانیایی 🇬🇧',
  nl: 'هلندی 🇳🇱',
  de: 'آلمانی 🇩🇪',
  fr: 'فرانسوی 🇫🇷',
  es: 'اسپانیایی 🇪🇸',
  it: 'ایتالیایی 🇮🇹',
  fa: 'فارسی 🇮🇷',
  ar: 'عربی 🇸🇦',
  tr: 'ترکی 🇹🇷',
  pl: 'لهستانی 🇵🇱',
  uk: 'اوکراینی 🇺🇦',
  zh: 'چینی 🇨🇳',
  ja: 'ژاپنی 🇯🇵',
  ko: 'کره‌ای 🇰🇷',
  hi: 'هندی 🇮🇳',
  pt: 'پرتغالی 🇵🇹',
};

const LANG_EN: Record<string, string> = {
  'en-US': 'American English 🇺🇸',
  en: 'British English 🇬🇧',
  nl: 'Dutch 🇳🇱',
  de: 'German 🇩🇪',
  fr: 'French 🇫🇷',
  es: 'Spanish 🇪🇸',
  it: 'Italian 🇮🇹',
  fa: 'Persian 🇮🇷',
  ar: 'Arabic 🇸🇦',
  tr: 'Turkish 🇹🇷',
  pl: 'Polish 🇵🇱',
  uk: 'Ukrainian 🇺🇦',
  zh: 'Chinese 🇨🇳',
  ja: 'Japanese 🇯🇵',
  ko: 'Korean 🇰🇷',
  hi: 'Hindi 🇮🇳',
  pt: 'Portuguese 🇵🇹',
};

/**
 * Filter matching cards for a requested level according to the CEFR and '+' deck rules
 */
function getMatchingCuratedMeta(selectedLevel: CEFRLevel): CardMetaItem[] {
  const meta = cachedMeta || getMetaCardsSync();
  if (selectedLevel === 'all') {
    return meta;
  }

  if (selectedLevel === 'Pre-A1' || selectedLevel === 'A0') {
    return meta.filter((c) => {
      const lvl = c.rawLevel || c.level;
      return lvl === 'A0' || lvl === 'A0+' || lvl === 'easy';
    });
  }

  // Exact standard levels
  if (['A1', 'A2', 'B1', 'B2', 'C2'].includes(selectedLevel)) {
    return meta.filter((c) => {
      const lvl = c.rawLevel || c.level;
      return lvl === selectedLevel;
    });
  }

  // C1: strictly C1, MUST NOT include C2!
  if (selectedLevel === 'C1') {
    return meta.filter((c) => {
      const lvl = c.rawLevel || c.level;
      return (lvl === 'C1') && lvl !== 'C2';
    });
  }

  // '+' levels rule: Own cards first, then 70/30 mix of adjacent levels without duplicates
  const plusMap: Record<string, { lower: string; upper: string }> = {
    'A1+': { lower: 'A1', upper: 'A2' },
    'A2+': { lower: 'A2', upper: 'B1' },
    'B1+': { lower: 'B1', upper: 'B2' },
    'B2+': { lower: 'B2', upper: 'C1' },
    'C1+': { lower: 'C1', upper: 'C2' },
  };

  const config = plusMap[selectedLevel];
  if (!config) {
    return meta.filter((c) => (c.rawLevel || c.level) === selectedLevel);
  }

  const ownCards = meta.filter((c) => (c.rawLevel || c.level) === selectedLevel);
  const ownIds = new Set(ownCards.map((c) => c.conceptId || c.id));

  const lowerCards = meta.filter((c) => (c.rawLevel || c.level) === config.lower && !ownIds.has(c.conceptId || c.id));
  const upperCards = meta.filter((c) => (c.rawLevel || c.level) === config.upper && !ownIds.has(c.conceptId || c.id));

  // Determine needed fill count (target at least 150 cards in deck)
  const neededFill = Math.max(0, 150 - ownCards.length);
  const countLower = Math.round(neededFill * 0.7);
  const countUpper = Math.round(neededFill * 0.3);

  const fillLower = lowerCards.slice(0, countLower);
  const fillUpper = upperCards.slice(0, countUpper);

  return [...ownCards, ...fillLower, ...fillUpper];
}

export function cardsFromPhraseBank(
  targetLanguages: Language[],
  selectedCategories: string[],
  cefrLevel: CEFRLevel,
  nativeLanguage: Language,
  cardGameMode: CardGameMode,
  turnDurationSec: number = 60
): LanguageCard[] {
  const cats = new Set(selectedCategories.filter(Boolean));
  const pool: LanguageCard[] = [];
  const sequencer = new CardPacingSequencer();

  const shouldReverse = (i: number) =>
    cardGameMode === 'reverse' || (cardGameMode === 'mixed' && i % 3 === 0);

  // 1. Primary Source: Curated Database (via lazy loaded meta & per-language decks)
  const candidateCurated = getMatchingCuratedMeta(cefrLevel);

  targetLanguages.forEach((target) => {
    const targetDeck = cachedDecks[target] || getLanguageDeckSync(target);
    const nativeDeck = cachedDecks[nativeLanguage] || getLanguageDeckSync(nativeLanguage);
    const enDeck = cachedDecks['en'] || getLanguageDeckSync('en');

    candidateCurated.forEach((c, i) => {
      if (cats.size && c.topic && !cats.has(c.topic)) return;

      const cardKey = c.conceptId || c.id;
      const targetTrans = targetDeck[cardKey];
      const nativeTrans = nativeDeck[cardKey] || enDeck[cardKey];
      if (!targetTrans || !targetTrans.text || !nativeTrans || !nativeTrans.text) return;

      const content = typeOf(c.type);
      const reverse = shouldReverse(i);
      const points = pointsFor(c.rawLevel || c.level || undefined, c.type);
      const diff = difficultyFor(points);
      const targetLangName = nativeLanguage === 'fa' ? (LANG_FA[target] || target) : (LANG_EN[target] || target);

      pool.push({
        id: `${c.id}_${target}`,
        nativeLanguage,
        targetLanguage: target,
        cefrLevel: (cefrLevel === 'all' ? (c.rawLevel || c.level || 'A1') : cefrLevel) as Exclude<CEFRLevel, 'all'>,
        topic: c.topic || 'General',
        contentType: content,
        learningMode: modeOf(content, reverse),
        prompt: reverse
          ? nativeLanguage === 'fa'
            ? `🔄 ترجمه به ${targetLangName}: این عبارت را به زبان هدف ادا کن!`
            : `🔄 Reverse Translate into ${targetLangName}: Speak the translation!`
          : nativeLanguage === 'fa'
            ? 'عبارت را طوری توضیح بده که یارت همان جمله را بگوید'
            : 'Describe it so your partner says the exact phrase',
        targetText: targetTrans.text,
        translation: nativeTrans.text,
        article: targetTrans.article,
        note: targetTrans.note || nativeTrans.note,
        alternatives: targetTrans.alternatives,
        hint: c.topic || undefined,
        difficulty: diff,
        points,
        isReverse: reverse,
        isCreative: c.type === 'idiom' || c.topic?.includes('Idiom') || c.topic?.includes('Collocation')
      });
    });
  });

  // 2. Apply Card Pacing Sequencer (Invariants: no long at start, max 1 long per rolling 3-card window, C1 exclusion)
  if (pool.length > 0) {
    const primaryTarget = targetLanguages[0] || 'en';
    return sequencer.sequenceDeck(pool, turnDurationSec, primaryTarget);
  }

  return pool;
}
