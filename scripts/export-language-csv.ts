import fs from 'fs';
import path from 'path';
import { CURATED_LANGUAGE_CARDS } from '../cardsData';
import { WORD_BANK } from '../words';
import { C1_ENTITIES } from '../c1SentencesData';
import { UNIVERSAL_CONCEPTS } from '../multiLangDictionary';

function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// 1. Export Master Combined CSV
const masterHeaders = [
  'Row_ID',
  'Data_Type',
  'Category_Topic',
  'CEFR_Difficulty',
  'Persian_Farsi',
  'English',
  'Dutch_Nederlands',
  'German_Deutsch',
  'French_Francais',
  'Spanish_Espanol',
  'Italian_Italiano',
  'Arabic',
  'Turkish',
  'Polish',
  'Ukrainian',
  'Target_Text',
  'Target_Language',
  'Pronunciation',
  'Prompt_Scenario',
  'Hint_Grammar_Note'
];

const masterRows: string[][] = [];
let rowId = 1;

// A. Vocabulary Words (242 words)
for (const w of WORD_BANK) {
  masterRows.push([
    String(rowId++),
    'Vocabulary Word',
    w.category || '',
    w.difficulty || 'easy',
    w.words.fa || '',
    w.words.en || '',
    w.words.nl || '',
    w.words.de || '',
    w.words.fr || '',
    w.words.es || '',
    w.words.it || '',
    w.words.ar || '',
    w.words.tr || '',
    w.words.pl || '',
    w.words.uk || '',
    w.words.nl || w.words.en || '',
    'nl/en/multi',
    '',
    '',
    ''
  ]);
}

// B. Curated Language Cards (Phrases, Sentences, Scenarios)
for (const c of CURATED_LANGUAGE_CARDS) {
  masterRows.push([
    String(rowId++),
    `Curated Card (${c.contentType || 'Phrase'})`,
    c.topic || '',
    c.cefrLevel || c.difficulty || 'A1',
    c.translation || '',
    c.targetLanguage.startsWith('en') ? c.targetText : '',
    c.targetLanguage === 'nl' ? c.targetText : '',
    c.targetLanguage === 'de' ? c.targetText : '',
    c.targetLanguage === 'fr' ? c.targetText : '',
    c.targetLanguage === 'es' ? c.targetText : '',
    c.targetLanguage === 'it' ? c.targetText : '',
    c.targetLanguage === 'ar' ? c.targetText : '',
    c.targetLanguage === 'tr' ? c.targetText : '',
    '',
    '',
    c.targetText || '',
    c.targetLanguage || '',
    c.pronunciation || '',
    c.prompt || '',
    [c.hint, c.grammarPoint].filter(Boolean).join(' | ')
  ]);
}

// C. C1 Advanced Expressions & Entities
for (const ent of C1_ENTITIES) {
  masterRows.push([
    String(rowId++),
    'C1 Advanced Phrase',
    ent.topic || 'CAT_SOCIAL',
    'C1',
    ent.texts.fa || '',
    ent.texts['en-US'] || ent.texts.en || '',
    ent.texts.nl || '',
    ent.texts.de || '',
    ent.texts.fr || '',
    ent.texts.es || '',
    ent.texts.it || '',
    ent.texts.ar || '',
    ent.texts.tr || '',
    ent.texts.pl || '',
    ent.texts.uk || '',
    ent.texts['en-US'] || ent.texts.en || '',
    'en-US/multi',
    '',
    'C1 Level Academic / Advanced Expression',
    'Advanced Collocation & Formal Phrasing'
  ]);
}

// D. Universal Multi-lingual Concepts
for (const u of UNIVERSAL_CONCEPTS) {
  masterRows.push([
    String(rowId++),
    'Universal Concept',
    u.topic || '',
    u.level || 'A1',
    u.words.fa || '',
    u.words['en-US'] || u.words.en || '',
    u.words.nl || '',
    u.words.de || '',
    u.words.fr || '',
    u.words.es || '',
    u.words.it || '',
    u.words.ar || '',
    u.words.tr || '',
    u.words.pl || '',
    u.words.uk || '',
    u.words.en || '',
    'multi',
    '',
    u.id || '',
    ''
  ]);
}

// Write with UTF-8 BOM (\uFEFF) for Excel Persian/Arabic support
const bom = '\uFEFF';
const masterCSVContent = bom + [
  masterHeaders.map(escapeCSV).join(','),
  ...masterRows.map(r => r.map(escapeCSV).join(','))
].join('\r\n');

fs.mkdirSync('public/downloads', { recursive: true });
fs.writeFileSync('public/downloads/dour_complete_language_dataset.csv', masterCSVContent, 'utf-8');

// Also save structured JSON format
const structuredData = {
  totalItems: masterRows.length,
  exportDate: new Date().toISOString(),
  vocabularyWordsCount: WORD_BANK.length,
  curatedCardsCount: CURATED_LANGUAGE_CARDS.length,
  c1EntitiesCount: C1_ENTITIES.length,
  universalConceptsCount: UNIVERSAL_CONCEPTS.length,
  vocabularyWords: WORD_BANK,
  curatedCards: CURATED_LANGUAGE_CARDS,
  c1Entities: C1_ENTITIES,
  universalConcepts: UNIVERSAL_CONCEPTS
};

fs.writeFileSync('public/downloads/dour_complete_language_dataset.json', JSON.stringify(structuredData, null, 2), 'utf-8');

console.log(`Successfully exported ${masterRows.length} total language learning rows to public/downloads/dour_complete_language_dataset.csv and .json`);

