import { describe, test, expect } from 'vitest';
import { preloadLanguageDecks, cardsFromPhraseBank, isLanguageDeckLoaded } from '../phraseBank';

describe('Preload ALL Selected Languages (Native + Multiple Targets)', () => {
  test('preloads 1 native + 3 target languages simultaneously and generates multi-target cards', async () => {
    const nativeLang = 'fa';
    const targetLangs = ['nl', 'de', 'fr'];
    const allSelected = [nativeLang, ...targetLangs];

    // 1. Preload all selected languages
    await preloadLanguageDecks(allSelected);

    // 2. Verify all 4 languages are loaded in memory
    for (const lang of allSelected) {
      expect(isLanguageDeckLoaded(lang)).toBe(true);
    }

    // 3. Generate cards for all 3 targets in a multi-language party game
    const cards = cardsFromPhraseBank(targetLangs as any, [], 'A1', nativeLang as any, 'standard');
    expect(cards.length).toBeGreaterThanOrEqual(15);

    // Check that cards exist for each target language
    const targetsInDeck = new Set(cards.map((c) => c.targetLanguage));
    expect(targetsInDeck.has('nl')).toBe(true);
    expect(targetsInDeck.has('de')).toBe(true);
    expect(targetsInDeck.has('fr')).toBe(true);
  });
});
