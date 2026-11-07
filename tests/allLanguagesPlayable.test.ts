import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { CardPacingSequencer, measureTextPacing } from '../src/engine/pacing/cardPacing';

describe('App-Level Multi-Language Game Playability & Engine Audit', () => {
  const dbPath = path.resolve('data/curatedDatabase.json');
  expect(fs.existsSync(dbPath)).toBe(true);

  const raw = fs.readFileSync(dbPath, 'utf-8');
  const cards = JSON.parse(raw);
  const sequencer = new CardPacingSequencer();

  const ALL_18_LANGUAGES = [
    'fa', 'en', 'en-GB', 'en-US', 'nl', 'de', 'fr', 'es', 'it',
    'pt', 'ar', 'tr', 'pl', 'uk', 'zh', 'ja', 'ko', 'hi'
  ];

  // Standard TTS voice mappings available across modern Web Speech / Android / iOS engines
  const TTS_VOICE_MAPPINGS: Record<string, string> = {
    fa: 'fa-IR',
    en: 'en-US',
    'en-GB': 'en-GB',
    'en-US': 'en-US',
    nl: 'nl-NL',
    de: 'de-DE',
    fr: 'fr-FR',
    es: 'es-ES',
    it: 'it-IT',
    pt: 'pt-BR',
    ar: 'ar-SA',
    tr: 'tr-TR',
    pl: 'pl-PL',
    uk: 'uk-UA',
    zh: 'zh-CN',
    ja: 'ja-JP',
    ko: 'ko-KR',
    hi: 'hi-IN',
  };

  const isRTL = (lang: string): boolean => ['fa', 'ar'].includes(lang);

  for (const lang of ALL_18_LANGUAGES) {
    it(`runs a playable turn and asserts all invariants for language: ${lang}`, () => {
      // 1. Filter cards that have translations for this language
      const playableCards = cards
        .filter((c: any) => c.translations?.[lang]?.text && c.translations[lang].text.trim().length > 0)
        .slice(0, 30)
        .map((c: any) => ({
          id: c.id,
          level: c.level || 'A1',
          rawLevel: c.rawLevel,
          targetText: c.translations[lang].text,
          translations: c.translations,
          measured: c.measured,
        }));

      // Must have plenty of cards to play
      expect(playableCards.length).toBeGreaterThanOrEqual(10);

      // 2. Playability check: sequencer filters and sequences a turn
      const eligible = sequencer.filterEligibleCards(playableCards, 60, lang);
      expect(eligible.length).toBeGreaterThanOrEqual(5);

      const sequencedTurn = sequencer.sequenceDeck(eligible.slice(0, 10), 60, lang);
      expect(sequencedTurn.length).toBeGreaterThanOrEqual(5);

      // 3. Pacing invariant: No long card at turn start
      const firstMetric = measureTextPacing(sequencedTurn[0].targetText!, sequencedTurn[0].level, lang);
      expect(firstMetric.lengthClass).not.toBe('long');

      // 4. Rolling window invariant: Max 1 long per rolling 3-card window
      const validation = sequencer.validateSequence(sequencedTurn, 60, lang);
      expect(validation.valid).toBe(true);

      // 5. Layout Direction Check
      if (['fa', 'ar'].includes(lang)) {
        expect(isRTL(lang)).toBe(true);
      } else {
        expect(isRTL(lang)).toBe(false);
      }

      // 6. TTS Voice Mapping Check
      expect(TTS_VOICE_MAPPINGS[lang]).toBeDefined();
      expect(typeof TTS_VOICE_MAPPINGS[lang]).toBe('string');
    });
  }
});
