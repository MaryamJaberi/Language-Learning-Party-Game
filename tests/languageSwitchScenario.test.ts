import { describe, it, expect } from 'vitest';
import { SUPPORTED_LANGUAGES } from '../constants';
import { TRANSLATIONS } from '../translations';
import { tUI, tf, isRtlLang, getTeamName, resolveUiLang } from '../ui';
import { getRandomCharacters } from '../characters';
import { Language } from '../types';

describe('Complete Language Switching & Localization Scenario Test', () => {
  it('covers all 38 supported languages in SUPPORTED_LANGUAGES', () => {
    expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(38);
    const codes = SUPPORTED_LANGUAGES.map(l => l.code);
    expect(codes).toContain('fa');
    expect(codes).toContain('en');
    expect(codes).toContain('en-US');
    expect(codes).toContain('de');
    expect(codes).toContain('fr');
    expect(codes).toContain('es');
    expect(codes).toContain('it');
    expect(codes).toContain('ar');
    expect(codes).toContain('tr');
    expect(codes).toContain('ru');
    expect(codes).toContain('zh');
    expect(codes).toContain('ja');
    expect(codes).toContain('ko');
    expect(codes).toContain('pt');
    expect(codes).toContain('hi');
  });

  it('correctly classifies RTL and LTR languages', () => {
    const rtlLanguages: Language[] = ['fa', 'ar', 'ur', 'he', 'ku'];
    for (const lang of rtlLanguages) {
      expect(isRtlLang(lang), `${lang} should be RTL`).toBe(true);
    }

    const ltrLanguages: Language[] = ['en', 'en-US', 'de', 'fr', 'es', 'it', 'nl', 'tr', 'ru', 'zh', 'ja', 'ko', 'pt', 'hi', 'sv', 'pl', 'uk'];
    for (const lang of ltrLanguages) {
      expect(isRtlLang(lang), `${lang} should be LTR`).toBe(false);
    }
  });

  it('generates culturally appropriate character names for each language', () => {
    for (const lang of ['fa', 'en', 'de', 'fr', 'es', 'it', 'ar', 'tr', 'ru', 'zh', 'ja', 'ko', 'pt', 'hi', 'sv', 'nl', 'pl', 'uk']) {
      const names = getRandomCharacters(lang as Language, 8);
      expect(names).toHaveLength(8);
      expect(names.every(n => typeof n === 'string' && n.length > 0)).toBe(true);

      // Verify that Persian names contain Persian characters
      if (lang === 'fa') {
        expect(names.some(n => /[\u0600-\u06FF]/.test(n))).toBe(true);
      }
      // Verify that English names do NOT contain Persian characters
      if (lang === 'en' || lang === 'en-US') {
        expect(names.some(n => /[\u0600-\u06FF]/.test(n))).toBe(false);
      }
      // Verify that Russian names contain Cyrillic characters
      if (lang === 'ru') {
        expect(names.some(n => /[\u0400-\u04FF]/.test(n))).toBe(true);
      }
      // Verify that Chinese names contain CJK characters
      if (lang === 'zh') {
        expect(names.some(n => /[\u4E00-\u9FFF]/.test(n))).toBe(true);
      }
      // Verify that Japanese names contain Japanese characters
      if (lang === 'ja') {
        expect(names.some(n => /[\u3040-\u30FF]/.test(n))).toBe(true);
      }
      // Verify that Korean names contain Hangul characters
      if (lang === 'ko') {
        expect(names.some(n => /[\uAC00-\uD7AF]/.test(n))).toBe(true);
      }
    }
  });

  it('returns localized team names for each language', () => {
    expect(getTeamName(0, 'fa')).toContain('آبی');
    expect(getTeamName(1, 'fa')).toContain('قرمز');

    expect(getTeamName(0, 'en')).toContain('Blue');
    expect(getTeamName(1, 'en')).toContain('Red');

    expect(getTeamName(0, 'es')).toContain('Azul');
    expect(getTeamName(1, 'es')).toContain('Rojo');

    expect(getTeamName(0, 'de')).toContain('Blau');
    expect(getTeamName(1, 'de')).toContain('Rot');

    expect(getTeamName(0, 'fr')).toContain('Bleu');
    expect(getTeamName(1, 'fr')).toContain('Rouge');

    expect(getTeamName(0, 'ru')).toContain('Синий');
    expect(getTeamName(1, 'ru')).toContain('Красный');

    expect(getTeamName(0, 'zh')).toContain('蓝');
    expect(getTeamName(1, 'zh')).toContain('红');

    expect(getTeamName(0, 'ja')).toContain('青');
    expect(getTeamName(1, 'ja')).toContain('赤');
  });

  it('ensures tUI(lang) returns non-empty translations for every supported language', () => {
    for (const langObj of SUPPORTED_LANGUAGES) {
      const lang = langObj.code;
      const pack = tUI(lang);
      expect(pack).toBeDefined();

      // Crucial keys must be present and non-empty
      expect(pack.title, `title for ${lang}`).toBeTruthy();
      expect(pack.startNewGame, `startNewGame for ${lang}`).toBeTruthy();
      expect(pack.setup, `setup for ${lang}`).toBeTruthy();
      expect(pack.guide, `guide for ${lang}`).toBeTruthy();
      expect(pack.history, `history for ${lang}`).toBeTruthy();
      expect(pack.players, `players for ${lang}`).toBeTruthy();
      expect(pack.rounds, `rounds for ${lang}`).toBeTruthy();
      expect(pack.singlePlayerBtn, `singlePlayerBtn for ${lang}`).toBeTruthy();
      expect(pack.onlineRoom, `onlineRoom for ${lang}`).toBeTruthy();
    }
  });

  it('ensures major non-English languages are actually translated and not left in English', () => {
    const testCases: { lang: Language; startNewGameExpectedNot: string }[] = [
      { lang: 'fa', startNewGameExpectedNot: 'Start New Game' },
      { lang: 'es', startNewGameExpectedNot: 'Start New Game' },
      { lang: 'de', startNewGameExpectedNot: 'Start New Game' },
      { lang: 'fr', startNewGameExpectedNot: 'Start New Game' },
      { lang: 'it', startNewGameExpectedNot: 'Start New Game' },
      { lang: 'ru', startNewGameExpectedNot: 'Start New Game' },
      { lang: 'tr', startNewGameExpectedNot: 'Start New Game' },
      { lang: 'ar', startNewGameExpectedNot: 'Start New Game' },
      { lang: 'zh', startNewGameExpectedNot: 'Start New Game' },
      { lang: 'ja', startNewGameExpectedNot: 'Start New Game' },
      { lang: 'ko', startNewGameExpectedNot: 'Start New Game' },
      { lang: 'pt', startNewGameExpectedNot: 'Start New Game' },
      { lang: 'hi', startNewGameExpectedNot: 'Start New Game' },
      { lang: 'nl', startNewGameExpectedNot: 'Start New Game' }
    ];

    for (const { lang, startNewGameExpectedNot } of testCases) {
      const pack = tUI(lang);
      expect(pack.startNewGame, `startNewGame in ${lang} should not be English`).not.toBe(startNewGameExpectedNot);
      expect(pack.startNewGame, `startNewGame in ${lang} should not be empty`).toBeTruthy();
    }
  });

  it('formats strings with tf() correctly', () => {
    const s1 = tf('en', 'stepOf', { n: 1, total: 4 });
    expect(s1).toBe('Step 1 of 4');

    const s2 = tf('fa', 'stepOf', { n: 2, total: 4 });
    expect(s2).toBe('مرحله ۲ از ۴');
  });
});
