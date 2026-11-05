/**
 * Offline Focus Phrase Builder Script
 * Scans real pool for 'long' and 'tooLong' cards, extracts a 2-5 word core chunk in batches of 50,
 * strictly enforces verbatim substring presence and 2-5 unit length, sets focusReviewed: false,
 * gracefully handles quota limits, and logs results to CSV for review.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { buildSessionCardPool } from '../cardsData';
import { measureCard, validateFocusVerbatim, countCardUnits } from '../cardPacing';
import { LanguageCard } from '../types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_LOG_PATH = path.join(__dirname, 'focus_review.csv');
const PROGRESS_PATH = path.join(__dirname, 'focus_progress.json');
const FOCUS_DB_PATH = path.join(__dirname, '..', 'cardsFocusData.json');
const BATCH_SIZE = 50;

interface ProgressState {
  processedIds: string[];
  rejectedIds: string[];
  stats: {
    totalChecked: number;
    longCount: number;
    tooLongCount: number;
    generatedCount: number;
    rejectedCount: number;
  };
}

function loadProgress(): ProgressState {
  if (fs.existsSync(PROGRESS_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf-8'));
    } catch {
      // fallback
    }
  }
  return {
    processedIds: [],
    rejectedIds: [],
    stats: {
      totalChecked: 0,
      longCount: 0,
      tooLongCount: 0,
      generatedCount: 0,
      rejectedCount: 0
    }
  };
}

function saveProgress(state: ProgressState) {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(state, null, 2), 'utf-8');
}

function initCsv() {
  if (!fs.existsSync(CSV_LOG_PATH)) {
    fs.writeFileSync(
      CSV_LOG_PATH,
      'cardId,cefrLevel,targetLanguage,lengthClass,units,readSec,targetText,focusPhrase,focusReviewed,status\n',
      'utf-8'
    );
  }
}

function logToCsv(row: {
  cardId: string;
  cefrLevel: string;
  targetLanguage: string;
  lengthClass: string;
  units: number;
  readSec: number;
  targetText: string;
  focusPhrase: string;
  focusReviewed: boolean;
  status: 'ACCEPTED' | 'REJECTED' | 'EXISTING';
}) {
  const sanitize = (s: string) => `"${(s || '').replace(/"/g, '""')}"`;
  const line = [
    row.cardId,
    row.cefrLevel,
    row.targetLanguage,
    row.lengthClass,
    row.units,
    row.readSec,
    sanitize(row.targetText),
    sanitize(row.focusPhrase),
    row.focusReviewed,
    row.status
  ].join(',') + '\n';
  fs.appendFileSync(CSV_LOG_PATH, line, 'utf-8');
}

function extractHeuristicVerbatimFocus(text: string, lang: string): string | null {
  if (!text) return null;
  const words = text.trim().split(/\s+/);
  if (words.length <= 5 && words.length >= 2) {
    return text.trim();
  }
  // Try taking a 3-word chunk from the middle
  const start = Math.max(0, Math.floor((words.length - 3) / 2));
  const candidate = words.slice(start, start + 3).join(' ');
  const units = countCardUnits(candidate, lang);
  if (units >= 2 && units <= 5 && text.includes(candidate)) {
    return candidate;
  }
  return null;
}

export async function runBuildFocus(batchLimit: number = BATCH_SIZE) {
  initCsv();
  const progress = loadProgress();
  const processedSet = new Set(progress.processedIds);

  let focusDb: Record<string, Record<string, string>> = {};
  if (fs.existsSync(FOCUS_DB_PATH)) {
    try {
      focusDb = JSON.parse(fs.readFileSync(FOCUS_DB_PATH, 'utf-8'));
    } catch {
      focusDb = {};
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

  // Gather real pool candidates
  const languages = ['nl', 'en', 'de', 'fa', 'zh', 'ja'];
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const candidates: { card: LanguageCard; lang: string }[] = [];
  const seenIds = new Set<string>();

  for (const lang of languages) {
    for (const lvl of levels) {
      const native = lang === 'fa' ? 'en' : 'fa';
      const pool = buildSessionCardPool([lang as any], [], lvl as any, native as any, 'standard', 60, 4);
      for (const card of pool) {
        if (!seenIds.has(card.id)) {
          seenIds.add(card.id);
          const m = measureCard(card, lang);
          if (m.lengthClass === 'long' || m.lengthClass === 'tooLong') {
            candidates.push({ card, lang });
          }
        }
      }
    }
  }

  const totalCandidates = candidates.length;
  let batchProcessed = 0;
  let stoppedDueToQuota = false;

  for (const { card, lang } of candidates) {
    if (batchProcessed >= batchLimit) {
      break;
    }

    if (processedSet.has(card.id)) {
      continue;
    }

    const m = card.measured || measureCard(card, lang);
    let focusCandidate: string | null = null;

    if (ai) {
      try {
        const prompt = `Extract a 2 to 5 word core learning chunk from this ${lang} sentence.
Sentence: "${card.targetText}"
RULE: Must appear verbatim in the sentence. Output ONLY the verbatim phrase:`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });

        const raw = response.text ? response.text.trim().replace(/^["']|["']$/g, '') : '';
        const units = countCardUnits(raw, lang);
        if (validateFocusVerbatim(card.targetText, raw) && units >= 2 && units <= 5) {
          focusCandidate = raw;
        }
      } catch (err: any) {
        const errMsg = String(err?.message || err);
        if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota')) {
          console.warn('Quota limit encountered. Pausing batch gracefully.');
          stoppedDueToQuota = true;
          break;
        }
      }
    }

    if (!focusCandidate) {
      focusCandidate = extractHeuristicVerbatimFocus(card.targetText, lang);
    }

    const units = focusCandidate ? countCardUnits(focusCandidate, lang) : 0;
    const isValid = focusCandidate && validateFocusVerbatim(card.targetText, focusCandidate) && units >= 2 && units <= 5;

    if (isValid && focusCandidate) {
      if (!focusDb[card.id]) focusDb[card.id] = {};
      focusDb[card.id][lang] = focusCandidate;
      card.focus = card.focus || {};
      card.focus[lang] = focusCandidate;
      card.focusReviewed = false; // explicitly marked unreviewed

      logToCsv({
        cardId: card.id,
        cefrLevel: card.cefrLevel,
        targetLanguage: lang,
        lengthClass: m.lengthClass,
        units: m.units,
        readSec: m.readSec,
        targetText: card.targetText,
        focusPhrase: focusCandidate,
        focusReviewed: false,
        status: 'ACCEPTED'
      });
      progress.stats.generatedCount++;
    } else {
      logToCsv({
        cardId: card.id,
        cefrLevel: card.cefrLevel,
        targetLanguage: lang,
        lengthClass: m.lengthClass,
        units: m.units,
        readSec: m.readSec,
        targetText: card.targetText,
        focusPhrase: focusCandidate || '',
        focusReviewed: false,
        status: 'REJECTED'
      });
      progress.stats.rejectedCount++;
      progress.rejectedIds.push(card.id);
    }

    processedSet.add(card.id);
    batchProcessed++;
    progress.processedIds = Array.from(processedSet);
    saveProgress(progress);
  }

  fs.writeFileSync(FOCUS_DB_PATH, JSON.stringify(focusDb, null, 2), 'utf-8');
  const doneCount = processedSet.size;

  console.log(`PROGRESS: ${doneCount}/${totalCandidates} (Batch: ${batchProcessed}, QuotaStopped: ${stoppedDueToQuota})`);
  return { doneCount, totalCandidates, batchProcessed, stoppedDueToQuota };
}

if (process.argv[1] && process.argv[1].endsWith('buildFocus.ts')) {
  runBuildFocus(50).catch(console.error);
}
