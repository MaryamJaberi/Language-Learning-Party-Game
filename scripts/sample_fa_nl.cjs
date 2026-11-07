const fs = require('fs');
const db = JSON.parse(fs.readFileSync('data/curatedDatabase.json', 'utf-8'));

function getSamples(lang, count) {
  const step = Math.floor(db.length / count);
  const samples = [];
  for (let i = 0; i < count; i++) {
    const idx = (i * step + 31) % db.length;
    const card = db[idx];
    const trans = card.translations[lang] || {};
    const enTrans = card.translations['en'] || {};
    samples.push({
      conceptId: card.conceptId,
      level: card.rawLevel || card.level,
      type: card.type,
      english: enTrans.text || '',
      targetText: trans.text || '',
      article: trans.article || undefined,
      alternatives: trans.alternatives || undefined,
      source: trans.source || 'human'
    });
  }
  return samples;
}

console.log('=== 20 PERSIAN SAMPLES ===');
console.log(JSON.stringify(getSamples('fa', 20), null, 2));

console.log('\n=== 20 DUTCH SAMPLES ===');
console.log(JSON.stringify(getSamples('nl', 20), null, 2));
