import curatedDeckData from './data/curatedDeckDatabase.json';
import phrasesData from './phrases.json';
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

interface LegacyBankPhrase {
  id: string;
  level: Exclude<CEFRLevel, 'all'>;
  rawLevel?: string;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  rawTopic: string;
  texts: Record<string, string>;
}

const CURATED_CARDS = (curatedDeckData as CuratedRawCard[]).filter((c) => !c.excluded && !c.is_collocation_excluded && !c.is_c1_final_excluded);
const LEGACY_PHRASES = phrasesData as LegacyBankPhrase[];

// Map of concept IDs in curated database to prevent duplicate fallback loading
const CURATED_CONCEPT_SET = new Set<string>(CURATED_CARDS.map((c) => c.conceptId || c.id));

export const PHRASE_STATS = {
  PreA1: CURATED_CARDS.filter((p) => p.rawLevel === 'A0' || p.rawLevel === 'A0+' || p.rawLevel === 'easy').length,
  A0: CURATED_CARDS.filter((p) => p.rawLevel === 'A0' || p.level === 'A0').length,
  A0Plus: CURATED_CARDS.filter((p) => p.rawLevel === 'A0+' || p.level === 'A0+').length,
  A1: CURATED_CARDS.filter((p) => p.rawLevel === 'A1' || p.level === 'A1').length,
  A1Plus: CURATED_CARDS.filter((p) => p.rawLevel === 'A1+' || p.level === 'A1+').length,
  A2: CURATED_CARDS.filter((p) => p.rawLevel === 'A2' || p.level === 'A2').length,
  A2Plus: CURATED_CARDS.filter((p) => p.rawLevel === 'A2+' || p.level === 'A2+').length,
  B1: CURATED_CARDS.filter((p) => p.rawLevel === 'B1' || p.level === 'B1').length,
  B1Plus: CURATED_CARDS.filter((p) => p.rawLevel === 'B1+' || p.level === 'B1+').length,
  B2: CURATED_CARDS.filter((p) => p.rawLevel === 'B2' || p.level === 'B2').length,
  B2Plus: CURATED_CARDS.filter((p) => p.rawLevel === 'B2+' || p.level === 'B2+').length,
  C1: CURATED_CARDS.filter((p) => (p.rawLevel === 'C1' || p.level === 'C1') && p.rawLevel !== 'C2' && p.level !== 'C2').length,
  C1Plus: CURATED_CARDS.filter((p) => p.rawLevel === 'C1+' || p.level === 'C1+').length,
  C2: CURATED_CARDS.filter((p) => p.rawLevel === 'C2' || p.level === 'C2').length,
  total: CURATED_CARDS.length,
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
function getMatchingCuratedCards(selectedLevel: CEFRLevel): CuratedRawCard[] {
  if (selectedLevel === 'all') {
    return CURATED_CARDS;
  }

  if (selectedLevel === 'Pre-A1' || selectedLevel === 'A0') {
    return CURATED_CARDS.filter((c) => {
      const lvl = c.rawLevel || c.level;
      return lvl === 'A0' || lvl === 'A0+' || lvl === 'easy';
    });
  }

  // Exact standard levels
  if (['A1', 'A2', 'B1', 'B2', 'C2'].includes(selectedLevel)) {
    return CURATED_CARDS.filter((c) => {
      const lvl = c.rawLevel || c.level;
      return lvl === selectedLevel;
    });
  }

  // C1: strictly C1, MUST NOT include C2!
  if (selectedLevel === 'C1') {
    return CURATED_CARDS.filter((c) => {
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
    return CURATED_CARDS.filter((c) => (c.rawLevel || c.level) === selectedLevel);
  }

  const ownCards = CURATED_CARDS.filter((c) => (c.rawLevel || c.level) === selectedLevel);
  const ownIds = new Set(ownCards.map((c) => c.conceptId || c.id));

  const lowerCards = CURATED_CARDS.filter((c) => (c.rawLevel || c.level) === config.lower && !ownIds.has(c.conceptId || c.id));
  const upperCards = CURATED_CARDS.filter((c) => (c.rawLevel || c.level) === config.upper && !ownIds.has(c.conceptId || c.id));

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

  // 1. Primary Source: Curated Database
  const candidateCurated = getMatchingCuratedCards(cefrLevel);

  targetLanguages.forEach((target) => {
    candidateCurated.forEach((c, i) => {
      if (cats.size && c.topic && !cats.has(c.topic)) return;

      const targetTrans = c.translations[target];
      const nativeTrans = c.translations[nativeLanguage] || c.translations.en;
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

  // 2. Fallback: Legacy phrases only for items not present in Curated Database
  if (pool.length < 15) {
    targetLanguages.forEach((target) => {
      LEGACY_PHRASES.forEach((p) => {
        if (CURATED_CONCEPT_SET.has(p.id)) return;
        const targetText = p.texts[target];
        const translation = p.texts[nativeLanguage] || p.texts.en;
        if (!targetText || !translation) return;

        pool.push({
          id: `${p.id}_${target}_fb`,
          nativeLanguage,
          targetLanguage: target,
          cefrLevel: (cefrLevel === 'all' ? p.level : cefrLevel) as Exclude<CEFRLevel, 'all'>,
          topic: p.topic,
          contentType: typeOf(p.type),
          learningMode: 'Explain',
          prompt: nativeLanguage === 'fa' ? 'عبارت را برای یارت توضیح بده' : 'Explain this phrase',
          targetText,
          translation,
          difficulty: p.difficulty,
          points: pointsFor(p.rawLevel || p.level, p.type)
        });
      });
    });
  }

  // 3. Apply Card Pacing Sequencer (Invariants: no long at start, max 1 long per rolling 3-card window, C1 exclusion)
  if (pool.length > 0) {
    const primaryTarget = targetLanguages[0] || 'en';
    return sequencer.sequenceDeck(pool, turnDurationSec, primaryTarget);
  }

  return pool;
}
