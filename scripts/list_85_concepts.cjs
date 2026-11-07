const fs = require('fs');
const items = JSON.parse(fs.readFileSync('scripts/scratch_concepts_to_translate.json', 'utf-8'));
console.log('Total items:', items.length);
items.forEach((it, i) => {
  console.log((i + 1) + '. [' + it.cid + '] "' + it.en + '" -> needs: ' + it.langs.join(', '));
});
