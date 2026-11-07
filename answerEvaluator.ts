import { LanguageCard, Language } from './types';

export interface EvaluationResult {
  isCorrect: boolean;
  isAlmostCorrect?: boolean;
  similarity: number; // 0.0 to 1.0
  userAnswerNormalized: string;
  expectedAnswerNormalized: string;
  matchedAlternative?: string;
  feedbackMessage: string;
  suggestedCorrection?: string;
  pointsAwarded: number;
}

// Normalizes text by removing punctuation, normalizing ZWNJ/half-spaces, Persian/Arabic chars, and lowering case
export function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[“”"«»]/g, '')
    // CRITICAL: Strip ZWNJ and zero-width spaces without inserting a space,
    // so "می‌تونی" becomes "میتونی"
    .replace(/[\u200c\u200b\ufeff]/g, '')
    .replace(/[\u064b-\u065f]/g, '')        // Arabic/Persian diacritics/tashdid/harakat
    .replace(/\u064a/g, '\u06cc')           // Arabic yeh -> Persian yeh (ي -> ی)
    .replace(/\u0643/g, '\u06a9')           // Arabic kaf -> Persian kaf (ك -> ک)
    .replace(/[آأإ]/g, 'ا')                 // Normalize alif with hamza / madda
    .replace(/[ةۀ]/g, 'ه')                  // Teh marbuta & heh with hamza
    .replace(/[؟?!\.,;:\-_—\(\)\[\]\{\}\/\\#\*~…⋯]/g, ' ')
    // Unify "می " and "نمی " prefixes so "می تونی" -> "میتونی"
    .replace(/\bمی\s+/g, 'می')
    .replace(/\bنمی\s+/g, 'نمی')
    .replace(/\s+/g, ' ')
    .trim();
}

// Common conversational filler words across supported languages
export const FILLER_WORDS = new Set<string>([
  // English
  'um', 'uh', 'er', 'ah', 'like', 'well', 'basically',
  // Persian
  'امم', 'ام', 'یعنی', 'خب', 'مثلا', 'مثلاً', 'راستش', 'اه',
  // Dutch
  'nou', 'euh', 'eh',
  // German
  'äh', 'ähm', 'tja', 'halt',
  // French
  'euh', 'bah', 'ben',
  // Spanish
  'eh', 'este', 'bueno',
  // Italian
  'ehm', 'beh', 'cioè', 'cioe',
  // Arabic
  'امم', 'يعني'
]);

// Check if the expected answer is a short answer (<= 4 characters or 1 CJK character)
export function isShortAnswer(text: string): boolean {
  if (!text) return false;
  const noSpace = text.replace(/\s+/g, '');
  const cjkChars = (noSpace.match(/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g) || []).length;
  // Exactly 1 CJK character or total non-space length <= 4
  return cjkChars === 1 || noSpace.length <= 4;
}

export function stripFillerWords(str: string, keepWords?: Set<string>): string {
  if (!str) return '';
  const tokens = str.split(' ').filter(Boolean);
  const filtered = tokens.filter(tok => {
    const lower = tok.toLowerCase();
    if (keepWords && keepWords.has(lower)) {
      return true; // Keep because it appears in the expected answer or alternatives!
    }
    return !FILLER_WORDS.has(lower);
  });
  return filtered.length > 0 ? filtered.join(' ') : str;
}

// Remove diacritics / accents for tolerant comparison
export function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Common conversational contractions mapping
const CONTRACTIONS: Record<string, string[]> = {
  "i'm": ["i am"],
  "i am": ["i'm"],
  "you're": ["you are"],
  "you are": ["you're"],
  "he's": ["he is"],
  "he is": ["he's"],
  "she's": ["she is"],
  "she is": ["she's"],
  "it's": ["it is"],
  "it is": ["it's"],
  "we're": ["we are"],
  "we are": ["we're"],
  "they're": ["they are"],
  "they are": ["they're"],
  "don't": ["do not"],
  "do not": ["don't"],
  "doesn't": ["does not"],
  "does not": ["doesn't"],
  "didn't": ["did not"],
  "did not": ["didn't"],
  "can't": ["cannot", "can not"],
  "cannot": ["can't", "can not"],
  "can not": ["can't", "cannot"],
  "won't": ["will not"],
  "will not": ["won't"],
  "i'd like": ["i would like"],
  "i would like": ["i'd like"],
  "we'd like": ["we would like"],
  "we would like": ["we'd like"],
  "let's": ["let us"],
  "let us": ["let's"],
  "what's": ["what is"],
  "what is": ["what's"],
  "where's": ["where is"],
  "where is": ["where's"],
  "how's": ["how is"],
  "how is": ["how's"],
  "that's": ["that is"],
  "that is": ["that's"],
  "there's": ["there is"],
  "there is": ["there's"],
  "gonna": ["going to"],
  "going to": ["gonna"],
  "wanna": ["want to"],
  "want to": ["wanna"]
};

// Common conversational synonyms that don't alter the core meaning
const SYNONYM_GROUPS: string[][] = [
  // Persian colloquial & standard equivalence
  ['میتونی', 'میتوانید', 'میشه', 'میتونی که', 'امکان داره'],
  ['کمکم کنی', 'کمکم کن', 'به من کمک کنی', 'کمک کنی', 'کمکم کنید'],
  ['متشکرم', 'مرسی', 'ممنون', 'خیلی ممنون', 'سپاسگزارم', 'سپاس', 'تشکر'],
  ['لطفا', 'لطفاً', 'خواهش میکنم', 'بی زحمت', 'بی‌زحمت'],
  ['چطوری', 'حالت چطوره', 'اوضاعت چطوره', 'خوبی', 'چطورید', 'حال شما چطوره'],
  ['سلام', 'درود', 'سلام علیکم', 'سلام روز بخیر', 'روز بخیر'],
  ['خداحافظ', 'خدافظ', 'فعلا', 'فعلاً', 'به امید دیدار', 'بای', 'روز خوش'],
  ['بله', 'اره', 'آره', 'درسته', 'حتما', 'حتماً'],
  ['خیر', 'نه', 'نخیر'],
  ['ببخشید', 'عذر میخوام', 'معذرت میخوام', 'شرمنده'],
  ['خوشبختم', 'از آشنایی با شما خوشبختم', 'خوشحالم از دیدنت'],
  ['خوبم', 'من خوبم', 'عالی ام', 'عالی هستم', 'الحمدلله'],
  // English common equivalents
  ['can you help me', 'could you help me', 'help me please', 'can you please help me'],
  ['thank you', 'thanks', 'thanks a lot', 'thank you very much'],
  ['check please', 'bill please', 'the check please', 'the bill please'],
  ['excuse me', 'pardon me', 'sorry'],
  ['how are you', 'how are you doing', "how's it going", 'how are things'],
  ['yes', 'yeah', 'yep', 'sure'],
  ['no', 'nope'],
  ['goodbye', 'bye', 'see you', 'see you later']
];

// Expand all viable variations of a sentence
function getSentenceVariations(text: string): string[] {
  const norm = normalizeText(text);
  const variants = new Set<string>([norm, stripAccents(norm)]);

  // Handle slashes in original text (e.g., "Hello / Hi")
  if (text.includes('/')) {
    text.split('/').forEach(part => {
      const pNorm = normalizeText(part);
      if (pNorm) {
        variants.add(pNorm);
        variants.add(stripAccents(pNorm));
      }
    });
  }

  // Contraction substitutions
  Object.entries(CONTRACTIONS).forEach(([key, equivalents]) => {
    equivalents.forEach(eq => {
      if (norm.includes(key)) {
        const substituted = norm.replace(new RegExp(`\\b${key}\\b`, 'g'), eq);
        variants.add(substituted);
        variants.add(stripAccents(substituted));
      }
      if (norm.includes(eq)) {
        const substituted = norm.replace(new RegExp(`\\b${eq}\\b`, 'g'), key);
        variants.add(substituted);
        variants.add(stripAccents(substituted));
      }
    });
  });

  // Synonym group expansions
  for (const group of SYNONYM_GROUPS) {
    for (const phrase of group) {
      const normPhrase = normalizeText(phrase);
      if (norm.includes(normPhrase)) {
        for (const alt of group) {
          const normAlt = normalizeText(alt);
          if (normAlt !== normPhrase) {
            const substituted = norm.replace(normPhrase, normAlt);
            variants.add(substituted);
            variants.add(stripAccents(substituted));
          }
        }
      }
    }
  }

  return Array.from(variants);
}

// Compute Levenshtein distance between two strings
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = [];

  for (let i = 0; i <= m; i++) {
    dp[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

// Compute word-level token similarity with synonym & spelling tolerance
function wordTokenSimilarity(s1: string, s2: string): number {
  const words1 = s1.split(' ').filter(Boolean);
  const words2 = s2.split(' ').filter(Boolean);

  if (words1.length === 0 || words2.length === 0) return 0;

  let matches = 0;
  words1.forEach(w1 => {
    // Exact match or 1-char typo or synonym match
    const matched = words2.some(w2 => {
      if (w2 === w1) return true;
      if (levenshteinDistance(w1, w2) <= 1 && Math.max(w1.length, w2.length) >= 3) return true;
      // Check if both words belong to same synonym group
      return SYNONYM_GROUPS.some(group => {
        const normGroup = group.map(g => normalizeText(g));
        return normGroup.includes(w1) && normGroup.includes(w2);
      });
    });
    if (matched) matches++;
  });

  return (2 * matches) / (words1.length + words2.length);
}

/**
 * Evaluates the user's voice transcript or typed text against the card.
 */
export function evaluateAnswer(
  card: LanguageCard,
  rawUserInput: string,
  attemptNumber: number = 1,
  timeRemainingRatio: number = 1.0,
  uiLanguage: Language = 'fa',
  overrideExpectedText?: string
): EvaluationResult {
  const userNorm = normalizeText(rawUserInput);
  const targetAnswer = overrideExpectedText?.trim() ? overrideExpectedText.trim() : card.targetText;

  if (!userNorm) {
    return {
      isCorrect: false,
      similarity: 0,
      userAnswerNormalized: '',
      expectedAnswerNormalized: normalizeText(targetAnswer),
      feedbackMessage: uiLanguage === 'fa' ? 'هیچ پاسخی دریافت نشد. لطفاً صحبت کنید یا بنویسید.' : 'No answer provided. Please speak or type.',
      pointsAwarded: 0
    };
  }

  // Generate target variations (contractions, synonyms, spelling variants, and card alternatives)
  const expectedVariations = getSentenceVariations(targetAnswer);
  if ((card as any)?.alternatives && Array.isArray((card as any).alternatives)) {
    for (const alt of (card as any).alternatives) {
      for (const v of getSentenceVariations(alt)) {
        if (!expectedVariations.includes(v)) {
          expectedVariations.push(v);
        }
      }
    }
  }

  // Extract all words from expected variations so legit words (e.g. "I like tea", "well", "یعنی") are never stripped
  const expectedWords = new Set<string>();
  for (const v of expectedVariations) {
    for (const w of v.split(' ')) {
      if (w) expectedWords.add(w.toLowerCase());
    }
  }

  const userNoFillers = stripFillerWords(userNorm, expectedWords);

  // Generate user candidate forms: raw normalized, filler-stripped, and accent-stripped
  const userCandidates = Array.from(new Set([
    userNorm,
    userNoFillers,
    stripAccents(userNorm),
    stripAccents(userNoFillers)
  ].filter(Boolean)));

  let bestSimilarity = 0;
  let bestMatch = expectedVariations[0];
  let isExact = false;

  for (const expected of expectedVariations) {
    for (const u of userCandidates) {
      if (u === expected) {
        isExact = true;
        bestSimilarity = 1.0;
        bestMatch = expected;
        break;
      }

      const maxLen = Math.max(u.length, expected.length);
      if (maxLen === 0) continue;

      const charSim = 1 - (levenshteinDistance(u, expected) / maxLen);
      const tokenSim = wordTokenSimilarity(u, expected);
      const combinedSim = (charSim * 0.45) + (tokenSim * 0.55);

      if (combinedSim > bestSimilarity) {
        bestSimilarity = combinedSim;
        bestMatch = expected;
      }
    }
    if (isExact) break;
  }

  // Base points calculation scaled by card CEFR level (A1 -> C1/C2) as requested
  const cefrMultipliers: Record<string, number> = {
    'A1': 1.0,
    'A2': 1.35,
    'B1': 1.8,
    'B2': 2.4,
    'C1': 3.2,
    'C2': 3.8
  };
  const levelMult = cefrMultipliers[card.cefrLevel] || 1.0;
  const rawBase = attemptNumber === 1 ? 100 : 60;
  const basePoints = Math.round(rawBase * levelMult);
  const speedBonus = Math.round(timeRemainingRatio * 25 * levelMult);
  const totalPoints = basePoints + speedBonus;

  // Short answers rule: if expected answer is <= 4 characters (or 1 CJK character), require an EXACT match after normalization
  const isShort = isShortAnswer(targetAnswer) || isShortAnswer(bestMatch);
  if (isShort && !isExact) {
    return {
      isCorrect: false,
      similarity: bestSimilarity,
      userAnswerNormalized: userNorm,
      expectedAnswerNormalized: bestMatch,
      feedbackMessage: uiLanguage === 'fa'
        ? `❌ برای پاسخ‌های کوتاه، تطابق کامل نیاز است. پاسخ شما: "${userNorm}" — پاسخ مورد انتظار: "${targetAnswer}"`
        : `❌ Short answers require an exact match. Your answer: "${userNorm}" — Expected: "${targetAnswer}"`,
      suggestedCorrection: card.targetText,
      pointsAwarded: 0
    };
  }

  // Full Credit: Exact match or >= 0.85 similarity
  if (isExact || bestSimilarity >= 0.85) {
    return {
      isCorrect: true,
      isAlmostCorrect: false,
      similarity: Math.max(bestSimilarity, 0.90),
      userAnswerNormalized: userNorm,
      expectedAnswerNormalized: bestMatch,
      matchedAlternative: bestMatch,
      feedbackMessage: uiLanguage === 'fa' 
        ? (attemptNumber === 1 ? '🎉 آفرین! پاسخ کاملاً درست است.' : '👏 عالی! جواب را با موفقیت تصحیح کردی.')
        : (attemptNumber === 1 ? '🎉 Excellent! Completely correct phrasing.' : '👏 Great job correcting your answer!'),
      pointsAwarded: totalPoints
    };
  }

  // Partial Credit: 0.70 to 0.85 similarity ("almost")
  if (bestSimilarity >= 0.70) {
    return {
      isCorrect: true,
      isAlmostCorrect: true,
      similarity: bestSimilarity,
      userAnswerNormalized: userNorm,
      expectedAnswerNormalized: bestMatch,
      matchedAlternative: bestMatch,
      feedbackMessage: uiLanguage === 'fa'
        ? `✨ نزدیک بود! پاسخ پذیرفته شد (پاسخ دقیق: "${bestMatch}").`
        : `✨ Almost! Accepted with partial credit (exact match: "${bestMatch}").`,
      pointsAwarded: Math.round(totalPoints * 0.75)
    };
  }

  // Incorrect - provide constructive correction guidance
  const wordsUser = userNorm.split(' ');
  const wordsExpected = bestMatch.split(' ');
  // Filter out minor particles from missing words report
  const minorParticles = new Set(['که', 'به', 'رو', 'را', 'از', 'در', 'با', 'a', 'an', 'the', 'to', 'in', 'on', 'at']);
  const missingWords = wordsExpected.filter(w => !wordsUser.includes(w) && !minorParticles.has(w));

  let guidanceFa = `پاسخ شما: "${userNorm}" — پاسخ مورد انتظار: "${targetAnswer}"`;
  if (missingWords.length > 0 && missingWords.length <= 3) {
    guidanceFa += ` (کلمات جا افتاده یا متفاوت: ${missingWords.join('، ')})`;
  }

  let guidanceEn = `Your answer: "${userNorm}" — Expected: "${targetAnswer}"`;
  if (missingWords.length > 0 && missingWords.length <= 3) {
    guidanceEn += ` (Missing or different words: ${missingWords.join(', ')})`;
  }

  return {
    isCorrect: false,
    similarity: bestSimilarity,
    userAnswerNormalized: userNorm,
    expectedAnswerNormalized: bestMatch,
    feedbackMessage: uiLanguage === 'fa'
      ? `❌ هنوز دقیق نیست! ${guidanceFa}. می‌تونی جوابت رو تصحیح کنی!`
      : `❌ Not quite! ${guidanceEn}. You can try again to correct it!`,
    suggestedCorrection: card.targetText,
    pointsAwarded: 0
  };
}
