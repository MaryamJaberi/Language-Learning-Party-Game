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

// Normalizes text by removing punctuation, extra spaces, normalizing Persian/Arabic chars, and lowering case
export function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[“”"«»]/g, '')
    .replace(/[\u200c\u200b\ufeff]/g, ' ') // ZWNJ and zero-width spaces
    .replace(/[\u064b-\u0652]/g, '')       // Arabic/Persian diacritics/tashdid/harakat
    .replace(/\u064a/g, '\u06cc')          // Arabic yeh -> Persian yeh (ي -> ی)
    .replace(/\u0643/g, '\u06a9')          // Arabic kaf -> Persian kaf (ك -> ک)
    .replace(/ۀ/g, 'ه')
    .replace(/[؟?!\.,;:\-_—\(\)\[\]\{\}\/\\#\*~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

// Compute word-level token similarity
function wordTokenSimilarity(s1: string, s2: string): number {
  const words1 = s1.split(' ').filter(Boolean);
  const words2 = s2.split(' ').filter(Boolean);

  if (words1.length === 0 || words2.length === 0) return 0;

  let matches = 0;
  words1.forEach(w1 => {
    if (words2.some(w2 => w2 === w1 || levenshteinDistance(w1, w2) <= 1)) {
      matches++;
    }
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
  const userStripped = stripAccents(userNorm);
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

  // Generate target variations
  const expectedVariations = getSentenceVariations(targetAnswer);
  let bestSimilarity = 0;
  let bestMatch = expectedVariations[0];
  let isExact = false;

  for (const expected of expectedVariations) {
    if (userNorm === expected || userStripped === expected) {
      isExact = true;
      bestSimilarity = 1.0;
      bestMatch = expected;
      break;
    }

    const maxLen = Math.max(userNorm.length, expected.length);
    if (maxLen === 0) continue;

    const charSim = 1 - (levenshteinDistance(userNorm, expected) / maxLen);
    const tokenSim = wordTokenSimilarity(userNorm, expected);
    const combinedSim = (charSim * 0.4) + (tokenSim * 0.6);

    if (combinedSim > bestSimilarity) {
      bestSimilarity = combinedSim;
      bestMatch = expected;
    }
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

  // Exact Match
  if (isExact || bestSimilarity >= 0.93) {
    return {
      isCorrect: true,
      similarity: Math.max(bestSimilarity, 0.95),
      userAnswerNormalized: userNorm,
      expectedAnswerNormalized: bestMatch,
      matchedAlternative: bestMatch,
      feedbackMessage: uiLanguage === 'fa' 
        ? (attemptNumber === 1 ? '🎉 آفرین! تلفظ و پاسخ کاملاً درست است.' : '👏 عالی! جواب را با موفقیت تصحیح کردی.')
        : (attemptNumber === 1 ? '🎉 Excellent! Completely correct pronunciation & phrasing.' : '👏 Great job correcting your answer!'),
      pointsAwarded: totalPoints
    };
  }

  // High similarity tolerance (e.g. slight accent difference or small missing article)
  if (bestSimilarity >= 0.82) {
    return {
      isCorrect: true,
      isAlmostCorrect: true,
      similarity: bestSimilarity,
      userAnswerNormalized: userNorm,
      expectedAnswerNormalized: bestMatch,
      matchedAlternative: bestMatch,
      feedbackMessage: uiLanguage === 'fa'
        ? `✨ عالی و قابل قبول! (تلفظ بسیار نزدیک بود: "${bestMatch}")`
        : `✨ Very close & accepted! (Target: "${bestMatch}")`,
      pointsAwarded: Math.round(totalPoints * 0.85)
    };
  }

  // Incorrect - provide constructive correction guidance
  const wordsUser = userNorm.split(' ');
  const wordsExpected = bestMatch.split(' ');
  const missingWords = wordsExpected.filter(w => !wordsUser.includes(w));

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
