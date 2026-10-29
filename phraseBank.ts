import phrasesData from './phrases.json';
import { Language, CEFRLevel, LanguageCard, ContentType, LearningMode, CardGameMode } from './types';

interface BankPhrase {
  id: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  rawLevel?: string;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  rawTopic: string;
  texts: Record<string, string>;
}

const PHRASES = phrasesData as BankPhrase[];

export const PHRASE_STATS = {
  A0: PHRASES.filter((p) => p.rawLevel === 'A0').length,
  A0Plus: PHRASES.filter((p) => p.rawLevel === 'A0+').length,
  A1: PHRASES.filter((p) => p.level === 'A1').length,
  A2: PHRASES.filter((p) => p.level === 'A2').length,
  A2_B1: PHRASES.filter((p) => p.rawLevel === 'A2-B1').length,
  B1: PHRASES.filter((p) => p.level === 'B1').length,
  B2: PHRASES.filter((p) => p.level === 'B2').length,
  C1: PHRASES.filter((p) => p.level === 'C1').length,
  C2: PHRASES.filter((p) => p.level === 'C2').length,
  total: PHRASES.length,
};

function pickText(texts: Record<string, string>, lang: Language): string {
  const direct = texts[lang];
  if (direct) return direct;
  if (lang === 'en-US' || lang === 'en') return texts['en-US'] || texts.en || '';
  if (lang === 'fa') return texts.fa || '';
  // Never fallback to English if another specific language was requested!
  return texts[lang] || '';
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
  if (selected === 'B1' && p.rawLevel === 'A2-B1') return true;
  if (selected === 'C1' && p.level === 'C2') return true;
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
      if (!targetText || !translation) return;
      const content = typeOf(p.type);
      const reverse = shouldReverse(i);
      const forcedLevel = cefrLevel === 'all' ? p.level : cefrLevel;
      const isCreative =
        p.type === 'Idiom' ||
        p.rawTopic?.includes('Idiom') ||
        p.rawTopic?.includes('Slang') ||
        p.rawTopic?.includes('Collocation');
      const targetLangName = nativeLanguage === 'fa' 
        ? (LANG_FA[target] || target)
        : (LANG_EN[target] || target);
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
            : `🔄 Reverse Translate into ${targetLangName}: Speak the translation!`
          : nativeLanguage === 'fa'
            ? 'عبارت را طوری توضیح بده که یارت همان جمله را بگوید'
            : 'Describe it so your partner says the exact phrase',
        targetText,
        translation,
        hint: p.rawTopic,
        difficulty: p.difficulty,
        points: pointsFor(p.difficulty),
        isReverse: reverse,
        isCreative,
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
          prompt: nativeLanguage === 'fa' ? 'عبارت را برای یارت توضیح بده' : 'Explain this phrase',
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
