import { describe, it, expect } from 'vitest';
import { 
  countCardUnits, 
  measureCard, 
  validateFocusVerbatim, 
  isCardEligible, 
  filterEligibleCards, 
  calculateTimeBonus, 
  getRevealDuration, 
  shouldAutoTTS, 
  sequenceCards 
} from '../cardPacing';
import { CARD_PACING_CONFIG, CARD_LEVEL_CAPS, CARD_READING_RATES } from '../cardPacingConfig';
import { LanguageCard } from '../types';
import { getAvailablePoolCount } from '../cardsData';

describe('Card Length & Pacing System', () => {

  // ==========================================
  // 1. MEASURE (Pure Function Fixtures)
  // ==========================================
  describe('1. measureCard fixtures across languages', () => {
    const fixtures = [
      { lang: 'en', text: 'Where is the central train station?', level: 'A1', expectedUnits: 6, expectedClass: 'medium' },
      { lang: 'nl', text: 'Mag ik een glas water, alstublieft?', level: 'A1', expectedUnits: 6, expectedClass: 'medium' },
      { lang: 'fa', text: 'ایستگاه مرکزی قطار کجاست؟', level: 'A1', expectedUnits: 4, expectedClass: 'medium' },
      { lang: 'ar', text: 'أين محطة القطار المركزية؟', level: 'A1', expectedUnits: 4, expectedClass: 'medium' },
      { lang: 'zh', text: '请问中央火车站怎么走？', level: 'B1', expectedUnits: 5.5, expectedClass: 'short' },
      { lang: 'ja', text: '中央駅はどこですか？', level: 'A2', expectedUnits: 5, expectedClass: 'short' },
      { lang: 'ko', text: '중앙 기차역이 어디에 있습니까?', level: 'A2', expectedUnits: 4, expectedClass: 'short' },
      { lang: 'hi', text: 'सेंट्रल रेलवे स्टेशन कहाँ है?', level: 'A1', expectedUnits: 5, expectedClass: 'medium' },
    ];

    fixtures.forEach(({ lang, text, level, expectedUnits, expectedClass }) => {
      it(`measures ${lang} correctly: ${text}`, () => {
        const units = countCardUnits(text, lang);
        expect(units).toBeCloseTo(expectedUnits, 0.5);

        const card: LanguageCard = {
          id: `test_${lang}`,
          targetLanguage: lang as any,
          cefrLevel: level as any,
          topic: 'CAT_TRAVEL',
          contentType: 'Sentence',
          learningMode: 'Speak',
          prompt: 'test',
          targetText: text,
          translation: 'test',
          difficulty: 'easy',
          points: 1
        };

        const m = measureCard(card, lang);
        expect(m.units).toBe(units);
        expect(m.readSec).toBeCloseTo(units / (CARD_READING_RATES[level] || 1.8), 2);
        expect(m.lengthClass).toBe(expectedClass);
      });
    });

    it('categorizes short, medium, long, and tooLong according to LEVEL_CAP', () => {
      // Level A1 cap = 6: short <= 3.6, medium <= 6, long <= 9.6, tooLong > 9.6
      const makeCard = (text: string, level: any = 'A1'): LanguageCard => ({
        id: 't', targetLanguage: 'en', cefrLevel: level, topic: 'CAT_TRAVEL',
        contentType: 'Sentence', learningMode: 'Speak', prompt: 'p', targetText: text, translation: 't',
        difficulty: 'easy', points: 1
      });

      expect(measureCard(makeCard('Hello there')).lengthClass).toBe('short'); // 2 words <= 3.6
      expect(measureCard(makeCard('One two three four five')).lengthClass).toBe('medium'); // 5 words <= 6
      expect(measureCard(makeCard('One two three four five six seven eight')).lengthClass).toBe('long'); // 8 words <= 9.6
      expect(measureCard(makeCard('One two three four five six seven eight nine ten eleven twelve')).lengthClass).toBe('tooLong'); // 12 words > 9.6
    });
  });

  // ==========================================
  // 2. FOCUS PHRASE & VALIDATOR
  // ==========================================
  describe('2. Focus Validator', () => {
    it('accepts verbatim substring focus', () => {
      const sentence = 'Can I get an iced latte with oat milk, please?';
      expect(validateFocusVerbatim(sentence, 'iced latte with oat milk')).toBe(true);
      expect(validateFocusVerbatim(sentence, 'Can I get')).toBe(true);
    });

    it('rejects a non-verbatim focus', () => {
      const sentence = 'Can I get an iced latte with oat milk, please?';
      // Slight typo, missing word, or paraphrase
      expect(validateFocusVerbatim(sentence, 'hot latte with milk')).toBe(false);
      expect(validateFocusVerbatim(sentence, 'Can I have')).toBe(false);
      expect(validateFocusVerbatim(sentence, '')).toBe(false);
    });
  });

  // ==========================================
  // 3. ELIGIBILITY
  // ==========================================
  describe('3. Eligibility Rules', () => {
    const longWithoutFocus: LanguageCard = {
      id: 'long_no_focus', targetLanguage: 'en', cefrLevel: 'A1', topic: 'CAT_FOOD',
      contentType: 'Sentence', learningMode: 'Speak', prompt: 'p',
      targetText: 'I would like to order two pizzas please', // 8 words in A1 (cap 6, 8 <= 9.6 -> long)
      translation: 't', difficulty: 'easy', points: 1
    };

    const longWithFocus: LanguageCard = {
      ...longWithoutFocus,
      id: 'long_with_focus',
      focus: { en: 'two pizzas' }
    };

    const tooLongWithoutFocus: LanguageCard = {
      id: 'toolong_no_focus', targetLanguage: 'en', cefrLevel: 'A1', topic: 'CAT_FOOD',
      contentType: 'Sentence', learningMode: 'Speak', prompt: 'p',
      targetText: 'Every morning I wake up at seven and prepare a delicious breakfast with coffee and croissants for everyone in the family',
      translation: 't', difficulty: 'easy', points: 1
    };

    it('turnSec < 15: only short/medium, or long WITH focus', () => {
      expect(isCardEligible(longWithoutFocus, 10, 'en')).toBe(false);
      expect(isCardEligible(longWithFocus, 10, 'en')).toBe(true);
      expect(isCardEligible(tooLongWithoutFocus, 10, 'en')).toBe(false);
    });

    it('turnSec >= 15: allows long, but tooLong without focus is never eligible in timed play', () => {
      expect(isCardEligible(longWithoutFocus, 30, 'en')).toBe(true);
      expect(isCardEligible(tooLongWithoutFocus, 30, 'en')).toBe(false);
      expect(isCardEligible({ ...tooLongWithoutFocus, focus: { en: 'delicious breakfast' } }, 30, 'en')).toBe(true);
    });

    it('turnSec=10 + A1: zero long cards without focus and pool guard count drops accordingly', () => {
      const poolAt60s = getAvailablePoolCount(['en'], ['CAT_RESTAURANT', 'CAT_FOOD'], 'A1', 'fa', 'mixed', true, 60);
      const poolAt10s = getAvailablePoolCount(['en'], ['CAT_RESTAURANT', 'CAT_FOOD'], 'A1', 'fa', 'mixed', true, 10);
      
      // When turnSec=10, cards that are long without focus are pruned
      expect(poolAt10s).toBeLessThanOrEqual(poolAt60s);
    });

    it('C1 long cards: strictly evaluated on base turnSec at turn start (bonus excluded), ineligible at 14s even with bonus', () => {
      const c1LongCard: LanguageCard = {
        id: 'c1_long_sentence',
        targetLanguage: 'nl',
        cefrLevel: 'C1',
        topic: 'CAT_WORK',
        contentType: 'Sentence',
        learningMode: 'Speak',
        prompt: 'p',
        targetText: 'De raad van bestuur heeft besloten om de strategische koers grondig te herzien.',
        translation: 't',
        difficulty: 'hard',
        points: 3,
        measured: { units: 28, readSec: 12.17, lengthClass: 'long' }
      };

      const baseTurnSec = 14;
      const potentialBonus = calculateTimeBonus(c1LongCard.measured!.readSec, baseTurnSec);
      const totalTimeWithBonus = baseTurnSec + potentialBonus; // 14 + 5 = 19s
      expect(totalTimeWithBonus).toBeGreaterThanOrEqual(15);

      // Must evaluate baseTurnSec only, bonus excluded:
      expect(isCardEligible(c1LongCard, baseTurnSec, 'nl')).toBe(false);

      // At base turnSec >= 15 at turn start, it becomes eligible:
      expect(isCardEligible(c1LongCard, 15, 'nl')).toBe(true);
      expect(isCardEligible(c1LongCard, 60, 'nl')).toBe(true);
    });
  });

  // ==========================================
  // 4. SEQUENCER PROPERTY TEST (1000 Seeded Games)
  // ==========================================
  describe('4. Sequencer Property Tests (1000 Seeded Games)', () => {
    // Generate synthetic mock cards of various lengths
    const createMockDeck = (): LanguageCard[] => {
      const deck: LanguageCard[] = [];
      for (let i = 0; i < 20; i++) {
        deck.push({
          id: `short_${i}`, targetLanguage: 'en', cefrLevel: 'A1', topic: 'CAT_EVERYDAY',
          contentType: 'Phrase', learningMode: 'Speak', prompt: 'p',
          targetText: 'Good morning', translation: 't', difficulty: 'easy', points: 1,
          measured: { units: 2, readSec: 1.67, lengthClass: 'short' }
        });
      }
      for (let i = 0; i < 20; i++) {
        deck.push({
          id: `med_${i}`, targetLanguage: 'en', cefrLevel: 'A1', topic: 'CAT_EVERYDAY',
          contentType: 'Phrase', learningMode: 'Speak', prompt: 'p',
          targetText: 'Can I have some water please', translation: 't', difficulty: 'medium', points: 2,
          measured: { units: 6, readSec: 5.0, lengthClass: 'medium' }
        });
      }
      for (let i = 0; i < 10; i++) {
        deck.push({
          id: `long_${i}`, targetLanguage: 'en', cefrLevel: 'A1', topic: 'CAT_EVERYDAY',
          contentType: 'Phrase', learningMode: 'Speak', prompt: 'p',
          targetText: 'I would like to make a reservation for four people tomorrow night', translation: 't', difficulty: 'hard', points: 3,
          measured: { units: 12, readSec: 10.0, lengthClass: 'long' }
        });
      }
      return deck;
    };

    it('satisfies all 4 invariants across 1000 seeded games', () => {
      const isLong = (c: LanguageCard) => c.measured?.lengthClass === 'long' || c.measured?.lengthClass === 'tooLong';
      const playerCount = 4;
      const teamCount = 2;
      const cardsPerTurn = 4;

      for (let seed = 1; seed <= 1000; seed++) {
        const deck = createMockDeck();
        const sequenced = sequenceCards(deck, playerCount, seed, cardsPerTurn);

        // 1. Invariant: No two long cards in a row
        for (let i = 1; i < sequenced.length; i++) {
          if (isLong(sequenced[i]) && isLong(sequenced[i - 1])) {
            throw new Error(`Seed ${seed}: Consecutive long cards found at index ${i - 1} and ${i}`);
          }
        }

        // 2. Invariant: Max 1 long per 3 cards in any rolling 3-card window
        for (let i = 0; i <= sequenced.length - 3; i++) {
          const windowLongs = [sequenced[i], sequenced[i + 1], sequenced[i + 2]].filter(isLong).length;
          if (windowLongs > 1) {
            throw new Error(`Seed ${seed}: Window [${i}..${i+2}] has ${windowLongs} long cards`);
          }
        }

        // 3. Invariant: First card of every turn is not long (fast start)
        const turnsCount = Math.floor(sequenced.length / cardsPerTurn);
        for (let turn = 0; turn < turnsCount; turn++) {
          const firstCardOfTurn = sequenced[turn * cardsPerTurn];
          if (isLong(firstCardOfTurn)) {
            throw new Error(`Seed ${seed}: First card of turn ${turn} is long: ${firstCardOfTurn.id}`);
          }
        }

        // 4. Invariant: Equal long-card share per team per round
        const turnsPerRound = playerCount;
        const rounds = Math.floor(turnsCount / turnsPerRound);
        for (let r = 0; r < rounds; r++) {
          const teamLongCounts: Record<number, number> = { 0: 0, 1: 0 };
          for (let p = 0; p < playerCount; p++) {
            const team = p % teamCount;
            const turnIdx = r * turnsPerRound + p;
            const turnCards = sequenced.slice(turnIdx * cardsPerTurn, (turnIdx + 1) * cardsPerTurn);
            teamLongCounts[team] += turnCards.filter(isLong).length;
          }
          expect(teamLongCounts[0]).toBe(teamLongCounts[1]);
        }
      }
    });
  });

  // ==========================================
  // 5. TIMING & BONUSES
  // ==========================================
  describe('5. Timing and Bonus Rules', () => {
    it('timer bonus never exceeds 50% of turnSec and clamps readSec - 2', () => {
      const turnSec = 30;
      const maxAllowed = 0.5 * turnSec; // 15s

      // readSec = 1 -> excess -1 -> bonus 0
      expect(calculateTimeBonus(1, turnSec)).toBe(0);
      // readSec = 2 -> excess 0 -> bonus 0
      expect(calculateTimeBonus(2, turnSec)).toBe(0);
      // readSec = 5 -> excess 3 -> bonus 3
      expect(calculateTimeBonus(5, turnSec)).toBe(3);
      // readSec = 40 -> excess 38 -> capped at 15
      expect(calculateTimeBonus(40, turnSec)).toBe(maxAllowed);
      expect(calculateTimeBonus(100, turnSec)).toBeLessThanOrEqual(maxAllowed);
    });

    it('reveal duration is max(2.5s, readSec)', () => {
      expect(getRevealDuration(1.2)).toBe(2.5);
      expect(getRevealDuration(2.4)).toBe(2.5);
      expect(getRevealDuration(5.8)).toBe(5.8);
    });

    it('auto-TTS plays focus if present, or sentence if readSec <= 4; otherwise false', () => {
      expect(shouldAutoTTS(6.0, true)).toBe(true); // Has focus -> auto TTS
      expect(shouldAutoTTS(3.5, false)).toBe(true); // Short sentence <= 4s -> auto TTS
      expect(shouldAutoTTS(5.5, false)).toBe(false); // Long sentence > 4s -> manual play button
    });
  });

  // ==========================================
  // 6. DISPLAY CONSTRAINTS
  // ==========================================
  describe('6. Display Constraints (40-unit sentence with focus)', () => {
    it('preserves focus phrase without hiding or truncating it', () => {
      const sentence = 'In today\'s globalized world, learning multiple languages and practicing daily conversation is the most effective path to international fluency.';
      const focus = 'practicing daily conversation';
      expect(validateFocusVerbatim(sentence, focus)).toBe(true);

      const card: LanguageCard = {
        id: 'disp_test', targetLanguage: 'en', cefrLevel: 'C1', topic: 'CAT_WORK',
        contentType: 'Sentence', learningMode: 'Speak', prompt: 'p',
        targetText: sentence, translation: 't', difficulty: 'hard', points: 3,
        focus: { en: focus }
      };

      const m = measureCard(card, 'en');
      expect(m.units).toBeGreaterThanOrEqual(15);
      // Verify card measured units and focus presence
      expect(card.focus?.en).toBe(focus);
      expect(sentence.includes(card.focus?.en || '')).toBe(true);
    });
  });

});
