import { describe, test, expect } from 'vitest';
import { evaluateAnswer, normalizeText, stripFillerWords, isShortAnswer, FILLER_WORDS } from '../answerEvaluator';
import { LanguageCard } from '../types';

describe('answerEvaluator General Rule & Similarity System', () => {
  const sampleCard: LanguageCard = {
    id: 'eval-test-card',
    targetText: 'How do you say this in English?',
    translation: 'به انگلیسی این چی میشه؟',
    targetLanguage: 'en',
    nativeLanguage: 'fa',
    cefrLevel: 'A1',
    topic: 'General',
    contentType: 'Sentence',
    learningMode: 'Translate',
    prompt: 'Translate',
    difficulty: 'easy',
    points: 10
  };

  test('normalizes punctuation, case, and special characters', () => {
    expect(normalizeText('Hello, World!...')).toBe('hello world');
    expect(normalizeText('«سلام… چطوری؟!»')).toBe('سلام چطوری');
    expect(normalizeText('می‌تونی کمکم کنی؟')).toBe('میتونی کمکم کنی');
    expect(normalizeText('What\'s up?!')).toBe("what's up");
  });

  test('ignores filler words only when they do NOT appear in the expected answer', () => {
    // Basic stripping when not in expected text
    expect(stripFillerWords('um hello world')).toBe('hello world');
    expect(stripFillerWords('uh like how are you')).toBe('how are you');

    // Filler words bug fix: "I like tea" must keep "like"
    const keepLike = new Set(['i', 'like', 'tea']);
    expect(stripFillerWords('i like tea', keepLike)).toBe('i like tea');
    expect(stripFillerWords('um i like tea', keepLike)).toBe('i like tea');

    // "well" in "get well soon"
    const keepWell = new Set(['get', 'well', 'soon']);
    expect(stripFillerWords('get well soon', keepWell)).toBe('get well soon');
    expect(stripFillerWords('well get well soon', keepWell)).toBe('well get well soon');

    // "یعنی" in "یعنی چی"
    const keepYani = new Set(['یعنی', 'چی']);
    expect(stripFillerWords('یعنی چی', keepYani)).toBe('یعنی چی');
    expect(stripFillerWords('امم یعنی چی', keepYani)).toBe('یعنی چی');

    // "مثلا" in "مثلا این کتاب"
    const keepMasalan = new Set(['مثلا', 'این', 'کتاب']);
    expect(stripFillerWords('مثلا این کتاب', keepMasalan)).toBe('مثلا این کتاب');
  });

  test('evaluateAnswer keeps legitimate filler words that are part of the target answer ("I like tea", "یعنی چی")', () => {
    const likeCard: LanguageCard = {
      ...sampleCard,
      targetText: 'I like tea',
      translation: 'من چای دوست دارم'
    };
    const resLike = evaluateAnswer(likeCard, 'I like tea');
    expect(resLike.isCorrect).toBe(true);
    expect(resLike.userAnswerNormalized).toBe('i like tea');

    const resLikeWithUm = evaluateAnswer(likeCard, 'Um, I like tea');
    expect(resLikeWithUm.isCorrect).toBe(true);

    const yaniCard: LanguageCard = {
      ...sampleCard,
      targetText: 'یعنی چی؟',
      translation: 'What does it mean?',
      targetLanguage: 'fa'
    };
    const resYani = evaluateAnswer(yaniCard, 'یعنی چی');
    expect(resYani.isCorrect).toBe(true);
    expect(resYani.userAnswerNormalized).toBe('یعنی چی');
  });

  test('short answers rule: if expected answer is <= 4 chars or 1 CJK char, require exact match after normalization', () => {
    // 1. Short Latin word: "cat" (3 chars)
    const catCard: LanguageCard = {
      ...sampleCard,
      targetText: 'cat',
      translation: 'گربه'
    };
    expect(isShortAnswer('cat')).toBe(true);

    // Exact match passes
    const resCatExact = evaluateAnswer(catCard, 'cat');
    expect(resCatExact.isCorrect).toBe(true);

    // 1-char typo "car" (Levenshtein 1, normally > 66% similar) MUST FAIL because it's short
    const resCatTypo = evaluateAnswer(catCard, 'car');
    expect(resCatTypo.isCorrect).toBe(false);
    expect(resCatTypo.feedbackMessage).toMatch(/تطابق کامل|exact match/i);

    // 2. Short Latin word: "yes" (3 chars)
    const yesCard: LanguageCard = {
      ...sampleCard,
      targetText: 'yes',
      translation: 'بله'
    };
    expect(evaluateAnswer(yesCard, 'yes').isCorrect).toBe(true);
    expect(evaluateAnswer(yesCard, 'ye').isCorrect).toBe(false);

    // 3. 1 CJK character: "猫" (cat in Chinese/Japanese)
    const cjkCard: LanguageCard = {
      ...sampleCard,
      targetText: '猫',
      translation: 'گربه',
      targetLanguage: 'zh'
    };
    expect(isShortAnswer('猫')).toBe(true);
    expect(evaluateAnswer(cjkCard, '猫').isCorrect).toBe(true);
    expect(evaluateAnswer(cjkCard, '狗').isCorrect).toBe(false);

    // 4. Word with 4 characters: "bien" (4 chars)
    const fourCharCard: LanguageCard = {
      ...sampleCard,
      targetText: 'bien',
      translation: 'خوب',
      targetLanguage: 'es'
    };
    expect(isShortAnswer('bien')).toBe(true);
    expect(evaluateAnswer(fourCharCard, 'bien').isCorrect).toBe(true);
    expect(evaluateAnswer(fourCharCard, 'buen').isCorrect).toBe(false);

    // 5. Normal longer sentence (> 4 chars): fuzzy match and similarity tolerances STILL apply!
    expect(isShortAnswer('How do you say this in English?')).toBe(false);
    const resLongFuzzy = evaluateAnswer(sampleCard, 'How do you say in English');
    expect(resLongFuzzy.isCorrect).toBe(true);
  });

  test('gives 100% full credit for exact matches and high similarity (>= 0.85) on regular sentences', () => {
    const resExact = evaluateAnswer(sampleCard, 'How do you say this in English?');
    expect(resExact.isCorrect).toBe(true);
    expect(resExact.isAlmostCorrect).toBe(false);
    expect(resExact.similarity).toBeGreaterThanOrEqual(0.95);
    expect(resExact.pointsAwarded).toBeGreaterThan(0);
  });

  test('awards partial credit (~75%) for "almost" answers with similarity between 0.70 and 0.85 on regular sentences', () => {
    const longCard: LanguageCard = {
      ...sampleCard,
      targetText: 'Could you please call a taxi for me tonight',
      translation: 'میشه امشب لطفا برام یه تاکسی بگیری',
      cefrLevel: 'B1'
    };

    const resAlmost = evaluateAnswer(longCard, 'Could you call a taxi tonight');
    expect(resAlmost.similarity).toBeGreaterThanOrEqual(0.70);
    if (resAlmost.similarity < 0.85) {
      expect(resAlmost.isCorrect).toBe(true);
      expect(resAlmost.isAlmostCorrect).toBe(true);
      expect(resAlmost.feedbackMessage).toMatch(/نزدیک|Almost/i);
    }
  });

  test('marks answer incorrect when similarity is below 0.70 and awards 0 points', () => {
    const resWrong = evaluateAnswer(sampleCard, 'Where is the train station?');
    expect(resWrong.isCorrect).toBe(false);
    expect(resWrong.similarity).toBeLessThan(0.70);
    expect(resWrong.pointsAwarded).toBe(0);
    expect(resWrong.feedbackMessage).toMatch(/❌/);
  });
});
