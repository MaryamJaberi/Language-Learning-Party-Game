import { LanguageCard, Language, CEFRLevel, LeaderboardEntry, WeakCardItem, PersonalRecords } from './types';
import { CURATED_LANGUAGE_CARDS, CURATED_EN_TRANSLATIONS, tagPedagogicalRatio } from './cardsData';
import { cardsFromPhraseBank } from './phraseBank';
import { getC1CardsForSession } from './c1SentencesData';
import { buildCardsFromConcepts, UNIVERSAL_CONCEPTS, getPromptForCard } from './multiLangDictionary';
import { SUPPORTED_LANGUAGES } from './constants';
import { db, auth } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';

const STORAGE_SEEN_CARDS = 'dor_seen_cards';
const STORAGE_WEAK_CARDS = 'dor_weak_cards';
const STORAGE_LOCAL_LEADERBOARD = 'dor_local_leaderboard';
const STORAGE_PERSONAL_RECORDS = 'dor_personal_records';

/**
 * Get all card IDs previously seen by the user to prevent repetition
 */
export function getSeenCardIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_SEEN_CARDS);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set<string>(arr);
      }
    }
  } catch (e) {
    // Ignore parse errors
  }
  return new Set<string>();
}

/**
 * Mark cards as seen so they won't be repeated
 */
export function markCardsAsSeen(cardIds: string[]): void {
  try {
    const current = getSeenCardIds();
    cardIds.forEach(id => current.add(id));
    // Keep reasonable max size (e.g. 5000 IDs)
    const arr = Array.from(current);
    const trimmed = arr.length > 5000 ? arr.slice(arr.length - 4000) : arr;
    localStorage.setItem(STORAGE_SEEN_CARDS, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to save seen cards:', e);
  }
}

/**
 * Clear seen cards history if user wants a full reset
 */
export function clearSeenCardHistory(): void {
  try {
    localStorage.removeItem(STORAGE_SEEN_CARDS);
  } catch (e) {
    // ignore
  }
}

/**
 * Get user's saved weak cards (spaced repetition)
 */
export function getSavedWeakCards(): WeakCardItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_WEAK_CARDS);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    }
  } catch (e) {
    // ignore
  }
  return [];
}

/**
 * Save or update weak cards for spaced repetition
 */
export async function saveWeakCards(cards: LanguageCard[]): Promise<void> {
  try {
    const existing = getSavedWeakCards();
    const map = new Map<string, WeakCardItem>();
    existing.forEach(item => map.set(item.cardId, item));

    const now = new Date().toISOString();
    cards.forEach(card => {
      const prev = map.get(card.id);
      if (prev) {
        prev.mistakeCount += 1;
        prev.lastPracticed = now;
      } else {
        map.set(card.id, {
          cardId: card.id,
          card,
          mistakeCount: 1,
          lastPracticed: now
        });
      }
    });

    const updated = Array.from(map.values());
    localStorage.setItem(STORAGE_WEAK_CARDS, JSON.stringify(updated));

    // Also sync to Firestore if user is authenticated
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      for (const card of cards) {
        const ref = doc(db, 'users', uid, 'weak_cards', card.id);
        await setDoc(ref, {
          cardId: card.id,
          targetText: card.targetText,
          targetLanguage: card.targetLanguage,
          translation: card.translation,
          topic: card.topic,
          cefrLevel: card.cefrLevel,
          lastPracticed: serverTimestamp()
        }, { merge: true });
      }
    }
  } catch (e) {
    console.warn('Failed to save weak cards:', e);
  }
}

/**
 * Remove a mastered card from weak cards
 */
export function removeWeakCard(cardId: string): void {
  try {
    const existing = getSavedWeakCards().filter(item => item.cardId !== cardId);
    localStorage.setItem(STORAGE_WEAK_CARDS, JSON.stringify(existing));
  } catch (e) {
    // ignore
  }
}

/**
 * Dynamic content generation templates for infinite non-repeating cards
 */
