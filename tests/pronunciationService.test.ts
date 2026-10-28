import { describe, it, expect } from 'vitest';
import { getPronunciationHint } from '../pronunciationService';

describe('pronunciationService', () => {
  it('returns native Persian pronunciation and IPA for Dutch words like komen', () => {
    const hintFa = getPronunciationHint('komen', 'nl', 'fa');
    expect(hintFa).toContain('تلفظ:');
    expect(hintFa).toContain('کومِن');
    expect(hintFa).toContain('koː.mən');
  });

  it('returns English phonetic respelling for Dutch words when native language is English', () => {
    const hintEn = getPronunciationHint('komen', 'nl', 'en');
    expect(hintEn).toContain('Pronunciation:');
    expect(hintEn).toContain('KOH-men');
    expect(hintEn).toContain('koː.mən');
  });

  it('handles Dutch phrases like dank je wel and alsjeblieft', () => {
    const hintDankJe = getPronunciationHint('dank je wel', 'nl', 'fa');
    expect(hintDankJe).toContain('تلفظ:');
    expect(hintDankJe).toContain('دانک');

    const hintAlsjeblieft = getPronunciationHint('alsjeblieft', 'nl', 'fa');
    expect(hintAlsjeblieft).toContain('تلفظ:');
    expect(hintAlsjeblieft).toContain('آلس‌یِه‌بلیفت');
  });

  it('preserves and wraps existing card pronunciation accurately', () => {
    const hintExisting = getPronunciationHint('check please', 'en-US', 'fa', 'چِک، پلیز!');
    expect(hintExisting).toBe('تلفظ: «چِک، پلیز!»');
  });

  it('transliterates Dutch words not in dictionary into Persian phonetics and IPA', () => {
    const hintNewWord = getPronunciationHint('fietsroute', 'nl', 'fa');
    expect(hintNewWord).toContain('تلفظ:');
    expect(hintNewWord).toContain('فیتس');
  });

  it('provides pronunciation for German and French words', () => {
    const hintDe = getPronunciationHint('danke schön', 'de', 'fa');
    expect(hintDe).toContain('دانکِه شُون');

    const hintFr = getPronunciationHint('bonjour', 'fr', 'fa');
    expect(hintFr).toContain('بُنژور');
  });

  it('returns empty string when pronunciation is identical to targetText or unavailable', () => {
    // When text is same as existing pronunciation, return empty string
    const hintDuplicate = getPronunciationHint('لامپ راهرو سوخته', 'fa', 'en', 'لامپ راهرو سوخته');
    expect(hintDuplicate).toBe('');

    // When language has no phonetic transliteration and no dictionary entry, return empty string (never wrap in fake brackets)
    const hintUnknown = getPronunciationHint('xyz123random', 'ku', 'fa');
    expect(hintUnknown).toBe('');
  });
});
