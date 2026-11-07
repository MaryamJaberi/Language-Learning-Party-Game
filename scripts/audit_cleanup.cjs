const fs = require('fs');
const db = JSON.parse(fs.readFileSync('data/curatedDatabase.json', 'utf-8'));

let parenCount = 0;
const parenSamples = [];
let caseCount = 0;
const caseSamples = [];

db.forEach(card => {
  // Vocabulary case cleanup
  if (card.type === 'vocabulary') {
    ['en', 'nl', 'fr', 'es', 'it'].forEach(lang => {
      const t = card.translations[lang];
      if (t && t.text) {
        // If not proper noun (e.g. German stays capitalized, but en/nl/fr/es/it lowercase)
        if (/[A-Z]/.test(t.text) && !/^[A-Z][a-z]+ [A-Z]/.test(t.text)) {
          caseCount++;
          if (caseSamples.length < 10) caseSamples.push({ cid: card.conceptId, lang, text: t.text });
        }
      }
    });
  }

  // Parentheses check
  for (const lang of Object.keys(card.translations)) {
    const t = card.translations[lang];
    if (t && t.text && /\([^)]+\)/.test(t.text)) {
      parenCount++;
      if (parenSamples.length < 10) parenSamples.push({ cid: card.conceptId, lang, text: t.text });
    }
  }
});

console.log('Total translation texts with parentheses:', parenCount);
console.log('Sample parentheses:', parenSamples);
console.log('Total vocabulary texts with uppercase leftovers in en/nl/fr/es/it:', caseCount);
console.log('Sample case leftovers:', caseSamples);
