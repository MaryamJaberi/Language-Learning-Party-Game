const fs = require('fs');
const db = JSON.parse(fs.readFileSync('data/curatedDatabase.json', 'utf-8'));

function pickByFilter(filterFn, count) {
  const matches = db.filter(filterFn);
  const step = Math.max(1, Math.floor(matches.length / count));
  const picked = [];
  for (let i = 0; i < count && i * step < matches.length; i++) {
    picked.push(matches[i * step]);
  }
  return picked;
}

// 5 vocab (with article for Dutch), 5 A0-A2, 5 B1-B2, 5 C1-C2
const cards = [
  ...pickByFilter(c => c.type === 'vocabulary' && c.translations.nl?.article, 5),
  ...pickByFilter(c => ['A0', 'A0+', 'A1', 'A1+', 'A2', 'A2+'].includes(c.rawLevel || c.level) && c.type !== 'vocabulary', 5),
  ...pickByFilter(c => ['B1', 'B1+', 'B2', 'B2+'].includes(c.rawLevel || c.level), 5),
  ...pickByFilter(c => ['C1', 'C1+', 'C2'].includes(c.rawLevel || c.level), 5),
];

function formatRow(card, lang) {
  const t = card.translations[lang] || {};
  const en = card.translations.en?.text || '';
  const text = t.text || '';
  const article = t.article ? `[${t.article}] ` : '';
  const alts = t.alternatives && t.alternatives.length ? ` (alts: ${t.alternatives.join(', ')})` : '';
  const src = t.source || 'human';
  return {
    conceptId: card.conceptId,
    level: card.rawLevel || card.level,
    type: card.type,
    english: en,
    translation: `${article}${text}${alts}`,
    source: src
  };
}

console.log('=== PERSIAN SAMPLES (20) ===');
console.table(cards.map(c => formatRow(c, 'fa')));

console.log('\n=== DUTCH SAMPLES (20) ===');
console.table(cards.map(c => formatRow(c, 'nl')));
