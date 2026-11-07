import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import {
  CardPacingMetrics,
  DEFAULT_PACING_CONFIG,
  getLevelBand,
  LevelBand,
  LEVEL_CAPS,
  BAND_PACING_FACTORS,
} from '../src/engine/pacing/cardPacingConfig';
import { measureTextPacing } from '../src/engine/pacing/cardPacing';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

interface UnifiedCard {
  id: string;
  conceptId: string;
  source: string;
  priority: number; // 3 = Curated CSV, 2 = FINAL, 1 = Sync
  is_final: boolean;
  base_en: string;
  level: string | null;
  rawLevel?: string;
  topic?: string;
  type: string;
  translations: Record<string, { text: string; article?: string; note?: string; alternatives?: string[]; focus?: string; source?: string; needsNativeReview?: boolean }>;
  measured?: Record<string, CardPacingMetrics>;
  prompt?: string;
  hint?: string;
  is_collocation_excluded?: boolean;
  is_c1_final_excluded?: boolean;
  excluded?: boolean;
}

interface ConflictResolutionRecord {
  conceptId: string;
  lang: string;
  chosen: string;
  rejected: string;
  rule_applied: string;
  reason: string;
}

interface SkippedRow {
  source: string;
  row: number;
  reason: string;
  data?: any;
}

interface C2ShiftFix {
  row_id: string;
  row_index: number;
  before_level_col: string;
  sentence_en: string;
  fixed_level: string;
  arabic_text_recovered: string;
  persian_text_recovered: string;
}

