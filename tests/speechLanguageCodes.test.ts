import { describe, test, expect } from 'vitest';
import { SPEECH_LANG_MAP, getSpeechLanguageCode, SUPPORTED_LANGUAGES } from '../constants';

describe('Speech Recognition BCP-47 Language Codes for All 18 Locales', () => {
  const expectedCodes: Record<string, string> = {
    'en': 'en-GB',
    'en-US': 'en-US',
    'fa': 'fa-IR',
    'ar': 'ar-SA',
    'nl': 'nl-NL',
    'de': 'de-DE',
    'fr': 'fr-FR',
    'es': 'es-ES',
    'it': 'it-IT',
    'pt': 'pt-PT',
    'tr': 'tr-TR',
    'pl': 'pl-PL',
    'uk': 'uk-UA',
    'zh': 'zh-CN',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'hi': 'hi-IN',
    'sv': 'sv-SE'
  };

  test('contains valid BCP-47 codes for all 18 primary languages', () => {
    Object.entries(expectedCodes).forEach(([lang, expectedCode]) => {
      const code = getSpeechLanguageCode(lang);
      expect(code).toBe(expectedCode);
      // Valid BCP-47 format with hyphen
      expect(code).toMatch(/^[a-z]{2,3}-[A-Z]{2,4}$/);
    });
  });

  test('SUPPORTED_LANGUAGES includes speechCode matching getSpeechLanguageCode', () => {
    SUPPORTED_LANGUAGES.forEach(lang => {
      if (expectedCodes[lang.code]) {
        expect(lang.speechCode).toBe(expectedCodes[lang.code]);
      }
    });
  });

  test('falls back gracefully on unknown or partial codes', () => {
    expect(getSpeechLanguageCode('')).toBe('en-US');
    expect(getSpeechLanguageCode('xy-ZW')).toBe('xy-ZW');
  });
});
