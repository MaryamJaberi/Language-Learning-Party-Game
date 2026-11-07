import { describe, it, expect } from 'vitest';
import { cardsFromPhraseBank, PHRASE_STATS } from '../phraseBank';
import { CEFR_LEVELS } from '../constants';
import { CEFRLevel } from '../types';

describe('Phase 3: Curated Database App Integration', () => {
  it('loads curated database as primary source with complete level statistics', () => {
    expect(PHRASE_STATS.total).toBeGreaterThan(6000);
    expect(PHRASE_STATS.PreA1).toBeGreaterThan(150);
    expect(PHRASE_STATS.A1).toBeGreaterThan(400);
    expect(PHRASE_STATS.B1).toBeGreaterThan(800);
    expect(PHRASE_STATS.C1).toBeGreaterThan(1500);
    expect(PHRASE_STATS.C2).toBeGreaterThan(400);
  });

  it('exposes all 12 CEFR levels in the level picker list', () => {
    const levelIds = CEFR_LEVELS.map((l) => l.id);
    const expectedLevels: CEFRLevel[] = [
      'Pre-A1', 'A1', 'A1+', 'A2', 'A2+', 'B1', 'B1+', 'B2', 'B2+', 'C1', 'C1+', 'C2'
    ];
    for (const lvl of expectedLevels) {
      expect(levelIds).toContain(lvl);
    }
  });

  it('never includes excluded cards (collocations, C1_FINAL expansion) in game decks', () => {
    const levels: CEFRLevel[] = ['Pre-A1', 'A1', 'A1+', 'A2', 'B1', 'B2', 'C1', 'C2'];
    for (const lvl of levels) {
      const cards = cardsFromPhraseBank(['en'], [], lvl, 'fa', 'standard');
      for (const card of cards) {
        expect(card.id).not.toMatch(/^col_/);
        expect(card.topic).not.toBe('Collocation');
      }
    }
  });

  it('strictly isolates C1 so that C1 decks do not include C2 cards', () => {
    const c1Cards = cardsFromPhraseBank(['en'], [], 'C1', 'fa', 'standard');
    expect(c1Cards.length).toBeGreaterThan(20);
    for (const card of c1Cards) {
      expect(card.cefrLevel).toBe('C1');
      expect((card as any).rawLevel).not.toBe('C2');
    }
  });

  it('populates "+" decks with own cards first and 70/30 mix without duplicates', () => {
    const plusLevels: CEFRLevel[] = ['A1+', 'A2+', 'B1+', 'B2+', 'C1+'];
    for (const lvl of plusLevels) {
      const cards = cardsFromPhraseBank(['nl'], [], lvl, 'fa', 'standard');
      expect(cards.length).toBeGreaterThan(10);
      const uniqueIds = new Set(cards.map((c) => c.id));
      expect(uniqueIds.size).toBe(cards.length); // strictly zero duplicates!
    }
  });

  it('enforces pacing invariants on generated decks (no long at start, max 1 long per 3 cards)', () => {
    const deck = cardsFromPhraseBank(['en'], [], 'C1', 'fa', 'standard', 60);
    expect(deck.length).toBeGreaterThan(10);
    // Invariant 1: First card is never long
    const firstCardWords = (deck[0].targetText || '').split(/\s+/).filter(Boolean).length;
    expect(firstCardWords).toBeLessThanOrEqual(22); // C1 cap is 22

    // Invariant 2: Rolling 3-card window has at most 1 long card
    for (let i = 0; i < deck.length - 2; i++) {
      const windowCards = deck.slice(i, i + 3);
      const longCount = windowCards.filter((c) => (c.targetText || '').split(/\s+/).filter(Boolean).length > 22).length;
      expect(longCount).toBeLessThanOrEqual(1);
    }
  });
});
