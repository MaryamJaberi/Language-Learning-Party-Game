// dor-adaptive-engine.mjs — Root wrapper re-exporting from ./src/engine/adaptive/dor-adaptive-engine.ts
// for compatibility with standalone Node.js execution.

export {
  CEFR_B,
  CEFR_ORDER,
  TYPE_OFFSET,
  DEFAULTS,
  DAY,
  retrievability,
  mulberry32,
  createPlayer,
  createItemStats,
  predict,
  Session,
  indicatorFor,
  messageFor,
  scoreCard,
  MultiplayerGame
} from './src/engine/adaptive/dor-adaptive-engine.ts';