interface PhraseTemplate {
  target: string;
  transFa: string;
  transEn: string;
  topic: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  pronunciation?: string;
}

const DYNAMIC_TEMPLATES_EN: PhraseTemplate[] = [
  { target: "Could you tell me how to get to {place}?", transFa: "می‌تونید بگید چطور برم به {place_fa}؟", transEn: "Could you tell me how to get to the {place}?", topic: "CAT_TRAVEL", level: "A2" },
  { target: "I'd like to make a reservation for {time}.", transFa: "می‌خوام برای {time_fa} یه میز رزرو کنم.", transEn: "I'd like to book a table for {time}.", topic: "CAT_RESTAURANT", level: "A2" },
  { target: "Is there any discount if I pay with cash?", transFa: "اگر نقدی پرداخت کنم تخفیف داره؟", transEn: "Is there a discount for cash?", topic: "CAT_SHOPPING", level: "B1" },
  { target: "Let's catch up over coffee this weekend.", transFa: "بیا این آخر هفته سر یه قهوه گپ بزنیم.", transEn: "Let's catch up over coffee this weekend.", topic: "CAT_SMALLTALK", level: "B1" },
  { target: "I'm looking forward to collaborating with you.", transFa: "مشتاق همکاری با شما هستم.", transEn: "I look forward to working with you.", topic: "CAT_WORK", level: "B2" },
  { target: "Could you speak a little louder, please?", transFa: "می‌شه لطفاً یه کم بلندتر صحبت کنید؟", transEn: "Could you speak up a bit?", topic: "CAT_EVERYDAY", level: "A1" },
  { target: "What do you recommend from the menu?", transFa: "از این منو چی رو پیشنهاد می‌کنید؟", transEn: "What do you recommend here?", topic: "CAT_FOOD", level: "A2" },
  { target: "I appreciate your prompt response.", transFa: "از پاسخ سریع شما بسیار سپاسگزارم.", transEn: "Thank you for your fast reply.", topic: "CAT_WORK", level: "B2" }
];

const PLACE_SUBS = [
  { place: "the central station", place_fa: "ایستگاه مرکزی" },
  { place: "the museum", place_fa: "موزه" },
  { place: "the nearest pharmacy", place_fa: "نزدیک‌ترین داروخانه" },
  { place: "the airport", place_fa: "فرودگاه" },
  { place: "the supermarket", place_fa: "سوپرمارکت" }
];

const TIME_SUBS = [
  { time: "seven o'clock tonight", time_fa: "ساعت هفت امشب" },
  { time: "eight thirty pm", time_fa: "ساعت هشت و نیم شب" },
  { time: "tomorrow evening", time_fa: "فردا شب" },
  { time: "this Friday", time_fa: "این جمعه" }
];

function generateDynamicCards(targetLang: Language, nativeLang: Language, count: number): LanguageCard[] {
  // If target language is non-English, draw from authentic universal multi-lingual concepts
  if (targetLang !== 'en' && targetLang !== 'en-US') {
    const concepts = buildCardsFromConcepts(targetLang, nativeLang, 'all', []);
    if (concepts.length > 0) {
      const shuffled = [...concepts].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    }
  }

  const generated: LanguageCard[] = [];
  let seed = Date.now();

  const targetInfo = SUPPORTED_LANGUAGES.find(l => l.code === targetLang);
  const targetLangDisplayName = targetInfo?.nativeName || targetLang;

  for (let i = 0; i < count; i++) {
    const tmpl = DYNAMIC_TEMPLATES_EN[i % DYNAMIC_TEMPLATES_EN.length];
    const place = PLACE_SUBS[i % PLACE_SUBS.length];
    const time = TIME_SUBS[i % TIME_SUBS.length];

    let target = tmpl.target.replace('{place}', place.place).replace('{time}', time.time);
    let trans = nativeLang === 'fa' 
      ? tmpl.transFa.replace('{place_fa}', place.place_fa).replace('{time_fa}', time.time_fa)
      : tmpl.transEn.replace('{place}', place.place).replace('{time}', time.time);

    generated.push({
      id: `DYN_${targetLang}_${seed}_${i}`,
      targetLanguage: targetLang,
      nativeLanguage: nativeLang,
      cefrLevel: tmpl.level,
      topic: tmpl.topic,
      contentType: 'Sentence',
      learningMode: 'Speak',
      prompt: getPromptForCard('Speak', nativeLang, targetLangDisplayName, false),
      targetText: target,
      translation: trans,
      difficulty: tmpl.level === 'A1' ? 'easy' : tmpl.level === 'A2' ? 'medium' : 'hard',
      points: tmpl.level === 'A1' ? 1 : 2
    });
  }

  return generated;
}

