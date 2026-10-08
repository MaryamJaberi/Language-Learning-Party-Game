import { LanguageCard, Language, MistakeRecord } from './types';
import { CURATED_LANGUAGE_CARDS } from './cardsData';
import { UNIVERSAL_CONCEPTS } from './multiLangDictionary';
import { auth, db } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const STORAGE_MISTAKES = 'dor_mistakes_bank';

/**
 * Get all recorded mistakes from storage
 */
export function getSavedMistakes(): MistakeRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_MISTAKES);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    }
  } catch (e) {
    console.warn('Failed to parse mistakes bank:', e);
  }
  return [];
}

/**
 * Save mistake list to localStorage and optional Firestore
 */
function persistMistakes(records: MistakeRecord[]): void {
  try {
    localStorage.setItem(STORAGE_MISTAKES, JSON.stringify(records));
  } catch (e) {
    console.warn('Failed to save mistakes bank:', e);
  }
}

/**
 * Record a user mistake across any game mode
 */
export async function recordMistake(
  card: LanguageCard,
  userWrongAnswer: string,
  mode: MistakeRecord['mode'] = 'single_player'
): Promise<void> {
  if (!card || !card.targetText) return;

  const current = getSavedMistakes();
  const existingIdx = current.findIndex(m => m.cardId === card.id);
  const now = new Date().toISOString();

  if (existingIdx >= 0) {
    current[existingIdx].mistakeCount += 1;
    current[existingIdx].userWrongAnswer = userWrongAnswer || current[existingIdx].userWrongAnswer;
    current[existingIdx].timestamp = now;
    current[existingIdx].mastered = false;
  } else {
    const newRecord: MistakeRecord = {
      id: `mistake_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      cardId: card.id,
      card,
      userWrongAnswer: userWrongAnswer || '(پاسخ اشتباه)',
      correctAnswer: card.targetText,
      mode,
      timestamp: now,
      mistakeCount: 1,
      reviewedCount: 0,
      mastered: false
    };
    current.unshift(newRecord);
  }

  // Keep max 500 recent mistakes
  const trimmed = current.slice(0, 500);
  persistMistakes(trimmed);

  // Sync to Firestore if authenticated
  try {
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const ref = doc(db, 'users', uid, 'mistakes', card.id);
      await setDoc(ref, {
        cardId: card.id,
        targetText: card.targetText,
        translation: card.translation,
        targetLanguage: card.targetLanguage,
        userWrongAnswer,
        mode,
        mistakeCount: (existingIdx >= 0 ? current[existingIdx].mistakeCount : 1),
        lastMistakeAt: serverTimestamp()
      }, { merge: true });
    }
  } catch (e) {
    // Non-blocking firestore sync
  }
}

/**
 * Record successful review of a mistake card
 */
export function recordMistakeSuccess(cardId: string): void {
  const current = getSavedMistakes();
  const record = current.find(m => m.cardId === cardId);
  if (record) {
    record.reviewedCount += 1;
    if (record.reviewedCount >= 2) {
      record.mastered = true;
    }
    persistMistakes(current);
  }
}

/**
 * Clear all mastered mistakes
 */
export function clearMasteredMistakes(): void {
  const current = getSavedMistakes();
  const remaining = current.filter(m => !m.mastered);
  persistMistakes(remaining);
}

/**
 * Generates pedagogically parallel and grammatically similar questions
 * for a specific mistake card to ensure comprehensive conceptual learning.
 */
export function generateSimilarQuestions(
  mistakeCard: LanguageCard,
  count: number = 3
): LanguageCard[] {
  if (!mistakeCard) return [];

  const lang = mistakeCard.targetLanguage;
  const topic = mistakeCard.topic;
  const level = mistakeCard.cefrLevel;
  const originalTarget = mistakeCard.targetText.trim();
  const originalPrompt = mistakeCard.prompt || mistakeCard.translation;

  const similarList: LanguageCard[] = [];

  // 1. Find cards from curated database matching the same target language, topic, and level
  const curatedMatches = CURATED_LANGUAGE_CARDS.filter(c => 
    c.targetLanguage === lang &&
    c.id !== mistakeCard.id &&
    (c.topic === topic || c.cefrLevel === level)
  );

  // Shuffle curated matches
  const shuffledCurated = [...curatedMatches].sort(() => Math.random() - 0.5);
  for (const c of shuffledCurated) {
    if (!similarList.some(item => item.id === c.id)) {
      similarList.push({
        ...c,
        hint: `🔄 تمرین مشابه: الگوی گرامری "${mistakeCard.grammarPoint || topic.replace('CAT_', '')}"`
      });
      if (similarList.length >= count) break;
    }
  }

  // 2. Synthesize grammatical and semantic variants if not enough curated matches
  if (similarList.length < count) {
    const isQ = originalTarget.endsWith('?') || /^(wat|waar|hoe|wie|what|where|how|who|wo|wann|wie|où|quand|comment)\b/i.test(originalTarget);

    // Subject & Pronoun Variation 1
    if (lang === 'nl') {
      if (/ik wil/i.test(originalTarget)) {
        similarList.push({
          id: `${mistakeCard.id}_var1`,
          targetLanguage: lang,
          cefrLevel: level,
          topic,
          contentType: 'Sentence',
          learningMode: 'Explain',
          prompt: `همین درخواست را برای «ما» (Wij) بیان کن:`,
          targetText: originalTarget.replace(/ik wil/i, 'wij willen'),
          translation: mistakeCard.translation.replace(/می‌خواهم|می‌خوام/g, 'می‌خواهیم'),
          grammarPoint: 'تغییر فاعل: Ik wil ➔ Wij willen',
          hint: 'فاعل به جمع (ما) تغییر کرده است',
          difficulty: 'medium',
          points: 2
        });
      } else if (isQ && /hoe laat/i.test(originalTarget)) {
        similarList.push({
          id: `${mistakeCard.id}_var2`,
          targetLanguage: lang,
          cefrLevel: level,
          topic,
          contentType: 'Sentence',
          learningMode: 'Explain',
          prompt: `سؤال مشابه درباره زمان پایان یا شروع رویداد:`,
          targetText: 'Wanneer begint het concert?',
          translation: 'کنسرت چه زمانی شروع می‌شود؟',
          grammarPoint: 'پرسش زمان: Wanneer begint...?',
          hint: 'کلمه پرسشی Wanneer',
          difficulty: 'medium',
          points: 2
        });
      }
    } else if (lang === 'en' || lang === 'en-US') {
      if (/i would like/i.test(originalTarget) || /i'd like/i.test(originalTarget)) {
        similarList.push({
          id: `${mistakeCard.id}_var1`,
          targetLanguage: lang,
          cefrLevel: level,
          topic,
          contentType: 'Sentence',
          learningMode: 'Explain',
          prompt: `همین درخواست محترمانه را برای «او» (He) بیان کن:`,
          targetText: originalTarget.replace(/i('d| would) like/i, 'He would like'),
          translation: mistakeCard.translation.replace(/می‌خواهم|می‌خوام/g, 'او می‌خواهد'),
          grammarPoint: 'Modal Polite Request: He would like...',
          hint: 'Subject change to third person',
          difficulty: 'medium',
          points: 2
        });
      } else if (isQ && /where is/i.test(originalTarget)) {
        similarList.push({
          id: `${mistakeCard.id}_var2`,
          targetLanguage: lang,
          cefrLevel: level,
          topic,
          contentType: 'Sentence',
          learningMode: 'Explain',
          prompt: `پرسش مشابه با استفاده از عبارت Could you tell me:`,
          targetText: originalTarget.replace(/where is the/i, 'Could you tell me where the') + ' is?',
          translation: 'می‌توانید به من بگویید کجاست؟',
          grammarPoint: 'Indirect Question Structure',
          hint: 'Could you tell me where...',
          difficulty: 'medium',
          points: 2
        });
      }
    } else if (lang === 'de') {
      if (/ich möchte/i.test(originalTarget)) {
        similarList.push({
          id: `${mistakeCard.id}_var1`,
          targetLanguage: lang,
          cefrLevel: level,
          topic,
          contentType: 'Sentence',
          learningMode: 'Explain',
          prompt: `همین جمله را با فاعل «ما» (Wir) بگو:`,
          targetText: originalTarget.replace(/ich möchte/i, 'Wir möchten'),
          translation: mistakeCard.translation.replace(/می‌خواهم|می‌خوام/g, 'ما می‌خواهیم'),
          grammarPoint: 'Höfliche Bitte: Wir möchten...',
          hint: 'Wir möchten...',
          difficulty: 'medium',
          points: 2
        });
      }
    }
  }

  // 3. Fallback: match from universal concept dictionary
  if (similarList.length < count) {
    const concepts = UNIVERSAL_CONCEPTS.filter(c => c.topic === topic || c.level === level);
    for (const cp of concepts) {
      const word = cp.words?.[lang];
      const transFa = cp.words?.['fa'] || cp.words?.['en'];
      if (word && word !== originalTarget) {
        similarList.push({
          id: `${mistakeCard.id}_concept_${cp.id}`,
          targetLanguage: lang,
          cefrLevel: level,
          topic,
          contentType: 'Vocabulary',
          learningMode: 'Explain',
          prompt: `کلمه هم‌خانواده در همین موضوع:`,
          targetText: word,
          translation: transFa || word,
          grammarPoint: `واژگان مرتبط: ${topic.replace('CAT_', '')}`,
          hint: 'مفهوم هم‌دسته در همین موضوع',
          difficulty: 'easy',
          points: 1
        });
        if (similarList.length >= count) break;
      }
    }
  }

  return similarList.slice(0, count);
}

/**
 * Builds a comprehensive review session with user's mistakes plus similar grammatical variants
 */
export function buildMistakeReviewSession(): { cards: LanguageCard[]; targetLanguage: Language; nativeLanguage: Language } {
  const mistakes = getSavedMistakes().filter(m => !m.mastered);
  if (mistakes.length === 0) {
    return { cards: [], targetLanguage: 'nl', nativeLanguage: 'fa' };
  }

  const sessionCards: LanguageCard[] = [];
  const primaryLang = mistakes[0].card.targetLanguage || 'nl';
  const nativeLang = mistakes[0].card.nativeLanguage || 'fa';

  for (const m of mistakes.slice(0, 10)) {
    sessionCards.push(m.card);
    const similar = generateSimilarQuestions(m.card, 2);
    sessionCards.push(...similar);
  }

  // Shuffle review cards
  const shuffled = sessionCards.sort(() => Math.random() - 0.5);
  return { cards: shuffled, targetLanguage: primaryLang, nativeLanguage: nativeLang };
}
