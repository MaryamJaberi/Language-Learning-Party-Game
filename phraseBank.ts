import phrasesData from './phrases.json';
import { Language, CEFRLevel, LanguageCard, ContentType, LearningMode, CardGameMode } from './types';

interface BankPhrase {
  id: string;
  level: 'A1' | 'A2' | 'B1';
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  rawTopic: string;
  texts: Record<string, string>;
}

const PHRASES = phrasesData as BankPhrase[];

export const PHRASE_STATS = {
  A1: PHRASES.filter((p) => p.level === 'A1').length,
  A2: PHRASES.filter((p) => p.level === 'A2').length,
  B1: PHRASES.filter((p) => p.level === 'B1').length,
  total: PHRASES.length,
};

function pickText(texts: Record<string, string>, lang: Language): string {
  const direct = texts[lang];
  if (direct) return direct;
  if (lang === 'en-US') return texts.en || texts['en-US'] || '';
  if (lang === 'en') return texts['en-US'] || texts.en || '';
  return texts.en || texts['en-US'] || texts.fa || '';
}

function typeOf(raw: string): ContentType {
  if (raw === 'Question') return 'Question';
  if (raw === 'Sentence') return 'Sentence';
  if (raw === 'Vocabulary') return 'Vocabulary';
  if (raw === 'Situation') return 'Situation';
  return 'Phrase';
}

function modeOf(content: ContentType, reverse: boolean): LearningMode {
  if (reverse) return 'Reverse';
  if (content === 'Question') return 'Speak';
  if (content === 'Vocabulary') return 'Explain';
  return 'Translate';
}

function pointsFor(d: 'easy' | 'medium' | 'hard'): number {
  return d === 'easy' ? 1 : d === 'medium' ? 2 : 3;
}

function phraseFits(p: BankPhrase, selected: CEFRLevel): boolean {
  if (selected === 'all') return true;
  if (selected === p.level) return true;
  if (selected === 'B2' && p.level === 'B1' && p.difficulty !== 'easy') return true;
  if ((selected === 'C1' || selected === 'C2') && p.level === 'B1' && p.difficulty === 'hard') return true;
  return false;
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

export function cardsFromPhraseBank(
  targetLanguages: Language[],
  selectedCategories: string[],
  cefrLevel: CEFRLevel,
  nativeLanguage: Language,
  cardGameMode: CardGameMode,
): LanguageCard[] {
  const cats = new Set(selectedCategories);
  const pool: LanguageCard[] = [];
  const shouldReverse = (i: number) =>
    cardGameMode === 'reverse' || (cardGameMode === 'mixed' && i % 3 === 0);

  targetLanguages.forEach((target) => {
    PHRASES.forEach((p, i) => {
      if (!phraseFits(p, cefrLevel)) return;
      if (cats.size && !cats.has(p.topic)) return;
      const targetText = pickText(p.texts, target);
      const translation = pickText(p.texts, nativeLanguage);
      if (!targetText) return;
      const content = typeOf(p.type);
      const reverse = shouldReverse(i);
      const forcedLevel =
        cefrLevel === 'B2' || cefrLevel === 'C1' || cefrLevel === 'C2' ? cefrLevel : p.level;
      const targetLangName = LANG_FA[target] || target;
      pool.push({
        id: `${p.id}_${target}`,
        nativeLanguage,
        targetLanguage: target,
        cefrLevel: forcedLevel,
        topic: p.topic,
        contentType: content,
        learningMode: modeOf(content, reverse),
        prompt: reverse
          ? nativeLanguage === 'fa'
            ? `🔄 ترجمه به ${targetLangName}: این عبارت را به زبان هدف ادا کن!`
            : `🔄 Reverse Translate into ${target}: Speak the translation!`
          : nativeLanguage === 'fa'
            ? 'عبارت را طوری توضیح بده که یارت همان جمله را بگوید'
            : 'Describe it so your partner says the exact phrase',
        targetText,
        translation: translation || targetText,
        hint: p.rawTopic,
        difficulty: p.difficulty,
        points: pointsFor(p.difficulty),
        isReverse: reverse,
      });
    });
  });

  if (pool.length < 15) {
    targetLanguages.forEach((target) => {
      PHRASES.forEach((p) => {
        if (!phraseFits(p, cefrLevel)) return;
        const targetText = pickText(p.texts, target);
        const translation = pickText(p.texts, nativeLanguage);
        if (!targetText || pool.length >= 40) return;
        pool.push({
          id: `${p.id}_${target}_fb`,
          nativeLanguage,
          targetLanguage: target,
          cefrLevel: p.level,
          topic: p.topic,
          contentType: typeOf(p.type),
          learningMode: 'Explain',
          prompt: 'Explain this phrase',
          targetText,
          translation: translation || targetText,
          difficulty: p.difficulty,
          points: pointsFor(p.difficulty),
        });
      });
    });
  }

  return pool;
}
