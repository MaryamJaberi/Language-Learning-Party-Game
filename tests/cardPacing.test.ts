import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { CardPacingSequencer, measureTextPacing, PacedCard } from '../src/engine/pacing/cardPacing';

describe('Card Length & Pacing Sequencer (Level-Relative & Multi-Language)', () => {
  it('correctly classifies short, medium, and long cards based on level-relative caps and language', () => {
    // A0+ cap is now 5.0 (per User Decision #1):
    // short <= 3.0 (1-3 words), medium > 3.0 & <= 5.0 (4-5 words), long > 5.0 (>5 words)
    expect(measureTextPacing('Good morning', 'A0+', 'en').lengthClass).toBe('short'); // 2 units
    expect(measureTextPacing('How are you today', 'A0+', 'en').lengthClass).toBe('medium'); // 4 units <= 5.0
    expect(measureTextPacing('The wifi password is on the board', 'A0+', 'en').units).toBe(7); // 7 words > 5.0
    expect(measureTextPacing('The wifi password is on the board', 'A0+', 'en').lengthClass).toBe('long');

    // A1 cap is 6: short <= 3.6 (1-3 words), med > 3.6 & <= 6 (4-6 words), long > 6 (>6 words)
    expect(measureTextPacing('Good morning', 'A1', 'en').lengthClass).toBe('short'); // 2 units <= 3.6
    expect(measureTextPacing('How are you today friend', 'A1', 'en').lengthClass).toBe('medium'); // 5 units <= 6
    expect(measureTextPacing('How are you doing today my dear friend', 'A1', 'en').lengthClass).toBe('long'); // 8 units > 6

    // C1 cap is 22: short <= 13.2 (1-13 words), med > 13.2 & <= 22 (14-22 words), long > 22 (>22 words)
    const tenWordsC1 = 'We agreed to keep it light during the initial project discussions.';
    expect(measureTextPacing(tenWordsC1, 'C1', 'en').lengthClass).not.toBe('long');

    const longC1 = 'How far a calculated ambiguity in the wording can be attributed to design rather than drift remains contested across all comprehensive analytical reviews.';
    expect(measureTextPacing(longC1, 'C1', 'en').units).toBe(23);
    expect(measureTextPacing(longC1, 'C1', 'en').lengthClass).toBe('long'); // 23 > 22

    // CJK word units rule: Intl.Segmenter(lang, { granularity: 'word' })
    const sampleZh = '简单的测试句子';
    const zhMetrics = measureTextPacing(sampleZh, 'A1', 'zh');
    // Word segments: ['简单', '的', '测试', '句子'] -> 4 words <= A1 cap (6) -> medium
    expect(zhMetrics.units).toBe(4);
    expect(zhMetrics.lengthClass).toBe('medium');
  });

  it('excludes C1 and C1+ long cards when turnSec < 15, but NEVER excludes C2', () => {
    const sequencer = new CardPacingSequencer();
    const testCards: PacedCard[] = [
      { id: 'a1_short', level: 'A1', targetText: 'Short A1 card' },
      { id: 'c1_long', level: 'C1', rawLevel: 'C1', targetText: 'This is an exceptionally long academic sentence designed to test the C1 duration threshold for short turns and it keeps going beyond the level cap of twenty two.' },
      { id: 'c1plus_long', level: 'C1', rawLevel: 'C1+', targetText: 'Another exceptionally intricate philosophical proposition spanning across multiple conceptual domains and clauses beyond twenty five words in total length for rigorous automated unit test verification purposes.' },
      { id: 'c2_long', level: 'C2', rawLevel: 'C2', targetText: 'Even an exceptionally long C2 sentence exceeding the C2 cap of twenty eight units should never be excluded at turnSec fourteen because C2 exclusion is explicitly prohibited by specification.' },
      { id: 'b1_med', level: 'B1', targetText: 'Medium length phrase here for intermediate learners' },
    ];

    // turnSec = 14: C1 and C1+ long cards are excluded; C2 long card remains!
    const eligibleAt14 = sequencer.filterEligibleCards(testCards, 14, 'en');
    const idsAt14 = eligibleAt14.map((c) => c.id);
    expect(idsAt14).toContain('a1_short');
    expect(idsAt14).toContain('b1_med');
    expect(idsAt14).toContain('c2_long'); // C2 is NOT excluded at 14!
    expect(idsAt14).not.toContain('c1_long'); // C1 is excluded at 14
    expect(idsAt14).not.toContain('c1plus_long'); // C1+ is excluded at 14

    // turnSec = 15: All cards are eligible!
    const eligibleAt15 = sequencer.filterEligibleCards(testCards, 15, 'en');
    const idsAt15 = eligibleAt15.map((c) => c.id);
    expect(idsAt15).toEqual(['a1_short', 'c1_long', 'c1plus_long', 'c2_long', 'b1_med']);
  });

  it('guarantees no long card at turn start (index 0)', () => {
    const sequencer = new CardPacingSequencer();
    const longTextA1 = 'One two three four five six seven eight nine ten'; // 10 words > cap 6 (long)
    const shortTextA1 = 'Hi there'; // 2 words <= 3.6 (short)

    const cards: PacedCard[] = [
      { id: 'l1', level: 'A1', targetText: longTextA1 },
      { id: 'l2', level: 'A1', targetText: longTextA1 },
      { id: 's1', level: 'A1', targetText: shortTextA1 },
      { id: 's2', level: 'A1', targetText: shortTextA1 },
    ];

    const sequenced = sequencer.sequenceDeck(cards, 60, 'en');
    const firstMetric = measureTextPacing(sequenced[0].targetText!, sequenced[0].level, 'en');
    expect(firstMetric.lengthClass).not.toBe('long');
  });

  it('enforces max 1 long card per rolling 3-card window', () => {
    const sequencer = new CardPacingSequencer();
    const longTextA1 = 'One two three four five six seven eight nine ten'; // long in A1
    const shortTextA1 = 'Short';

    const cards: PacedCard[] = [
      { id: 's1', level: 'A1', targetText: shortTextA1 },
      { id: 'l1', level: 'A1', targetText: longTextA1 },
      { id: 'l2', level: 'A1', targetText: longTextA1 },
      { id: 's2', level: 'A1', targetText: shortTextA1 },
      { id: 's3', level: 'A1', targetText: shortTextA1 },
      { id: 'l3', level: 'A1', targetText: longTextA1 },
      { id: 's4', level: 'A1', targetText: shortTextA1 },
      { id: 's5', level: 'A1', targetText: shortTextA1 },
    ];

    const sequenced = sequencer.sequenceDeck(cards, 60, 'en');
    const validation = sequencer.validateSequence(sequenced, 60, 'en');
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  it('ensures team parity per round AND across whole game with odd numbers of long cards', () => {
    const sequencer = new CardPacingSequencer();
    const longText = 'One two three four five six seven eight nine ten';
    const shortText = 'One two';

    // Create an odd number of long cards (exactly 5 long cards) and 15 short cards across 3 rounds
    // 2 teams, 3 rounds, 3 cards per turn per team (total 18 cards)
    const longCards: PacedCard[] = Array.from({ length: 5 }, (_, i) => ({
      id: `l_${i}`,
      level: 'A1',
      targetText: longText,
    }));
    const shortCards: PacedCard[] = Array.from({ length: 15 }, (_, i) => ({
      id: `s_${i}`,
      level: 'A1',
      targetText: shortText,
    }));

    const deck = [...longCards, ...shortCards];
    const game = sequencer.distributeTeamGame(deck, 2, 3, 3, 60, 'en');

    let totalTeam0Long = 0;
    let totalTeam1Long = 0;

    for (let r = 0; r < 3; r++) {
      const roundTurns = game[r];
      expect(roundTurns).toHaveLength(2);

      const round0Long = roundTurns[0].filter((c) => measureTextPacing(c.targetText!, c.level, 'en').lengthClass === 'long').length;
      const round1Long = roundTurns[1].filter((c) => measureTextPacing(c.targetText!, c.level, 'en').lengthClass === 'long').length;

      // Invariant: Max difference of 1 long card per round
      expect(Math.abs(round0Long - round1Long)).toBeLessThanOrEqual(1);

      totalTeam0Long += round0Long;
      totalTeam1Long += round1Long;

      // Invariant: Max difference of 1 across the whole game at every round
      expect(Math.abs(totalTeam0Long - totalTeam1Long)).toBeLessThanOrEqual(1);

      // Verify each team turn respects turn start and rolling window
      const val0 = sequencer.validateSequence(roundTurns[0], 60, 'en');
      const val1 = sequencer.validateSequence(roundTurns[1], 60, 'en');
      expect(val0.valid).toBe(true);
      expect(val1.valid).toBe(true);
    }

    // Total long cards was 5 (odd number). One team gets 3, other gets 2.
    expect(totalTeam0Long + totalTeam1Long).toBe(5);
    expect(Math.abs(totalTeam0Long - totalTeam1Long)).toBe(1);
  });

  it('runs sequencing and validation on REAL database cards across all CEFR levels', () => {
    const dbPath = path.resolve('data/curatedDatabase.json');
    expect(fs.existsSync(dbPath)).toBe(true);

    const raw = fs.readFileSync(dbPath, 'utf-8');
    const realCards = JSON.parse(raw);
    const sequencer = new CardPacingSequencer();

    const levels = ['A0', 'A0+', 'A1', 'A1+', 'A2', 'A2+', 'B1', 'B1+', 'B2', 'B2+', 'C1', 'C1+', 'C2'];

    for (const lvl of levels) {
      const levelCards = realCards
        .filter((c: any) => c.rawLevel === lvl || c.level === lvl)
        .slice(0, 30)
        .map((c: any) => ({
          id: c.id,
          level: c.level || 'A1',
          rawLevel: c.rawLevel,
          targetText: c.translations?.en?.text || c.base_en || '',
          translations: c.translations,
          measured: c.measured,
        }));

      if (levelCards.length >= 5) {
        const sequenced = sequencer.sequenceDeck(levelCards, 60, 'en');
        expect(sequenced.length).toBe(levelCards.length);

        const validation = sequencer.validateSequence(sequenced, 60, 'en');
        expect(validation.valid).toBe(true);
        expect(validation.errors).toEqual([]);
      }
    }
  });
});