/**
 * Select cards for a Single Player or Practice session:
 * 1. Filter out already-seen cards from history so no user sees duplicates.
 * 2. If weak cards exist, prioritize 20-30% weak cards for review.
 * 3. If pool is insufficient, synthesize dynamic fresh cards.
 */
export function getUniqueCardsForSession(
  targetLanguage: Language,
  nativeLanguage: Language,
  cefrLevel: CEFRLevel,
  selectedCategories: string[],
  requestedCount: number = 10,
  includeWeakCards: boolean = true
): LanguageCard[] {
  const seenIds = getSeenCardIds();
  const pool: LanguageCard[] = [];

  // 1. Gather curated cards
  const isEnNative = nativeLanguage === 'en' || nativeLanguage === 'en-US';
  CURATED_LANGUAGE_CARDS.forEach(card => {
    if (card.targetLanguage === targetLanguage || (targetLanguage === 'en' && card.targetLanguage === 'en-US')) {
      const matchTopic = selectedCategories.length === 0 || selectedCategories.includes(card.topic);
      const matchLevel = cefrLevel === 'all' || card.cefrLevel === cefrLevel;
      if (matchTopic && matchLevel) {
        const enOverride = isEnNative ? CURATED_EN_TRANSLATIONS[card.id] : undefined;
        let trans = enOverride?.translation || card.translation;
        let prmpt = enOverride?.prompt || card.prompt;
        let hnt = enOverride?.hint || card.hint;
        let pron = card.pronunciation;

        if (isEnNative) {
          if (!enOverride && /[\u0600-\u06FF]/.test(trans)) {
            return;
          }
          if (/[\u0600-\u06FF]/.test(prmpt)) {
            prmpt = `Explain this ${card.contentType.toLowerCase()} in the target language`;
          }
          if (hnt && /[\u0600-\u06FF]/.test(hnt)) {
            hnt = `Category: ${card.topic.replace('CAT_', '')}`;
          }
          if (pron && /[\u0600-\u06FF]/.test(pron)) {
            pron = undefined;
          }
        }

        pool.push({
          ...card,
          nativeLanguage,
          translation: trans,
          prompt: prmpt,
          hint: hnt,
          pronunciation: pron
        });
      }
    }
  });

  // 2. Gather verified phrases from phraseBank
  const bankCards = cardsFromPhraseBank(
    [targetLanguage],
    selectedCategories,
    cefrLevel,
    nativeLanguage,
    'standard'
  );
  bankCards.forEach(card => {
    if (!pool.some(p => p.id === card.id)) {
      pool.push(card);
    }
  });

  // 3. Gather authentic C1 Sentences if level is C1, C2, or all
  if (cefrLevel === 'C1' || cefrLevel === 'C2' || cefrLevel === 'all') {
    const c1Cards = getC1CardsForSession(targetLanguage, nativeLanguage, selectedCategories);
    c1Cards.forEach(card => {
      if (!pool.some(p => p.id === card.id)) {
        pool.push(card);
      }
    });
  }

  // 3.5 Gather authentic universal concepts for any language combination
  const conceptCards = buildCardsFromConcepts(targetLanguage, nativeLanguage, cefrLevel, selectedCategories);
  conceptCards.forEach(card => {
    if (!pool.some(p => p.id === card.id)) {
      pool.push(card);
    }
  });

  // 4. Separate unseen vs seen
  const unseenCards = pool.filter(c => !seenIds.has(c.id));
  let finalSelection: LanguageCard[] = [];

  // 4. If requested, inject weak cards that need review
  if (includeWeakCards) {
    const weakItems = getSavedWeakCards().filter(item => 
      item.card.targetLanguage === targetLanguage || (targetLanguage === 'en' && item.card.targetLanguage === 'en-US')
    );
    const weakCardsToInject = weakItems.slice(0, Math.max(1, Math.floor(requestedCount * 0.3))).map(w => w.card);
    weakCardsToInject.forEach(wc => {
      if (!finalSelection.some(c => c.id === wc.id)) {
        finalSelection.push(wc);
      }
    });
  }

  // 4.5 Prioritize creative cards (roleplay scenarios & idioms) for engaging variety
  const creativeCandidates = pool.filter(c => c.isCreative);
  if (creativeCandidates.length > 0) {
    const targetCreativeCount = Math.max(1, Math.min(3, Math.floor(requestedCount * 0.3)));
    const shuffledCreative = [...creativeCandidates].sort(() => Math.random() - 0.5);
    for (const cc of shuffledCreative.slice(0, targetCreativeCount)) {
      if (finalSelection.length >= requestedCount) break;
      if (!finalSelection.some(c => c.id === cc.id)) {
        finalSelection.push(cc);
      }
    }
  }

  // 5. Fill with unseen cards
  const shuffledUnseen = [...unseenCards].sort(() => Math.random() - 0.5);
  for (const card of shuffledUnseen) {
    if (finalSelection.length >= requestedCount) break;
    if (!finalSelection.some(c => c.id === card.id)) {
      finalSelection.push(card);
    }
  }

  // 6. If not enough unseen cards exist (user played everything!), generate fresh dynamic cards
  if (finalSelection.length < requestedCount) {
    const needed = requestedCount - finalSelection.length;
    const dynamicCards = generateDynamicCards(targetLanguage, nativeLanguage, needed + 5);
    for (const card of dynamicCards) {
      if (finalSelection.length >= requestedCount) break;
      finalSelection.push(card);
    }
  }

  // If still not enough, recycle existing with random shuffle
  if (finalSelection.length < requestedCount) {
    const recycled = [...pool].sort(() => Math.random() - 0.5);
    for (const card of recycled) {
      if (finalSelection.length >= requestedCount) break;
      if (!finalSelection.some(c => c.id === card.id)) {
        finalSelection.push(card);
      }
    }
  }

  // Shuffle final selection and apply 70/30 Pedagogical Ratio
  const shuffled = finalSelection.sort(() => Math.random() - 0.5);
  return tagPedagogicalRatio(shuffled, cefrLevel);
}

