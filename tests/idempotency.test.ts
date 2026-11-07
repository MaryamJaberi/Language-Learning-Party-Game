import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { runPipeline } from '../scripts/importDatabase';

describe('Database Importer Idempotency & Stability', () => {
  it('produces identical SHA-256 hash and stable conceptIds on consecutive runs', () => {
    // Run 1
    const run1Cards = runPipeline();
    const dbPath = path.resolve('data/curatedDatabase.json');
    expect(fs.existsSync(dbPath)).toBe(true);

    const bytes1 = fs.readFileSync(dbPath);
    const hash1 = crypto.createHash('sha256').update(bytes1).digest('hex');
    const cids1 = run1Cards.map((c) => c.conceptId);

    // Run 2
    const run2Cards = runPipeline();
    const bytes2 = fs.readFileSync(dbPath);
    const hash2 = crypto.createHash('sha256').update(bytes2).digest('hex');
    const cids2 = run2Cards.map((c) => c.conceptId);

    // Assert identical hashes & stable concept IDs
    expect(hash2).toBe(hash1);
    expect(cids2).toEqual(cids1);
    expect(run2Cards.length).toBe(run1Cards.length);
  }, 30000);
});
