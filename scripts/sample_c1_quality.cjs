const XLSX = require('xlsx');
const fs = require('fs');

const wbFinal = XLSX.readFile('data/previous_folder_download/C1_Multilingual_Phrases_FINAL.xlsx');
const sheetFinal = wbFinal.Sheets['C1_Items'] || wbFinal.Sheets[wbFinal.SheetNames[0]];
const dataFinal = XLSX.utils.sheet_to_json(sheetFinal);

const wbSync = XLSX.readFile('data/google_drive_sync/C1_Multilingual_Phrases.xlsx');
const sheetSync = wbSync.Sheets['C1_Items'] || wbSync.Sheets[wbSync.SheetNames[1]] || wbSync.Sheets[wbSync.SheetNames[0]];
const dataSync = XLSX.utils.sheet_to_json(sheetSync);

const syncEn = new Set(dataSync.map(r => (r['English (Base)'] || r['EN base'] || r['English'] || '').trim().toLowerCase()));

const c1FinalOnly = dataFinal.filter(r => {
  const en = (r['EN base'] || r['English (Base)'] || r['English'] || '').trim().toLowerCase();
  return en && !syncEn.has(en);
});

console.log('Total C1 FINAL rows:', dataFinal.length);
console.log('Total C1 Sync rows (C1_Items):', dataSync.length);
console.log('C1 FINAL only rows (expansion):', c1FinalOnly.length);

// Sample 50 random English sentences from c1FinalOnly
const sample50 = [];
const step = Math.floor(c1FinalOnly.length / 50);
for (let i = 0; i < 50; i++) {
  const idx = (i * step + 17) % c1FinalOnly.length;
  const r = c1FinalOnly[idx];
  sample50.push({
    index: i + 1,
    id: r['ID'] || r['id'] || `row_${idx}`,
    en: (r['EN base'] || r['English (Base)'] || r['English'] || '').trim()
  });
}

fs.writeFileSync('scripts/scratch_c1_sample50.json', JSON.stringify(sample50, null, 2));
console.log('Sampled 50 sentences saved to scripts/scratch_c1_sample50.json');
