import { buildSessionCardPool, CURATED_LANGUAGE_CARDS, generateSyntheticCardsForLanguage } from './cardsData';
import { SUPPORTED_LANGUAGES } from './constants';
import { PHRASE_STATS, cardsFromPhraseBank } from './phraseBank';
import { UNIVERSAL_CONCEPTS, buildCardsFromConcepts } from './multiLangDictionary';
import { CEFRLevel, Language, CardGameMode } from './types';

console.log('=== STARTING DEEP AUDIT SIMULATION ===\n');

// 1. CEFR LEAK AUDIT
console.log('--- 1. CEFR LEVEL LEAK AUDIT ---');
const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const testTargets: Language[][] = [
  ['en'],
  ['nl'],
  ['es'],
  ['de', 'fr'],
  ['nl', 'es', 'it'],
  ['ru', 'zh', 'ja', 'ko'],
  ['nl', 'de', 'es', 'fr', 'it']
];

let totalLeakFailures = 0;
levels.forEach(lvl => {
  testTargets.forEach(targets => {
    const pool = buildSessionCardPool(targets, [], lvl, 'fa', 'mixed');
    const leaks = pool.filter(c => c.cefrLevel !== lvl);
    if (leaks.length > 0) {
      console.error(`[LEAK DETECTED] Requested Level: ${lvl}, Targets: ${targets.join(',')}, Found ${leaks.length} cards with wrong level:`, leaks.map(l => `${l.id}: ${l.cefrLevel}`).slice(0, 3));
      totalLeakFailures++;
    }
  });
});
console.log(`CEFR Leak Results: ${totalLeakFailures === 0 ? 'PASSED (0 Leaks across all levels and targets)' : `FAILED (${totalLeakFailures} leaks)`}`);

// 2. EMPTY / UNDEFINED CARD AUDIT (3+ LANGUAGES)
console.log('\n--- 2. EMPTY / UNDEFINED CARD AUDIT (3+ LANGUAGES) ---');
let emptyCardFailures = 0;
const allLangs: Language[] = ['en', 'nl', 'de', 'fr', 'es', 'it', 'fa', 'ar', 'tr', 'pl', 'uk', 'ru', 'pt', 'zh', 'ja', 'ko', 'hi'];

// Test combinations with 3, 4, 5 languages
const multiLangCombos: Language[][] = [
  ['nl', 'de', 'es'],
  ['fr', 'it', 'ru'],
  ['zh', 'ja', 'ko'],
  ['fa', 'ar', 'tr'],
  ['en', 'nl', 'pl', 'uk'],
  ['ru', 'pt', 'zh', 'ja', 'ko', 'hi']
];

multiLangCombos.forEach(targets => {
  levels.forEach(lvl => {
    const pool = buildSessionCardPool(targets, [], lvl, 'fa', 'mixed');
    pool.forEach(c => {
      const hasEmptyTarget = !c.targetText || c.targetText.trim() === '' || c.targetText === 'undefined';
      const hasEmptyTrans = !c.translation || c.translation.trim() === '' || c.translation === 'undefined';
      if (hasEmptyTarget || hasEmptyTrans) {
        console.error(`[EMPTY/UNDEFINED CARD] Card ID: ${c.id}, Level: ${c.cefrLevel}, TargetLang: ${c.targetLanguage}, targetText: "${c.targetText}", translation: "${c.translation}"`);
        emptyCardFailures++;
      }
    });
  });
});
console.log(`Empty/Undefined Card Results: ${emptyCardFailures === 0 ? 'PASSED (0 empty or undefined fields found)' : `FAILED (${emptyCardFailures} empty cards)`}`);

// 3. NATIVE LANGUAGE IN TARGET LANGUAGES AUDIT
console.log('\n--- 3. NATIVE IN TARGET LANGUAGES AUDIT ---');
let nativeLeakFailures = 0;
const nativeTests: { native: Language; targets: Language[] }[] = [
  { native: 'fa', targets: ['fa', 'en', 'nl'] },
  { native: 'en', targets: ['en', 'nl', 'es'] },
  { native: 'fa', targets: ['fa'] },
  { native: 'en', targets: ['en-US', 'en'] }
];

nativeTests.forEach(({ native, targets }) => {
  ['standard', 'reverse', 'mixed'].forEach(mode => {
    const pool = buildSessionCardPool(targets, [], 'all', native, mode as CardGameMode);
    pool.forEach(c => {
      if (c.targetLanguage === native) {
        console.error(`[NATIVE IN TARGET] Native: ${native}, TargetLang on card: ${c.targetLanguage}, Mode: ${mode}`);
        nativeLeakFailures++;
      }
      if (c.targetText === c.translation) {
        console.error(`[SAME SOURCE AND TARGET] Text and Trans identical: "${c.targetText}" === "${c.translation}"`);
        nativeLeakFailures++;
      }
    });
  });
});
console.log(`Native in Target Results: ${nativeLeakFailures === 0 ? 'PASSED (Native language strictly filtered from active target pool)' : `FAILED (${nativeLeakFailures} leaks)`}`);

// 4. CARD POOL DISTRIBUTION & EXHAUSTION SIMULATION
console.log('\n--- 4. CARD POOL DISTRIBUTION & EXHAUSTION SIMULATION ---');
// In a game: Players * Rounds = Required Cards
// e.g. 4 players * 3 rounds = 12 cards
// 4 players * 10 rounds = 40 cards
// 8 players * 10 rounds = 80 cards
const gameConfigs = [
  { players: 4, rounds: 3, targets: ['en'], level: 'A1' as CEFRLevel },
  { players: 4, rounds: 5, targets: ['nl', 'es'], level: 'A1' as CEFRLevel },
  { players: 6, rounds: 5, targets: ['de', 'fr'], level: 'B1' as CEFRLevel },
  { players: 8, rounds: 10, targets: ['en', 'nl', 'de'], level: 'C1' as CEFRLevel },
  { players: 8, rounds: 10, targets: ['ru'], level: 'A1' as CEFRLevel }
];

gameConfigs.forEach(cfg => {
  const pool = buildSessionCardPool(cfg.targets, [], cfg.level, 'fa', 'mixed');
  const needed = cfg.players * cfg.rounds;
  console.log(`Config: ${cfg.players}P x ${cfg.rounds}R (${needed} cards needed) | Level: ${cfg.level} | Targets: ${cfg.targets.join(',')} -> Pool size: ${pool.length} cards (Ratio: ${(pool.length / needed).toFixed(1)}x)`);
});

// 5. DATASET COMPONENT COUNTS
console.log('\n--- 5. DATASET INVENTORY COUNTS ---');
console.log(`- Curated cards: ${CURATED_LANGUAGE_CARDS.length}`);
console.log(`- Phrase bank entries: ${PHRASE_STATS.totalEntries}`);
console.log(`- Universal concepts: ${UNIVERSAL_CONCEPTS.length}`);
console.log(`- Supported languages: ${SUPPORTED_LANGUAGES.length}`);

console.log('\n=== AUDIT SIMULATION COMPLETE ===');
