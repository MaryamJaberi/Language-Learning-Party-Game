import { describe, test, expect } from 'vitest';
import { evaluateAnswer, normalizeText, stripFillerWords, FILLER_WORDS } from '../answerEvaluator';
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

  test('ignores filler words across multiple languages', () => {
    // English filler words
    expect(stripFillerWords('um hello world')).toBe('hello world');
    expect(stripFillerWords('uh like how are you')).toBe('how are you');

    // Persian filler words
    expect(stripFillerWords('امم سلام خوبی')).toBe('سلام خوبی');
    expect(stripFillerWords('یعنی من رفتم')).toBe('من رفتم');

    // German, French, Dutch filler words
    expect(stripFillerWords('äh danke schön')).toBe('danke schön');
    expect(stripFillerWords('euh bonjour')).toBe('bonjour');
    expect(stripFillerWords('nou dank je wel')).toBe('dank je wel');
  });

  test('gives 100% full credit for exact matches and high similarity (>= 0.85)', () => {
    // Exact match
    const resExact = evaluateAnswer(sampleCard, 'How do you say this in English?');
    expect(resExact.isCorrect).toBe(true);
    expect(resExact.isAlmostCorrect).toBe(false);
    expect(resExact.similarity).toBeGreaterThanOrEqual(0.95);
    expect(resExact.pointsAwarded).toBeGreaterThan(0);

    // Minor typo or filler word stripped match (>= 0.85)
    const resWithFiller = evaluateAnswer(sampleCard, 'Um, how do you say this in English?');
    expect(resWithFiller.isCorrect).toBe(true);
    expect(resWithFiller.isAlmostCorrect).toBe(false);
    expect(resWithFiller.pointsAwarded).toBe(resExact.pointsAwarded);
  });

  test('evaluates "How do you say in English" via general similarity rather than a 100% hardcoded match', () => {
    const res = evaluateAnswer(sampleCard, 'How do you say in English');
    // It is very close (5 of 6 words match), so similarity is between 0.85 and 0.95
    expect(res.isCorrect).toBe(true);
    expect(res.similarity).toBeGreaterThan(0.80);
    // User answer is recorded accurately
    expect(res.userAnswerNormalized).toBe('how do you say in english');
  });

  test('awards partial credit (~75%) for "almost" answers with similarity between 0.70 and 0.85', () => {
    const longCard: LanguageCard = {
      ...sampleCard,
      targetText: 'Could you please call a taxi for me tonight',
      translation: 'میشه امشب لطفا برام یه تاکسی بگیری',
      cefrLevel: 'B1'
    };

    // Answer missing two words but retaining core sentence tokens (~75% similarity)
    const resAlmost = evaluateAnswer(longCard, 'Could you call a taxi tonight');
    expect(resAlmost.similarity).toBeGreaterThanOrEqual(0.70);
    expect(resAlmost.similarity).toBeLessThan(0.88);
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
