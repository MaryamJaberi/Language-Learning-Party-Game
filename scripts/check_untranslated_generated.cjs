const fs = require('fs');
const db = JSON.parse(fs.readFileSync('data/curatedDatabase.json', 'utf-8'));
const latinLangs = ['nl', 'de', 'fr', 'es', 'it', 'pt', 'tr', 'pl'];
const generatedCopies = {};
const humanCopies = {};
latinLangs.forEach(l => {
  generatedCopies[l] = [];
  humanCopies[l] = [];
});

db.forEach(card => {
  const en = (card.translations.en?.text || '').trim();
  if (!en) return;
  latinLangs.forEach(l => {
    const t = card.translations[l];
    if (t && t.text && t.text.trim().toLowerCase() === en.toLowerCase()) {
      if (t.source === 'generated') {
        generatedCopies[l].push({ conceptId: card.conceptId, en: en, type: card.type, level: card.rawLevel || card.level });
      } else {
        humanCopies[l].push({ conceptId: card.conceptId, en: en, type: card.type, level: card.rawLevel || card.level });
      }
    }
  });
});

console.log('=== Copies of English ===');
latinLangs.forEach(l => {
  console.log(l + ' -> generated: ' + generatedCopies[l].length + ', human (source sheets/loanwords): ' + humanCopies[l].length);
});

// Let us inspect the generated copies for each language
fs.writeFileSync('scripts/scratch_generated_copies.json', JSON.stringify(generatedCopies, null, 2));