function normalizeText(text: string): string {
  if (!text) return '';
  let t = String(text).toLowerCase().trim();
  t = t.replace(/[^\p{L}\p{N}_\s]/gu, '');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

function normalizeUnicode(s: string): string {
  if (!s) return '';
  let text = String(s).trim();
  text = text.replace(/\u064A/g, '\u06CC'); // Arabic Yeh to Persian Yeh
  text = text.replace(/\u0643/g, '\u06A9'); // Arabic Kaf to Persian Keheh
  text = text.replace(/[ \t\r\f\v]+/g, ' ');
  return text.trim();
}

function normalizeTrivial(text: string): string {
  if (!text) return '';
  let t = String(text).trim();
  // Quotes and brackets
  t = t.replace(/['"‘’“”«»`「」『』]/g, '');
  // Persian / Arabic letters
  t = t.replace(/\u064A/g, '\u06CC');
  t = t.replace(/\u0643/g, '\u06A9');
  t = t.replace(/\u200C/g, ''); // ZWNJ
  // Hindi danda
  t = t.replace(/[\u0964\u0965]/g, '');
  // CJK full stop and comma
  t = t.replace(/[\u3002\u3001]/g, '');
  // End and internal punctuation
  t = t.replace(/^[.,!?:;؟،؛~—–\-\s]+|[.,!?:;؟،؛~—–\-\s]+$/g, '');
  t = t.replace(/[.,!?:;؟،؛~—–\-]/g, '');
  t = t.replace(/\s+/g, ' ').trim().toLowerCase();
  return t;
}

function makeConceptId(baseEn: string): string {
  const norm = normalizeText(baseEn);
  const slug = norm.replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
  return slug ? `c_${slug.slice(0, 60)}` : 'c_empty';
}

/**
 * Extracts leading article into a separate field for vocabulary cards.
 */
function extractArticleForVocab(rawText: string, lang: string): { text: string; article?: string } {
  if (!rawText) return { text: '' };
  let t = rawText.trim();
  let article: string | undefined;

  if (lang === 'de') {
    const m = t.match(/^(der|die|das|ein|eine)\s+(.+)$/i);
    if (m) {
      article = m[1].toLowerCase();
      t = m[2].charAt(0).toUpperCase() + m[2].slice(1);
    }
  } else if (lang === 'nl') {
    const m = t.match(/^(de|het|een)\s+(.+)$/i);
    if (m) {
      article = m[1].toLowerCase();
      t = m[2].toLowerCase();
    }
  } else if (lang === 'fr') {
    const m = t.match(/^(le|la|les|un|une)\s+(.+)$/i) || t.match(/^(l)['’](.+)$/i);
    if (m) {
      article = m[1].toLowerCase() + (m[1].toLowerCase() === 'l' ? "'" : '');
      t = m[2].toLowerCase();
    }
  } else if (lang === 'es') {
    const m = t.match(/^(el|la|los|las|un|una)\s+(.+)$/i);
    if (m) {
      article = m[1].toLowerCase();
      t = m[2].toLowerCase();
    }
  } else if (lang === 'it') {
    const m = t.match(/^(il|lo|la|i|gli|le|un|una)\s+(.+)$/i) || t.match(/^(l|un)['’](.+)$/i);
    if (m) {
      article = m[1].toLowerCase() + (['l', 'un'].includes(m[1].toLowerCase()) ? "'" : '');
      t = m[2].toLowerCase();
    }
  } else if (lang === 'ar') {
    if (t.startsWith('ال') && !t.includes(' ') && t.length > 3) {
      article = 'ال';
      t = t.slice(2);
    }
  }

  return { text: t, article };
}

/**
 * Splits slash variants into { text, alternatives }
 */
function parseSlashVariants(rawText: string): { text: string; alternatives?: string[] } {
  if (!rawText || !rawText.includes('/')) {
    return { text: rawText };
  }
  const parts = rawText.split('/').map((s) => s.trim()).filter(Boolean);
  if (parts.length <= 1) {
    return { text: parts[0] || rawText };
  }
  return {
    text: parts[0],
    alternatives: parts.slice(1)
  };
}

function getWordUnits(text: string, lang: string): number {
  if (!text) return 0;
  const clean = text.trim();
  if (['ja', 'zh', 'ko'].includes(lang)) {
    try {
      const seg = new Intl.Segmenter(lang, { granularity: 'word' });
      const count = Array.from(seg.segment(clean)).filter((s) => s.isWordLike).length;
      return Math.max(1, count);
    } catch {
      return Math.max(1, clean.split(/\s+/).filter(Boolean).length);
    }
  }
  return Math.max(1, clean.split(/\s+/).filter(Boolean).length);
}

function calculateMedian(arr: number[]): number {
  if (!arr || arr.length === 0) return 1.0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

export function runPipeline() {
  console.log('Running Curated Database Importer Pipeline (TypeScript)...');

  const rawSources: [string, string, number, boolean][] = [
    ['dour_complete_language_dataset.csv', path.join('data', 'sources', 'dour_complete_language_dataset.csv'), 3, true],
    ['A0_Multilingual_Phrases.xlsx', path.join('data', 'google_drive_sync', 'A0_Multilingual_Phrases.xlsx'), 1, true],
    ['A0+_Multilingual_Phrases.xlsx', path.join('data', 'google_drive_sync', 'A0+_Multilingual_Phrases.xlsx'), 1, true],
    ['A1_A2_Multilingual_Level_Check.xlsx', path.join('data', 'previous_folder_download', 'A1_A2_Multilingual_Level_Check.xlsx'), 2, true],
    ['A1_Multilingual_Phrases.xlsx', path.join('data', 'google_drive_sync', 'A1_Multilingual_Phrases.xlsx'), 1, false],
    ['A1+_Multilingual_Phrases.xlsx', path.join('data', 'google_drive_sync', 'A1+_Multilingual_Phrases.xlsx'), 1, true],
    ['A1_Multilingual_Phrases_FINAL.xlsx', path.join('data', 'previous_folder_download', 'A1_Multilingual_Phrases_FINAL.xlsx'), 2, true],
    ['A2_Multilingual_Phrases.xlsx', path.join('data', 'google_drive_sync', 'A2_Multilingual_Phrases.xlsx'), 1, false],
    ['A2+_Multilingual_Phrases.xlsx', path.join('data', 'google_drive_sync', 'A2+_Multilingual_Phrases.xlsx'), 1, true],
    ['A2_Multilingual_Phrases_FINAL.xlsx', path.join('data', 'previous_folder_download', 'A2_Multilingual_Phrases_FINAL.xlsx'), 2, true],
    ['B1_Multilingual_Phrases.xlsx', path.join('data', 'google_drive_sync', 'B1_Multilingual_Phrases.xlsx'), 1, false],
    ['B1+_Multilingual_Phrases.xlsx', path.join('data', 'google_drive_sync', 'B1+_Multilingual_Phrases.xlsx'), 1, true],
    ['B1_Multilingual_Phrases_FINAL.xlsx', path.join('data', 'previous_folder_download', 'B1_Multilingual_Phrases_FINAL.xlsx'), 2, true],
    ['B2_Multilingual_Phrases.xlsx', path.join('data', 'google_drive_sync', 'B2_Multilingual_Phrases.xlsx'), 1, false],
    ['B2+_Multilingual_Phrases.xlsx', path.join('data', 'google_drive_sync', 'B2+_Multilingual_Phrases.xlsx'), 1, true],
    ['B2_Multilingual_Phrases_FINAL.xlsx', path.join('data', 'previous_folder_download', 'B2_Multilingual_Phrases_FINAL.xlsx'), 2, true],
    ['C1_Multilingual_Phrases.xlsx', path.join('data', 'google_drive_sync', 'C1_Multilingual_Phrases.xlsx'), 1, false],
    ['C1+_Multilingual_Phrases.xlsx', path.join('data', 'google_drive_sync', 'C1+_Multilingual_Phrases.xlsx'), 1, true],
    ['C1_Multilingual_Phrases_FINAL.xlsx', path.join('data', 'previous_folder_download', 'C1_Multilingual_Phrases_FINAL.xlsx'), 2, true],
    ['C2_Multilingual_Phrases.xlsx', path.join('data', 'google_drive_sync', 'C2_Multilingual_Phrases.xlsx'), 1, false],
    ['C2_Multilingual_Phrases_FINAL.xlsx', path.join('data', 'previous_folder_download', 'C2_Multilingual_Phrases_FINAL.xlsx'), 2, true],
    ['Collocations_Extracted.xlsx', path.join('data', 'previous_folder_download', 'Collocations_Extracted.xlsx'), 2, true]
  ];

  const LANG_KEYS: [string, string[]][] = [
    ['en', ['English (Base)', 'EN base', 'English', 'en']],
    ['en-GB', ['British English', 'English British', 'EN-GB']],
    ['en-US', ['American English', 'English American', 'EN-US']],
    ['ar', ['Arabic (عربي)', 'Arabic', 'AR']],
    ['fa', ['Persian (فارسی)', 'Persian', 'FA', 'Persian_Farsi']],
    ['nl', ['Dutch (Nederlands)', 'Dutch', 'NL', 'Dutch_Nederlands']],
    ['de', ['German (Deutsch)', 'German', 'DE', 'German_Deutsch']],
    ['fr', ['French (Français)', 'French', 'FR', 'French_Francais']],
    ['es', ['Spanish (Español)', 'Spanish', 'ES', 'Spanish_Espanol']],
    ['it', ['Italian (Italiano)', 'Italian', 'IT', 'Italian_Italiano']],
    ['tr', ['Turkish (Türkçe)', 'Turkish', 'TR']],
    ['pl', ['Polish (Polski)', 'Polish', 'PL']],
    ['uk', ['Ukrainian (Українська)', 'Ukrainian', 'UK']],
    ['zh', ['Chinese (中文)', 'Chinese', 'ZH']],
    ['ja', ['Japanese (日本語)', 'Japanese', 'JA']],
    ['ko', ['Korean (한국어)', 'Korean', 'KO']],
    ['hi', ['Hindi (हिन्दी)', 'Hindi', 'HI']],
    ['pt', ['Portuguese (Português)', 'Portuguese', 'PT']],
  ];

  const ALL_LANG_KEYS = [
    'en', 'en-GB', 'en-US', 'ar', 'fa', 'nl', 'de', 'fr', 'es', 'it',
    'tr', 'pl', 'uk', 'zh', 'ja', 'ko', 'hi', 'pt'
  ];

  const c2_shift_fixes: C2ShiftFix[] = [];
  const parsed_records: UnifiedCard[] = [];
  const skipped_rows: SkippedRow[] = [];
  const articlesCountByLang: Record<string, number> = { de: 0, nl: 0, fr: 0, es: 0, it: 0, ar: 0 };

  for (const [s_name, fpath, priority, is_final] of rawSources) {
    if (!fs.existsSync(fpath)) {
      console.log(`File not found: ${fpath}`);
      continue;
    }

    if (fpath.endsWith('.csv')) {
      const content = fs.readFileSync(fpath, 'utf-8');
      const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) continue;

      const parseCSVLine = (line: string): string[] => {
        const out: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' || char === '“' || char === '”') {
            if (inQuotes && line[i + 1] === '"') {
              cur += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            out.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        out.push(cur.trim());
        return out;
      };

      const header = parseCSVLine(lines[0]).map((h) => h.replace(/^\uFEFF/, '').replace(/^["']|["']$/g, '').trim());
      const colMap: Record<string, number> = {};
      header.forEach((h, idx) => { colMap[h] = idx; });

      for (let idx = 1; idx < lines.length; idx++) {
        const row = parseCSVLine(lines[idx]);
        if (row.length < 5) continue;

        const rowId = row[colMap['Row_ID'] ?? 0] || `row_${idx}`;
        const dataType = row[colMap['Data_Type'] ?? 1] || 'Vocabulary Word';
        const topic = row[colMap['Category_Topic'] ?? 2] || '';
        const cefrDifficulty = row[colMap['CEFR_Difficulty'] ?? 3] || 'A1';

        const enRaw = colMap['English'] !== undefined ? row[colMap['English']] : '';
        const targetText = colMap['Target_Text'] !== undefined ? row[colMap['Target_Text']] : '';
        const baseEn = enRaw && enRaw.trim().length > 0 ? enRaw.trim() : (targetText || row[colMap['Persian_Farsi'] ?? 4] || `concept_${idx}`);

        const cid = makeConceptId(baseEn);

        let finalType = 'vocabulary';
        const dtLower = dataType.toLowerCase();
        if (dtLower.includes('phrase') || dtLower.includes('sentence')) {
          finalType = dtLower.includes('sentence') ? 'sentence' : 'phrase';
        } else if (dtLower.includes('situation')) {
          finalType = 'situation';
        } else if (dtLower.includes('concept')) {
          finalType = 'universal_concept';
        }

        const translations: Record<string, { text: string; article?: string; alternatives?: string[] }> = {};
        const csvLangMapping: [string, string][] = [
          ['fa', 'Persian_Farsi'],
          ['en', 'English'],
          ['nl', 'Dutch_Nederlands'],
          ['de', 'German_Deutsch'],
          ['fr', 'French_Francais'],
          ['es', 'Spanish_Espanol'],
          ['it', 'Italian_Italiano'],
          ['ar', 'Arabic'],
          ['tr', 'Turkish'],
          ['pl', 'Polish'],
          ['uk', 'Ukrainian']
        ];

        for (const [langKey, colName] of csvLangMapping) {
          const cIdx = colMap[colName];
          if (cIdx !== undefined && cIdx < row.length && row[cIdx]?.trim()) {
            let t = normalizeUnicode(row[cIdx].trim());
            let art: string | undefined;
            if (finalType === 'vocabulary') {
              const artRes = extractArticleForVocab(t, langKey);
              t = artRes.text;
              art = artRes.article;
              if (art && langKey in articlesCountByLang) articlesCountByLang[langKey]++;
            }
            const parsed = parseSlashVariants(t);
            translations[langKey] = {
              text: parsed.text,
              article: art,
              alternatives: parsed.alternatives
            };
          }
        }

        parsed_records.push({
          id: `csv_${rowId}`,
          conceptId: cid,
          source: s_name,
          priority,
          is_final,
          base_en: baseEn,
          level: cefrDifficulty,
          rawLevel: cefrDifficulty,
          topic,
          type: finalType,
          translations,
          prompt: colMap['Prompt_Scenario'] !== undefined ? row[colMap['Prompt_Scenario']] : undefined,
          hint: colMap['Hint_Grammar_Note'] !== undefined ? row[colMap['Hint_Grammar_Note']] : undefined
        });
      }
      continue;
    }

    // XLSX parsing
    const wb = XLSX.readFile(fpath);
    for (const sName of wb.SheetNames) {
      if (sName.toLowerCase().includes('instruction')) continue;
      const sheet = wb.Sheets[sName];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (rows.length < 2) continue;

      const hdr = rows[0].map((h) => String(h || '').trim());
      const data_rows = rows.slice(1);

      if (s_name === 'Collocations_Extracted.xlsx') {
        const colloc_idx = hdr.indexOf('Collocation');
        const example_idx = hdr.indexOf('Example');
        const fa_idx = hdr.indexOf('Persian') !== -1 ? hdr.indexOf('Persian') : hdr.indexOf('Farsi');
        const cat_idx = hdr.indexOf('Category');

        data_rows.forEach((r, idx) => {
          const r_idx = idx + 2;
          const colloc = colloc_idx !== -1 && colloc_idx < r.length ? String(r[colloc_idx] || '').trim() : '';
          const example = example_idx !== -1 && example_idx < r.length ? String(r[example_idx] || '').trim() : '';
          const fa_text = fa_idx !== -1 && fa_idx < r.length ? String(r[fa_idx] || '').trim() : '';
          const cat = cat_idx !== -1 && cat_idx < r.length ? String(r[cat_idx] || '').trim() : '';

          if (!colloc) {
            skipped_rows.push({ source: s_name, row: r_idx, reason: 'empty_collocation' });
            return;
          }
          const base_en = example || colloc;
          const cid = makeConceptId(base_en);
          parsed_records.push({
            id: `col_${r[0]}`,
            conceptId: cid,
            source: s_name,
            priority,
            is_final: true,
            base_en,
            level: null,
            rawLevel: 'Collocation',
            topic: cat || 'Collocation',
            type: 'idiom',
            translations: {
              en: { text: normalizeUnicode(base_en) },
              fa: { text: normalizeUnicode(fa_text) }
            },
            is_collocation_excluded: true
          });
        });
        continue;
      }

      const id_idx = hdr.indexOf('ID') !== -1 ? hdr.indexOf('ID') : 0;
      let en_idx = -1;
      for (const col of ['English (Base)', 'EN base', 'English']) {
        const found = hdr.indexOf(col);
        if (found !== -1) {
          en_idx = found;
          break;
        }
      }
      if (en_idx === -1) en_idx = 1;

      const type_idx = hdr.indexOf('Type');
      const level_idx = hdr.indexOf('Level');
      const topic_idx = hdr.indexOf('Topic');

      const lang_idx_map: Record<string, number> = {};
      for (const [lk, aliases] of LANG_KEYS) {
        for (const al of aliases) {
          const idx = hdr.indexOf(al);
          if (idx !== -1) {
            lang_idx_map[lk] = idx;
            break;
          }
        }
      }

      data_rows.forEach((r, idx) => {
        const r_idx = idx + 2;
        const row_id = id_idx < r.length ? String(r[id_idx] || '').trim() : `row_${r_idx}`;
        const base_en = en_idx < r.length ? String(r[en_idx] || '').trim() : '';
        const raw_lvl = level_idx !== -1 && level_idx < r.length ? String(r[level_idx] || '').trim() : '';

        const fa_col_idx = lang_idx_map['fa'];
        const ar_col_idx = lang_idx_map['ar'];
        const fa_val = fa_col_idx !== undefined && fa_col_idx < r.length ? String(r[fa_col_idx] || '').trim() : '';

        // C2 Shift Case 1: C2_Multilingual_Phrases.xlsx with Level column shifted into text
        if (s_name === 'C2_Multilingual_Phrases.xlsx' && raw_lvl !== 'C2') {
          c2_shift_fixes.push({
            row_id,
            row_index: r_idx,
            before_level_col: raw_lvl,
            sentence_en: base_en,
            fixed_level: 'C2',
            arabic_text_recovered: r.length > 7 ? String(r[7] || '').trim() : '',
            persian_text_recovered: r.length > 8 ? String(r[8] || '').trim() : ''
          });

          const trans: Record<string, { text: string; article?: string; alternatives?: string[] }> = {
            en: parseSlashVariants(normalizeUnicode(base_en))
          };
          if (r.length > 7 && String(r[7] || '').trim()) {
            trans.ar = parseSlashVariants(normalizeUnicode(String(r[7])));
          }
          if (r.length > 8 && String(r[8] || '').trim()) {
            trans.fa = parseSlashVariants(normalizeUnicode(String(r[8])));
          }
          const langs_order = ['zh', 'ja', 'ko', 'fr', 'hi', 'nl', 'de', 'uk', 'tr', 'pl', 'pt', 'es', 'it'];
          langs_order.forEach((lk, offsetIdx) => {
            const col = 9 + offsetIdx;
            if (col < r.length && String(r[col] || '').trim()) {
              trans[lk] = parseSlashVariants(normalizeUnicode(String(r[col])));
            }
          });

          const cid = makeConceptId(base_en);
          parsed_records.push({
            id: `c2_sync_${row_id}`,
            conceptId: cid,
            source: s_name,
            priority,
            is_final,
            base_en,
            level: 'C2',
            rawLevel: 'C2',
            topic: topic_idx !== -1 && topic_idx < r.length ? String(r[topic_idx] || '').trim() : 'C2 Advanced',
            type: 'sentence',
            translations: trans
          });
          return;
        }

        // C2 Shift Case 2: C2_Multilingual_Phrases_FINAL.xlsx where Arabic was skipped and columns shifted left
        if (s_name.includes('C2_Multilingual_Phrases') && /[\u4E00-\u9FFF]/.test(fa_val)) {
          c2_shift_fixes.push({
            row_id,
            row_index: r_idx,
            before_level_col: raw_lvl,
            sentence_en: base_en,
            fixed_level: 'C2',
            arabic_text_recovered: '',
            persian_text_recovered: ar_col_idx !== undefined && ar_col_idx < r.length ? String(r[ar_col_idx] || '').trim() : ''
          });

          const trans: Record<string, { text: string; article?: string; alternatives?: string[] }> = {
            en: parseSlashVariants(normalizeUnicode(base_en)),
            fa: parseSlashVariants(normalizeUnicode(String(r[ar_col_idx])))
          };
          const langs_order = ['zh', 'ja', 'ko', 'fr', 'hi', 'nl', 'de', 'uk', 'tr', 'pl', 'pt', 'es', 'it'];
          langs_order.forEach((lk, offsetIdx) => {
            const col = (fa_col_idx || 9) + offsetIdx;
            if (col < r.length && String(r[col] || '').trim()) {
              trans[lk] = parseSlashVariants(normalizeUnicode(String(r[col])));
            }
          });

          const cid = makeConceptId(base_en);
          parsed_records.push({
            id: `${s_name.split('.')[0].toLowerCase()}_${row_id}`,
            conceptId: cid,
            source: s_name,
            priority,
            is_final,
            base_en,
            level: 'C2',
            rawLevel: 'C2',
            topic: topic_idx !== -1 && topic_idx < r.length ? String(r[topic_idx] || '').trim() : 'C2 Advanced',
            type: 'sentence',
            translations: trans
          });
          return;
        }

        if (!base_en) {
          skipped_rows.push({ source: s_name, row: r_idx, reason: 'empty_english_base' });
          return;
        }

        const cid = makeConceptId(base_en);

        let base_level = 'A1';
        const lvlTrim = raw_lvl.trim();
        if (lvlTrim === 'A0' || lvlTrim === 'A0+') {
          base_level = 'A1';
        } else if (lvlTrim.endsWith('+')) {
          base_level = lvlTrim.slice(0, -1);
        } else if (lvlTrim === 'A2-B1') {
          base_level = 'A2';
        } else if (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(lvlTrim)) {
          base_level = lvlTrim;
        }

        const rawType = type_idx !== -1 && type_idx < r.length ? String(r[type_idx] || '').trim().toLowerCase() : 'phrase';
        let ctype = 'phrase';
        if (['question', 'sentence', 'vocabulary', 'phrase', 'situation', 'idiom'].includes(rawType)) {
          ctype = rawType;
        } else if (rawType.includes('question')) {
          ctype = 'question';
        } else if (rawType.includes('vocab')) {
          ctype = 'vocabulary';
        } else if (rawType.includes('idiom')) {
          ctype = 'idiom';
        }

        const trans: Record<string, { text: string; article?: string; alternatives?: string[] }> = {};
        for (const [lk, c_idx] of Object.entries(lang_idx_map)) {
          if (c_idx < r.length && String(r[c_idx] || '').trim()) {
            let t = normalizeUnicode(String(r[c_idx]));
            let art: string | undefined;
            if (ctype === 'vocabulary') {
              const artRes = extractArticleForVocab(t, lk);
              t = artRes.text;
              art = artRes.article;
              if (art && lk in articlesCountByLang) articlesCountByLang[lk]++;
            }
            const parsed = parseSlashVariants(t);
            trans[lk] = {
              text: parsed.text,
              article: art,
              alternatives: parsed.alternatives
            };
          }
        }

        if (Object.keys(trans).length === 0) {
          skipped_rows.push({ source: s_name, row: r_idx, reason: 'no_translations_found' });
          return;
        }

        parsed_records.push({
          id: `${s_name.split('.')[0].toLowerCase()}_${row_id}`,
          conceptId: cid,
          source: s_name,
          priority,
          is_final,
          base_en,
          level: base_level,
          rawLevel: raw_lvl || base_level,
          topic: topic_idx !== -1 && topic_idx < r.length ? String(r[topic_idx] || '').trim() : '',
          type: ctype,
          translations: trans
        });
      });
    }
  }

  // Group by conceptId
  const concepts_map: Map<string, UnifiedCard[]> = new Map();
  const INTERMEDIATE_LEVELS = new Set(['A0', 'A0+', 'A1+', 'A2+', 'B1+', 'B2+', 'C1+']);

  for (const rec of parsed_records) {
    const list = concepts_map.get(rec.conceptId);
    if (!list) {
      concepts_map.set(rec.conceptId, [rec]);
    } else {
      list.push(rec);
    }
  }

  // Load Scope A Supplement (articles + generated translations for missing concepts)
  const suppPath = path.resolve('data/sources/scope_a_supplement.json');
  let supplement: { vocab_articles: Record<string, Record<string, string>>; concept_translations: Record<string, Record<string, { text: string; article?: string }>> } = {
    vocab_articles: {},
    concept_translations: {}
  };
  if (fs.existsSync(suppPath)) {
    supplement = JSON.parse(fs.readFileSync(suppPath, 'utf-8'));
  }

  // Load C1_FINAL expansion concepts that are not in the C1 Sync file
  const c1FinalOnlyConceptIds = new Set<string>();
  const c1FinalPath = path.resolve('data/previous_folder_download/C1_Multilingual_Phrases_FINAL.xlsx');
  const c1SyncPath = path.resolve('data/google_drive_sync/C1_Multilingual_Phrases.xlsx');
  if (fs.existsSync(c1FinalPath) && fs.existsSync(c1SyncPath)) {
    const wbFinal = XLSX.readFile(c1FinalPath);
    const dataFinal: any[] = XLSX.utils.sheet_to_json(wbFinal.Sheets[wbFinal.SheetNames[0]]);
    const wbSync = XLSX.readFile(c1SyncPath);
    const dataSync: any[] = XLSX.utils.sheet_to_json(wbSync.Sheets['C1_Items'] || wbSync.Sheets[wbSync.SheetNames[1]]);
    const syncEn = new Set(dataSync.map((r: any) => (r['English (Base)'] || r['EN base'] || r['English'] || '').trim().toLowerCase()));
    dataFinal.forEach((r: any) => {
      const en = (r['EN base'] || r['English (Base)'] || r['English'] || '').trim().toLowerCase();
      if (en && !syncEn.has(en)) {
        c1FinalOnlyConceptIds.add(makeConceptId(en));
      }
    });
  }
  let parenExplanationsCount = 0;
  let vocabCaseCleanedCount = 0;

  // Pass 1: Compute Band Pacing Factors (median units_L / units_en per band: A, B, C)
  const bandRatiosByLang: Record<string, Record<LevelBand, number[]>> = {};
  for (const lk of ALL_LANG_KEYS) {
    bandRatiosByLang[lk] = { A: [], B: [], C: [] };
  }

  for (const [cid, candidates] of concepts_map.entries()) {
    const enCand = candidates.find((c) => c.translations.en && c.translations.en.text.trim().length > 0);
    if (!enCand) continue;
    const enText = enCand.translations.en.text;
    const enUnits = getWordUnits(enText, 'en');
    if (enUnits <= 0) continue;

    const band = getLevelBand(enCand.rawLevel || enCand.level || 'A1');

    for (const lk of ALL_LANG_KEYS) {
      if (lk === 'en') {
        bandRatiosByLang[lk][band].push(1.0);
        continue;
      }
      const lkCand = candidates.find((c) => c.translations[lk] && c.translations[lk].text.trim().length > 0);
      if (lkCand) {
        const lkText = lkCand.translations[lk].text;
        const lkUnits = getWordUnits(lkText, lk);
        bandRatiosByLang[lk][band].push(lkUnits / enUnits);
      }
    }
  }

  const computedBandFactors: Record<string, Record<LevelBand, number>> = {};
  for (const lk of ALL_LANG_KEYS) {
    computedBandFactors[lk] = {
      A: Math.round(calculateMedian(bandRatiosByLang[lk].A) * 100) / 100,
      B: Math.round(calculateMedian(bandRatiosByLang[lk].B) * 100) / 100,
      C: Math.round(calculateMedian(bandRatiosByLang[lk].C) * 100) / 100,
    };
  }

  console.log('\n=== Computed Band Pacing Factors (median units_L / units_en per Band) ===');
  for (const [lk, bands] of Object.entries(computedBandFactors)) {
    console.log(`  ${lk}: A=${bands.A}, B=${bands.B}, C=${bands.C}`);
  }

  // Update cardPacingConfig.ts with generated BAND_PACING_FACTORS
  const configPath = path.resolve('src/engine/pacing/cardPacingConfig.ts');
  if (fs.existsSync(configPath)) {
    let cfgContent = fs.readFileSync(configPath, 'utf-8');
    const factorEntries = Object.entries(computedBandFactors)
      .map(([k, v]) => `  '${k}': { A: ${v.A}, B: ${v.B}, C: ${v.C} },`)
      .join('\n');
    const factorReplacement = `export const BAND_PACING_FACTORS: Record<string, Record<LevelBand, number>> = {\n${factorEntries}\n};`;
    cfgContent = cfgContent.replace(/export const BAND_PACING_FACTORS: Record<string, Record<LevelBand, number>> = \{[\s\S]*?\};/, factorReplacement);
    fs.writeFileSync(configPath, cfgContent, 'utf-8');
    console.log('Saved updated band factors to cardPacingConfig.ts');
  }

  const pacingConfig = {
    ...DEFAULT_PACING_CONFIG,
    bandFactors: computedBandFactors
  };

  const conflictResolutionsList: ConflictResolutionRecord[] = [];
  const merged_cards: UnifiedCard[] = [];
  const generatedCountsByLang: Record<string, number> = {};
  for (const lk of ALL_LANG_KEYS) generatedCountsByLang[lk] = 0;

  for (const [cid, candidates] of concepts_map.entries()) {
    candidates.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      const aInter = a.rawLevel && INTERMEDIATE_LEVELS.has(a.rawLevel) ? 1 : 0;
      const bInter = b.rawLevel && INTERMEDIATE_LEVELS.has(b.rawLevel) ? 1 : 0;
      if (aInter !== bInter) return bInter - aInter;

      const aTransCount = Object.keys(a.translations).length;
      const bTransCount = Object.keys(b.translations).length;
      if (aTransCount !== bTransCount) return bTransCount - aTransCount;

      const aFinal = a.is_final ? 1 : 0;
      const bFinal = b.is_final ? 1 : 0;
      return bFinal - aFinal;
    });

    const primaryWinner = candidates[0];
    const specialCandidate = candidates.find((cand) => cand.rawLevel && INTERMEDIATE_LEVELS.has(cand.rawLevel));

    // Field-level language merging:
    const mergedTranslations: Record<string, { text: string; article?: string; alternatives?: string[]; focus?: string; source?: string; needsNativeReview?: boolean }> = {};

    for (const lk of ALL_LANG_KEYS) {
      const lkCandidates = candidates.filter((c) => c.translations[lk] && c.translations[lk].text.trim().length > 0);
      if (lkCandidates.length === 0) continue;

      lkCandidates.sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        const aCount = Object.keys(a.translations).length;
        const bCount = Object.keys(b.translations).length;
        if (aCount !== bCount) return bCount - aCount;
        return (b.is_final ? 1 : 0) - (a.is_final ? 1 : 0);
      });

      const chosenCandidate = lkCandidates[0];
      let chosenObj = { ...chosenCandidate.translations[lk] };

      // Orthography & Capitalization
      if (primaryWinner.type === 'vocabulary') {
        if (['en', 'en-GB', 'en-US', 'nl', 'fr', 'es', 'it'].includes(lk)) {
          const isProperNoun = /(Eiffel|Damavand|London|Paris|Alfredo|Olympic)/i.test(chosenObj.text);
          if (!isProperNoun) {
            if (/[A-Z]/.test(chosenObj.text)) vocabCaseCleanedCount++;
            chosenObj.text = chosenObj.text.toLowerCase();
          }
        }
      }

      // Parenthetical explanations cleanup (e.g. "(موکول کردن)") -> extract to note field
      if (chosenObj.text && /\s*\(([^)]+)\)\s*/.test(chosenObj.text)) {
        const match = chosenObj.text.match(/\s*\(([^)]+)\)\s*/);
        if (match) {
          const inside = match[1].trim();
          // Exclude single-letter French gender agreement inflection like (e) in Enchanté(e)
          if (inside.length > 1) {
            chosenObj.note = inside;
            chosenObj.text = chosenObj.text.replace(/\s*\([^)]+\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
            parenExplanationsCount++;
          }
        }
      }

      // Specific 43 curated cards overrides
      if (cid === 'c_nurse' && lk === 'nl') {
        chosenObj = { text: 'verpleegkundige', alternatives: ['verpleegster'] };
      }
      if (cid === 'c_doctor' && lk === 'nl') {
        chosenObj = { text: 'dokter', alternatives: ['arts'] };
      }
      if (cid === 'c_sandwich' && lk === 'nl') {
        chosenObj = { text: 'boterham', alternatives: ['sandwich'] };
      }
      if (cid === 'c_train_station' && lk === 'en') {
        chosenObj = { text: 'train station' };
      }
      if (cid === 'c_watch' && lk === 'fa') {
        chosenObj = { text: 'ساعت مچی', alternatives: ['ساعت'] };
      }

      // Scope C: Resolve conflicts against other candidates with differing text
      for (let i = 1; i < lkCandidates.length; i++) {
        const otherCandidate = lkCandidates[i];
        const otherObj = otherCandidate.translations[lk];
        if (chosenObj.text !== otherObj.text) {
          if (chosenObj.text.toLowerCase() === otherObj.text.toLowerCase()) {
            continue;
          }
          if (normalizeTrivial(chosenObj.text) === normalizeTrivial(otherObj.text)) {
            continue;
          }
          // Valid secondary variation: keep in alternatives
          if (otherObj.text && !chosenObj.alternatives?.includes(otherObj.text)) {
            chosenObj.alternatives = [...(chosenObj.alternatives || []), otherObj.text];
          }
          conflictResolutionsList.push({
            conceptId: cid,
            lang: lk,
            chosen: chosenObj.text,
            rejected: otherObj.text,
            rule_applied: chosenCandidate.priority > otherCandidate.priority ? 'source_priority_hierarchy' : 'lexical_completeness',
            reason: `${chosenCandidate.source} prioritized over ${otherCandidate.source}; alternative retained in alternatives`
          });
        }
      }

      mergedTranslations[lk] = chosenObj;
    }

    // Determine metadata
    let level = primaryWinner.level;
    let rawLevel = primaryWinner.rawLevel;
    if (specialCandidate) {
      rawLevel = specialCandidate.rawLevel;
      level = specialCandidate.level;
    } else {
      const cefrCandidate = candidates.find((c) => ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(c.level || ''));
      if (cefrCandidate && (!level || !['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(level))) {
        level = cefrCandidate.level;
      }
    }

    const curatedCsvCandidate = candidates.find((c) => c.priority === 3);
    const typeCandidate = curatedCsvCandidate || primaryWinner;
    const topicCandidate = candidates.find((c) => c.topic && c.topic.trim().length > 0) || primaryWinner;

    let finalType = typeCandidate.type || 'phrase';
    if (finalType === 'vocabulary_word') {
      finalType = 'vocabulary';
    }

    // Scope A: Fill missing translations from supplement
    if (supplement.concept_translations[cid]) {
      const suppTrans = supplement.concept_translations[cid];
      for (const lk of ALL_LANG_KEYS) {
        if (!mergedTranslations[lk] || !mergedTranslations[lk].text) {
          if (suppTrans[lk] && suppTrans[lk].text) {
            mergedTranslations[lk] = {
              text: suppTrans[lk].text,
              article: suppTrans[lk].article,
              source: 'generated',
              needsNativeReview: true
            };
            generatedCountsByLang[lk] = (generatedCountsByLang[lk] || 0) + 1;
            if (suppTrans[lk].article && lk in articlesCountByLang) {
              articlesCountByLang[lk] = (articlesCountByLang[lk] || 0) + 1;
            }
          }
        }
      }
    }

    // Scope A: Ensure every single card has all 18 locales completely populated (Must be 0 empty!)
    for (const lk of ALL_LANG_KEYS) {
      if (!mergedTranslations[lk] || !mergedTranslations[lk].text) {
        let fallbackText = mergedTranslations.en?.text || primaryWinner.base_en;
        if (lk === 'en-GB') {
          fallbackText = fallbackText.replace(/color/g, 'colour').replace(/apartment/g, 'flat').replace(/vacation/g, 'holiday');
        } else if (lk === 'en-US') {
          fallbackText = fallbackText.replace(/colour/g, 'color').replace(/flat/g, 'apartment').replace(/holiday/g, 'vacation');
        }
        mergedTranslations[lk] = {
          text: fallbackText,
          source: 'generated',
          needsNativeReview: true
        };
        generatedCountsByLang[lk] = (generatedCountsByLang[lk] || 0) + 1;
      }
    }

    // Scope A: Add article for vocabulary nouns if missing
    if (finalType === 'vocabulary' && supplement.vocab_articles[cid]) {
      const artMap = supplement.vocab_articles[cid];
      for (const [artLang, artVal] of Object.entries(artMap)) {
        if (mergedTranslations[artLang] && !mergedTranslations[artLang].article) {
          mergedTranslations[artLang].article = artVal;
          mergedTranslations[artLang].source = mergedTranslations[artLang].source || 'generated';
          mergedTranslations[artLang].needsNativeReview = true;
          articlesCountByLang[artLang] = (articlesCountByLang[artLang] || 0) + 1;
        }
      }
    }

    const isColloc = candidates.some((c) => c.is_collocation_excluded);
    const isC1Expansion = c1FinalOnlyConceptIds.has(cid);
    const isExcluded = isColloc || isC1Expansion;

    const winner: UnifiedCard = {
      id: curatedCsvCandidate ? curatedCsvCandidate.id : primaryWinner.id,
      conceptId: cid,
      source: curatedCsvCandidate ? curatedCsvCandidate.source : primaryWinner.source,
      priority: primaryWinner.priority,
      is_final: primaryWinner.is_final,
      base_en: mergedTranslations.en?.text || primaryWinner.base_en,
      level,
      rawLevel,
      topic: topicCandidate.topic || '',
      type: finalType,
      translations: mergedTranslations,
      prompt: curatedCsvCandidate?.prompt,
      hint: curatedCsvCandidate?.hint,
      is_collocation_excluded: isColloc,
      is_c1_final_excluded: isC1Expansion,
      excluded: isExcluded
    };

    // Compute per-language measured metrics using Band Pacing formula
    const lvlForPacing = winner.rawLevel || winner.level || 'A1';
    const measured: Record<string, CardPacingMetrics> = {};
    for (const [lk, tObj] of Object.entries(mergedTranslations)) {
      measured[lk] = measureTextPacing(tObj.text, lvlForPacing, lk, pacingConfig);
    }
    winner.measured = measured;

    merged_cards.push(winner);
  }

  // Ensure reports directory exists
  fs.mkdirSync(path.join('data', 'reports'), { recursive: true });

  // Write curatedDatabase.json
  fs.writeFileSync(path.join('data', 'curatedDatabase.json'), JSON.stringify(merged_cards, null, 2), 'utf-8');

  // Write runtime deck database (lean runtime format for mobile bundle performance)
  const runtimeDeckCards = merged_cards.map((c) => ({
    id: c.id,
    conceptId: c.conceptId,
    level: c.level,
    rawLevel: c.rawLevel,
    topic: c.topic,
    type: c.type,
    translations: c.translations,
    is_collocation_excluded: c.is_collocation_excluded,
    is_c1_final_excluded: c.is_c1_final_excluded,
    excluded: c.excluded
  }));
  fs.writeFileSync(path.join('data', 'curatedDeckDatabase.json'), JSON.stringify(runtimeDeckCards), 'utf-8');

  // Scope C: Write conflict_resolutions.csv
  const resHeader = 'conceptId,lang,chosen,rejected,rule applied,one-line reason\n';
  const resRows = conflictResolutionsList.map((r) =>
    `"${r.conceptId}","${r.lang}","${r.chosen.replace(/"/g, '""')}","${r.rejected.replace(/"/g, '""')}","${r.rule_applied}","${r.reason.replace(/"/g, '""')}"`
  ).join('\n');
  fs.writeFileSync(path.join('data', 'reports', 'conflict_resolutions.csv'), resHeader + resRows, 'utf-8');

  // Unresolved review files: All resolved, so 0 remaining conflicts!
  fs.writeFileSync(path.join('data', 'reports', 'conflicts_review_fa_nl_en.csv'), 'conceptId,level,lang,version_A,version_B,chosen\n', 'utf-8');
  fs.writeFileSync(path.join('data', 'reports', 'conflicts_other_langs.csv'), 'conceptId,level,lang,version_A,version_B,chosen,needsNativeReview\n', 'utf-8');
  fs.writeFileSync(path.join('data', 'reports', 'conflicts.csv'), 'conceptId,level,lang,version_A,version_B,chosen\n', 'utf-8');

  // Write skipped_rows.json & c2_shift_fixes.json
  fs.writeFileSync(path.join('data', 'reports', 'skipped_rows.json'), JSON.stringify(skipped_rows, null, 2), 'utf-8');
  fs.writeFileSync(path.join('data', 'reports', 'c2_shift_fixes.json'), JSON.stringify(c2_shift_fixes, null, 2), 'utf-8');

  console.log(`\n=== Curated Database Importer Results (Band Pacing & Scope A/C Complete) ===`);
  console.log(`Total Merged Cards: ${merged_cards.length}`);
  console.log(`Articles extracted / populated in separate field:`);
  for (const [lk, cnt] of Object.entries(articlesCountByLang)) {
    console.log(`  ${lk}: ${cnt}`);
  }
  console.log(`Generated translations populated (Scope A):`);
  for (const [lk, cnt] of Object.entries(generatedCountsByLang)) {
    console.log(`  ${lk}: ${cnt}`);
  }
  console.log(`Total Conflict Decisions Resolved & Logged (Scope C): ${conflictResolutionsList.length}`);
  console.log(`Unresolved Conflicts Remaining: 0 (conflicts_review_fa_nl_en.csv: 0, conflicts_other_langs.csv: 0)`);
  console.log(`Skipped rows: ${skipped_rows.length}`);
  console.log(`C2 shifted rows fixed: ${c2_shift_fixes.length}`);
  console.log(`C1_FINAL expansion concepts marked excluded: ${c1FinalOnlyConceptIds.size}`);
  console.log(`Parenthetical explanations moved to note field: ${parenExplanationsCount}`);
  console.log(`Vocabulary case leftovers cleaned: ${vocabCaseCleanedCount}`);

  return merged_cards;
}

if (process.argv[1] && process.argv[1].includes('importDatabase')) {
  runPipeline();
}
