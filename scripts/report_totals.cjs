const fs = require('fs');
const db = JSON.parse(fs.readFileSync('data/curatedDatabase.json', 'utf-8'));
const langs = ['fa','en','en-GB','en-US','nl','de','fr','es','it','pt','ar','tr','pl','uk','zh','ja','ko','hi'];

console.log('Language | Human | Generated | Still Empty | Total');
console.log('-'.repeat(58));
langs.forEach(l => {
  let human = 0;
  let gen = 0;
  let empty = 0;
  db.forEach(c => {
    const t = c.translations[l];
    if (!t || !t.text) empty++;
    else if (t.source === 'generated') gen++;
    else human++;
  });
  console.log(`${l.padEnd(8)} | ${String(human).padEnd(5)} | ${String(gen).padEnd(9)} | ${String(empty).padEnd(11)} | ${human + gen + empty}`);
});