/**
 * Save Leaderboard score to Local Storage and Firestore
 */
export async function submitScoreToLeaderboard(entry: Omit<LeaderboardEntry, 'id'>): Promise<LeaderboardEntry> {
  const newEntry: LeaderboardEntry = {
    ...entry,
    id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
  };

  // Local storage
  try {
    const raw = localStorage.getItem(STORAGE_LOCAL_LEADERBOARD);
    const list: LeaderboardEntry[] = raw ? JSON.parse(raw) : [];
    list.push(newEntry);
    list.sort((a, b) => b.score - a.score);
    localStorage.setItem(STORAGE_LOCAL_LEADERBOARD, JSON.stringify(list.slice(0, 100)));
  } catch (e) {
    console.warn('Failed to save local leaderboard:', e);
  }

  // Firestore
  try {
    const col = collection(db, 'leaderboard');
    await addDoc(col, {
      ...newEntry,
      createdAt: serverTimestamp()
    });
  } catch (e) {
    console.warn('Could not post score to cloud leaderboard:', e);
  }

  return newEntry;
}

/**
 * Fetch top leaderboard entries (merging Cloud and Local)
 */
export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const localList: LeaderboardEntry[] = (() => {
    try {
      const raw = localStorage.getItem(STORAGE_LOCAL_LEADERBOARD);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  })();

  try {
    const col = collection(db, 'leaderboard');
    const q = query(col, orderBy('score', 'desc'), limit(30));
    const snap = await getDocs(q);
    const cloudList: LeaderboardEntry[] = [];
    snap.forEach(docSnap => {
      const d = docSnap.data();
      cloudList.push({
        id: docSnap.id,
        playerName: d.playerName || 'Anonymous',
        score: d.score || 0,
        accuracy: d.accuracy || 0,
        totalCards: d.totalCards || 0,
        targetLanguage: d.targetLanguage || 'en',
        cefrLevel: d.cefrLevel || 'all',
        date: d.date || new Date().toLocaleDateString()
      });
    });

    if (cloudList.length > 0) {
      // Merge unique by id or composite
      const map = new Map<string, LeaderboardEntry>();
      [...cloudList, ...localList].forEach(e => {
        const key = `${e.playerName}_${e.score}_${e.date}`;
        if (!map.has(key)) map.set(key, e);
      });
      return Array.from(map.values()).sort((a, b) => b.score - a.score).slice(0, 50);
    }
  } catch (e) {
    console.warn('Error fetching cloud leaderboard, falling back to local:', e);
  }

  return localList.sort((a, b) => b.score - a.score).slice(0, 50);
}

