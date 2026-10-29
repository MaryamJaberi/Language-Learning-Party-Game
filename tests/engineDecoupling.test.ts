// tests/engineDecoupling.test.ts — Architectural decoupling test (Epic D3)
// Verifies that monetization, payment, and freemium modules NEVER import the adaptive difficulty engine.

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Architectural Decoupling: Adaptive Engine vs Monetization (Epic D3)', () => {
  it('strictly forbids any monetization, payment, or ad module from importing or reading engine state', () => {
    const rootDir = path.resolve(__dirname, '..');
    const forbiddenPatterns = [
      /import.*from.*engine\/adaptive/i,
      /import.*from.*dor-adaptive-engine/i,
      /require\(.*adaptive.*\)/i,
      /\.theta\b/,
      /\.failStreak\b/,
      /\.rescueTarget\b/
    ];

    const monetizationFiles: string[] = [];

    function findMonetizationFiles(dir: string) {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'dev-dist') continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          findMonetizationFiles(fullPath);
        } else {
          const lower = file.toLowerCase();
          if (
            lower.includes('monetiz') ||
            lower.includes('payment') ||
            lower.includes('purchase') ||
            lower.includes('freemium') ||
            lower.includes('admanager') ||
            lower.includes('subscription')
          ) {
            monetizationFiles.push(fullPath);
          }
        }
      }
    }

    findMonetizationFiles(rootDir);

    // Verify all identified monetization files (if any exist) have 0 references to the engine
    for (const filePath of monetizationFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      for (const pattern of forbiddenPatterns) {
        const matches = pattern.test(content);
        expect(matches).toBe(false);
      }
    }

    // Verify that the engine exports itself do not import any payment or monetization code
    const engineFile = path.resolve(rootDir, 'src/engine/adaptive/dor-adaptive-engine.ts');
    const engineContent = fs.readFileSync(engineFile, 'utf-8');
    expect(/payment|purchase|monetiz|freemium|stripe|billing|admob/i.test(engineContent)).toBe(false);
  });
});
