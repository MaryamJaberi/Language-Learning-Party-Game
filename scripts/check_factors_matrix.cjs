const fs = require('fs');
const cards = JSON.parse(fs.readFileSync('data/curatedDatabase.json', 'utf8'));

const langs = [
  'en', 'en-GB', 'en-US', 'ar', 'fa', 'nl', 'de', 'fr', 'es', 'it',
  'tr', 'pl', 'uk', 'zh', 'ja', 'ko', 'hi', 'pt'
];

const caps = {
  A0: 4, 'A0+': 5.0, A1: 6, 'A1+': 7.5, A2: 9, 'A2+': 10.5, 'A2-B1': 10.5,
  B1: 12, 'B1+': 14, B2: 16, 'B2+': 19, C1: 22, 'C1+': 25, C2: 28
};

const factors = {
  'en': 1.0, 'en-GB': 1.0, 'en-US': 1.0, 'ar': 0.73, 'fa': 0.8, 'nl': 1.0,
  'de': 0.94, 'fr': 1.0, 'es': 1.0, 'it': 0.93, 'tr': 0.65, 'pl': 0.75,
  'uk': 0.74, 'zh': 0.85, 'ja': 1.17, 'ko': 0.6, 'hi': 0.91, 'pt': 0.95
};

function getUnits(text, lang) {
  if (!text) return 0;
  const clean = text.trim();
  if (['ja', 'zh', 'ko'].includes(lang)) {
    const seg = new Intl.Segmenter(lang, { granularity: 'word' });
    const count = Array.from(seg.segment(clean)).filter(s => s.isWordLike).length;
    return Math.max(1, count);
  }
  return Math.max(1, clean.split(/\s+/).filter(Boolean).length);
}

const levels = ['A0', 'A0+', 'A1', 'A1+', 'A2', 'A2+', 'B1', 'B1+', 'B2', 'B2+', 'C1', 'C1+', 'C2'];

const matrix = {};
for (const lvl of levels) {
  matrix[lvl] = {};
  for (const l of langs) {
    matrix[lvl][l] = { total: 0, long: 0, pct: 0 };
  }
}

const flagged = [];

for (const lvl of levels) {
  const baseCap = caps[lvl];
  for (const l of langs) {
    const effCap = baseCap * factors[l];
    const levelCards = cards.filter(c => (c.rawLevel || c.level) === lvl && c.translations?.[l]?.text);
    if (levelCards.length === 0) continue;
    const longCards = levelCards.filter(c => getUnits(c.translations[l].text, l) > effCap);
    const pct = (longCards.length / levelCards.length) * 100;
    matrix[lvl][l] = {
      total: levelCards.length,
      long: longCards.length,
      pct: Math.round(pct * 10) / 10
    };
    if (pct > 35) {
      flagged.push({
        level: lvl,
        lang: l,
        baseCap,
        factor: factors[l],
        effCap: Math.round(effCap * 100) / 100,
        total: levelCards.length,
        long: longCards.length,
        pct: Math.round(pct * 10) / 10,
        examples: longCards.slice(0, 5).map(c => ({
          id: c.id,
          en: c.translations?.en?.text || c.base_en,
          text: c.translations[l].text,
          units: getUnits(c.translations[l].text, l)
        }))
      });
    }
  }
}

console.log('=== LEVEL x LANGUAGE % LONG MATRIX (ALL 18 LOCALES) ===');
console.log('Level | ' + langs.join(' | '));
console.log('---|' + langs.map(() => '---').join('|'));
for (const lvl of levels) {
  const row = langs.map(l => {
    const d = matrix[lvl][l];
    const s = d.pct.toFixed(1) + '%';
    return d.pct > 35 ? '**' + s + '**' : s;
  });
  console.log(lvl + ' | ' + row.join(' | '));
}

console.log('\n=== FLAGGED CELLS (> 35% LONG): ' + flagged.length + ' CELLS ===\n');
for (const f of flagged) {
  console.log(`[FLAG] Level: ${f.level}, Lang: ${f.lang} (${f.pct}% long - ${f.long}/${f.total} cards) [Base Cap: ${f.baseCap}, Factor: ${f.factor}, Eff Cap: ${f.effCap}]`);
  for (const ex of f.examples) {
    console.log(`  - (${ex.id}) EN: "${ex.en}" -> ${f.lang.toUpperCase()}: "${ex.text}" (${ex.units} units > cap ${f.effCap})`);
  }
  console.log('');
}