const DEFAULT_PERSONAL_RECORDS: PersonalRecords = {
  highestScore: 0,
  highestAccuracy: 0,
  longestStreak: 0,
  fastestAnswerSeconds: 0,
  totalCardsLearned: 0,
  totalRoundsCompleted: 0,
  lastUpdated: new Date().toISOString()
};

/**
 * Get the current user's personal records from localStorage
 */
export function getPersonalRecords(): PersonalRecords {
  try {
    const raw = localStorage.getItem(STORAGE_PERSONAL_RECORDS);
    if (!raw) return DEFAULT_PERSONAL_RECORDS;
    return { ...DEFAULT_PERSONAL_RECORDS, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('Could not read personal records:', e);
    return DEFAULT_PERSONAL_RECORDS;
  }
}

/**
 * Update personal records and identify broken high scores
 */
export async function updatePersonalRecords(data: {
  score?: number;
  accuracy?: number;
  streak?: number;
  answerTimeSeconds?: number;
  cardsCount?: number;
  roundsCount?: number;
}): Promise<{ records: PersonalRecords; newBests: string[] }> {
  const current = getPersonalRecords();
  const newBests: string[] = [];

  const updated: PersonalRecords = {
    ...current,
    totalCardsLearned: current.totalCardsLearned + (data.cardsCount || 0),
    totalRoundsCompleted: current.totalRoundsCompleted + (data.roundsCount || 0),
    lastUpdated: new Date().toISOString()
  };

  if (typeof data.score === 'number' && data.score > current.highestScore) {
    updated.highestScore = data.score;
    newBests.push('score');
  }

  if (typeof data.accuracy === 'number' && data.accuracy > current.highestAccuracy) {
    updated.highestAccuracy = data.accuracy;
    newBests.push('accuracy');
  }

  if (typeof data.streak === 'number' && data.streak > current.longestStreak) {
    updated.longestStreak = data.streak;
    newBests.push('streak');
  }

  if (
    typeof data.answerTimeSeconds === 'number' &&
    data.answerTimeSeconds > 0 &&
    (current.fastestAnswerSeconds === 0 || data.answerTimeSeconds < current.fastestAnswerSeconds)
  ) {
    updated.fastestAnswerSeconds = Math.round(data.answerTimeSeconds * 10) / 10;
    newBests.push('speed');
  }

  try {
    localStorage.setItem(STORAGE_PERSONAL_RECORDS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not persist personal records:', e);
  }

  // If user is authenticated, also sync with Firestore user document
  if (auth.currentUser) {
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, {
        personalRecords: updated,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn('Could not sync personal records to cloud:', err);
    }
  }

  return { records: updated, newBests };
}

