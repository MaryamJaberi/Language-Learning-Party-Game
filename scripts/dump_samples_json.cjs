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

const cards = [
  ...pickByFilter(c => c.type === 'vocabulary' && c.translations.nl?.article, 5),
  ...pickByFilter(c => ['A0', 'A0+', 'A1', 'A1+', 'A2', 'A2+'].includes(c.rawLevel || c.level) && c.type !== 'vocabulary', 5),
  ...pickByFilter(c => ['B1', 'B1+', 'B2', 'B2+'].includes(c.rawLevel || c.level), 5),
  ...pickByFilter(c => ['C1', 'C1+', 'C2'].includes(c.rawLevel || c.level), 5),
];

console.log(JSON.stringify(cards.map(c => ({
  conceptId: c.conceptId,
  level: c.rawLevel || c.level,
  type: c.type,
  en: c.translations.en?.text,
  fa: {
    text: c.translations.fa?.text,
    alts: c.translations.fa?.alternatives,
    source: c.translations.fa?.source || 'human'
  },
  nl: {
    article: c.translations.nl?.article,
    text: c.translations.nl?.text,
    alts: c.translations.nl?.alternatives,
    source: c.translations.nl?.source || 'human'
  }
})), null, 2));
