import csv
import json
import re
import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def normalize_trivial(text):
    if not text:
        return ''
    t = str(text).strip()
    # Quotes
    t = re.sub(r'[\'\"‘’“”«»`]', '', t)
    # Persian/Arabic letters
    t = t.replace('\u064A', '\u06CC')
    t = t.replace('\u0643', '\u06A9')
    # ZWNJ
    t = t.replace('\u200C', '')
    # Punctuation at ends
    t = re.sub(r'^[.,!?:;؟،؛\s]+|[.,!?:;؟،؛\s]+$', '', t)
    # Internal punctuation
    t = re.sub(r'[.,!?:;؟،؛]', '', t)
    # Whitespace
    t = re.sub(r'\s+', ' ', t).strip().lower()
    return t

# Load curatedDatabase to look up level for each conceptId
with open('data/curatedDatabase.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)
cid_to_level = {c['conceptId']: c.get('rawLevel') or c.get('level') or 'A1' for c in cards}

conflicts_file = 'data/reports/conflicts.csv'
assert os.path.exists(conflicts_file), "conflicts.csv not found!"

with open(conflicts_file, 'r', encoding='utf-8') as f:
    reader = list(csv.DictReader(f))

total_conflicts = len(reader)
auto_resolved_punctuation = []
word_level_differences = []

for row in reader:
    cid = row['conceptId']
    lang = row['lang']
    raw_a = row['version_A'].split(':', 1)[1].strip() if ':' in row['version_A'] else row['version_A']
    raw_b = row['version_B'].split(':', 1)[1].strip() if ':' in row['version_B'] else row['version_B']
    
    norm_a = normalize_trivial(raw_a)
    norm_b = normalize_trivial(raw_b)
    
    lvl = cid_to_level.get(cid, 'Unknown')
    
    entry = {
        'conceptId': cid,
        'level': lvl,
        'lang': lang,
        'version_A': row['version_A'],
        'version_B': row['version_B'],
        'chosen': row['chosen']
    }
    
    if norm_a == norm_b:
        auto_resolved_punctuation.append(entry)
    else:
        word_level_differences.append(entry)

print(f"Total Raw Conflicts Logged: {total_conflicts}")
print(f"Punctuation / Trivial Differences (Auto-Resolved & Dropped): {len(auto_resolved_punctuation)} ({len(auto_resolved_punctuation)/total_conflicts*100:.1f}%)")
print(f"Word-Level Differences (Requires Review): {len(word_level_differences)} ({len(word_level_differences)/total_conflicts*100:.1f}%)")

# Level sort order
level_order = {'A0': 1, 'A0+': 2, 'A1': 3, 'A1+': 4, 'A2': 5, 'A2+': 6, 'A2-B1': 7, 'B1': 8, 'B1+': 9, 'B2': 10, 'B2+': 11, 'C1': 12, 'C1+': 13, 'C2': 14}
word_level_differences.sort(key=lambda x: (level_order.get(x['level'], 99), x['conceptId'], x['lang']))

# Write data/reports/conflicts_review.csv
out_review_path = 'data/reports/conflicts_review.csv'
with open(out_review_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['conceptId', 'level', 'lang', 'version_A', 'version_B', 'chosen'])
    writer.writeheader()
    for row in word_level_differences:
        writer.writerow(row)

print(f"Exported sorted review list to {out_review_path} with {len(word_level_differences)} entries.")

# Breakdown by language for word-level differences
by_lang_word = {}
for r in word_level_differences:
    l = r['lang']
    by_lang_word[l] = by_lang_word.get(l, 0) + 1
print("\nWord-Level Differences by Language:", dict(sorted(by_lang_word.items(), key=lambda x: -x[1])))

# Breakdown by level for word-level differences
by_lvl_word = {}
for r in word_level_differences:
    lv = r['level']
    by_lvl_word[lv] = by_lvl_word.get(lv, 0) + 1
print("Word-Level Differences by Level:", dict(sorted(by_lvl_word.items(), key=lambda x: level_order.get(x[0], 99))))
