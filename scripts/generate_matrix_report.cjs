const fs = require('fs');
const db = JSON.parse(fs.readFileSync('data/curatedDatabase.json', 'utf-8'));
const { LEVEL_CAPS, BAND_PACING_FACTORS, getLevelBand } = require('../src/engine/pacing/cardPacingConfig');

function getWordUnits(text, lang) {
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

const levels = ['A0', 'A0+', 'A1', 'A1+', 'A2', 'A2+', 'B1', 'B1+', 'B2', 'B2+', 'C1', 'C1+', 'C2'];
const langs = ['en', 'en-GB', 'en-US', 'nl', 'de', 'fr', 'es', 'it', 'fa', 'ar', 'tr', 'pl', 'uk', 'zh', 'ja', 'ko', 'hi', 'pt'];

const highCells = [];

console.log('Level | ' + langs.map(l => l.padEnd(5)).join(' | '));
console.log('-'.repeat(125));

levels.forEach(lvl => {
  const band = getLevelBand(lvl);
  const baseCap = LEVEL_CAPS[lvl];
  const row = [lvl.padEnd(5)];

  langs.forEach(lang => {
    const factor = BAND_PACING_FACTORS[lang]?.[band] || 1.0;
    const effCap = Math.max(baseCap, baseCap * factor);
    const capThreshold = Math.ceil(effCap);

    let total = 0;
    let longCount = 0;
    const sampleLong = [];

    db.forEach(card => {
      const cardLvl = card.rawLevel || card.level;
      if (cardLvl !== lvl) return;
      const text = card.translations?.[lang]?.text;
      if (!text) return;
      total++;
      const u = getWordUnits(text, lang);
      if (u > capThreshold) {
        longCount++;
        if (sampleLong.length < 3) sampleLong.push({ id: card.id, text, u, cap: capThreshold });
      }
    });

    const pct = total > 0 ? (longCount / total * 100).toFixed(1) : '0.0';
    if (parseFloat(pct) > 35) {
      highCells.push({ level: lvl, lang, pct: parseFloat(pct), total, longCount, samples: sampleLong });
      row.push((pct + '%*').padEnd(5));
    } else {
      row.push((pct + '%').padEnd(5));
    }
  });

  console.log(row.join(' | '));
});

console.log('\n=== Cells > 35% Long ===');
if (highCells.length === 0) {
  console.log('NONE! All cells across all 18 locales and all levels are <= 35% long.');
} else {
  console.log(JSON.stringify(highCells, null, 2));
}
