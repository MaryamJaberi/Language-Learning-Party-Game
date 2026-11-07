const fs = require('fs');
const cards = JSON.parse(fs.readFileSync('data/curatedDatabase.json', 'utf8'));

const caps = {
  A0: 4, 'A0+': 5.0, A1: 6, 'A1+': 7.5, A2: 9, 'A2+': 10.5, 'A2-B1': 10.5,
  B1: 12, 'B1+': 14, B2: 16, 'B2+': 19, C1: 22, 'C1+': 25, C2: 28
};

const segJa = new Intl.Segmenter('ja', { granularity: 'word' });

function getJaUnits(text) {
  if (!text) return 0;
  return Array.from(segJa.segment(text.trim())).filter(s => s.isWordLike).length;
}

const flaggedLevels = ['A0', 'A0+', 'A1+', 'C1'];

for (const lvl of flaggedLevels) {
  const cap = caps[lvl];
  const levelCards = cards.filter(c => (c.rawLevel || c.level) === lvl && c.translations?.ja?.text);
  const longCards = levelCards.filter(c => getJaUnits(c.translations.ja.text) > cap);
  console.log(`=== Level ${lvl} (Cap: ${cap}) - Total JA cards: ${levelCards.length}, Long JA: ${longCards.length} (${(longCards.length/levelCards.length*100).toFixed(1)}%) ===`);
  for (const c of longCards.slice(0, 5)) {
    const jaText = c.translations.ja.text;
    const segs = Array.from(segJa.segment(jaText.trim())).filter(s => s.isWordLike).map(s => s.segment);
    const en = c.translations?.en?.text || c.base_en;
    console.log(`  ID: ${c.id} | EN: "${en}"`);
    console.log(`    JA: "${jaText}" -> Segments (${segs.length} words > cap ${cap}): [${segs.join(', ')}]`);
  }
}
