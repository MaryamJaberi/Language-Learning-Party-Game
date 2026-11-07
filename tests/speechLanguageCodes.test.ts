import { describe, test, expect } from 'vitest';
import { SPEECH_LANG_MAP, getSpeechLanguageCode, SUPPORTED_LANGUAGES } from '../constants';

describe('Speech Recognition BCP-47 Language Codes for All 18 Locales', () => {
  const expectedCodes: Record<string, string> = {
    'en': 'en-GB',
    'en-US': 'en-US',
    'en-GB': 'en-GB',
    'fa': 'fa-IR',
    'ar': 'ar-SA',
    'nl': 'nl-NL',
    'de': 'de-DE',
    'fr': 'fr-FR',
    'es': 'es-ES',
    'it': 'it-IT',
    'pt': 'pt-BR',
    'tr': 'tr-TR',
    'pl': 'pl-PL',
    'uk': 'uk-UA',
    'zh': 'zh-CN',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'hi': 'hi-IN'
  };

  test('contains valid BCP-47 codes for all 18 primary languages (pt uses pt-BR, sv removed)', () => {
    expect(Object.keys(expectedCodes).length).toBe(18);
    expect(expectedCodes['pt']).toBe('pt-BR');
    expect(expectedCodes['sv']).toBeUndefined();

    Object.entries(expectedCodes).forEach(([lang, expectedCode]) => {
      const code = getSpeechLanguageCode(lang);
      expect(code).toBe(expectedCode);
      expect(code).toMatch(/^[a-z]{2,3}-[A-Z]{2,4}$/);
    });
  });

  test('SUPPORTED_LANGUAGES includes pt-BR for Portuguese and matches getSpeechLanguageCode', () => {
    const ptLang = SUPPORTED_LANGUAGES.find(l => l.code === 'pt');
    expect(ptLang).toBeDefined();
    expect(ptLang?.speechCode).toBe('pt-BR');
  });

  test('falls back gracefully on unknown or partial codes', () => {
    expect(getSpeechLanguageCode('')).toBe('en-US');
    expect(getSpeechLanguageCode('xy-ZW')).toBe('xy-ZW');
  });
});
