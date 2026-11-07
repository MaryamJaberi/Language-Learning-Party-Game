import json
import csv
import re

with open('data/sources/dour_complete_language_dataset.csv', 'r', encoding='utf-8') as f:
    csv_rows = list(csv.DictReader(f))

vocab_rows = [r for r in csv_rows if r.get('CEFR_Difficulty', '').lower() in ['easy', 'medium', 'hard']]

with open('data/curatedDatabase_python.json', 'r', encoding='utf-8') as f:
    old_cards = {c['conceptId']: c for c in json.load(f)}

with open('data/curatedDatabase.json', 'r', encoding='utf-8') as f:
    new_cards = {c['conceptId']: c for c in json.load(f)}

def make_concept_id(base_en):
    t = str(base_en).lower().strip()
    t = re.sub(r'[^\w\s]', '', t)
    slug = re.sub(r'[^a-z0-9_]+', '_', t).strip('_')
    return f'c_{slug[:60]}' if slug else 'c_empty'

matched_43 = []
for r in vocab_rows:
    en = r.get('English', '').strip() or r.get('Target_Text', '').strip()
    cid = make_concept_id(en)
    if cid in old_cards and old_cards[cid].get('source') != 'dour_complete_language_dataset.csv':
        matched_43.append((cid, en, r))

print(f"Total matched curated vocabulary cards: {len(matched_43)}")

changed_fa = 0
changed_nl = 0
changed_en = 0
changed_any = 0

diff_samples = []

for cid, en, r in matched_43:
    old_c = old_cards[cid]
    new_c = new_cards[cid]

    old_fa = old_c['translations'].get('fa', {}).get('text', '')
    new_fa = new_c['translations'].get('fa', {}).get('text', '')

    old_nl = old_c['translations'].get('nl', {}).get('text', '')
    new_nl = new_c['translations'].get('nl', {}).get('text', '')

    old_en = old_c['translations'].get('en', {}).get('text', '')
    new_en = new_c['translations'].get('en', {}).get('text', '')

    fa_diff = old_fa != new_fa
    nl_diff = old_nl != new_nl
    en_diff = old_en != new_en

    if fa_diff: changed_fa += 1
    if nl_diff: changed_nl += 1
    if en_diff: changed_en += 1

    if fa_diff or nl_diff or en_diff:
        changed_any += 1
        diff_samples.append({
            'conceptId': cid,
            'en': (old_en, new_en) if en_diff else None,
            'fa': (old_fa, new_fa) if fa_diff else None,
            'nl': (old_nl, new_nl) if nl_diff else None,
        })

print(f"\nOut of {len(matched_43)} curated vocabulary cards:")
print(f"  - Cards changed in Persian (fa): {changed_fa}")
print(f"  - Cards changed in Dutch (nl): {changed_nl}")
print(f"  - Cards changed in English (en): {changed_en}")
print(f"  - Total cards with at least one change in fa/nl/en: {changed_any}")

print("\nSample changed cards:")
for s in diff_samples[:8]:
    print(s)
