# scripts/analyze_diff_and_overlap.py
import json
import csv
import sys
import re

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# 1. Load current 6,478 items
with open('phrases.json', 'r', encoding='utf-8') as f:
    current_items = json.load(f)

print(f"Current phrases.json has {len(current_items):,} items.")

# Normalize text for deduplication
def norm(s):
    if not s:
        return ''
    s = str(s).lower().strip()
    s = re.sub(r'[^\w\s]', '', s)
    return ' '.join(s.split())

current_norm_en = set()
for it in current_items:
    txt = it.get('texts', {}).get('en') or it.get('texts', {}).get('en-US') or it.get('prompt') or ''
    if txt:
        current_norm_en.add(norm(txt))

print(f"Unique normalized English entries in current phrases.json: {len(current_norm_en):,}")

# 2. Check Master_Learning_Items_COMPLETE_FINAL.xlsx / Dour_DB_Optimized.csv
csv_path = 'data/previous_folder_download/Dour_DB_Optimized.csv'
csv_unique_new = 0
csv_total = 0
level_dist_new = {}

with open(csv_path, 'r', encoding='utf-8', errors='ignore') as f:
    reader = csv.reader(f)
    header = next(reader)
    # find EN index
    en_idx = 0
    level_idx = header.index('Level') if 'Level' in header else 3
    
    for row in reader:
        csv_total += 1
        if not row:
            continue
        en_val = row[en_idx] if en_idx < len(row) else ''
        n = norm(en_val)
        lvl = row[level_idx] if level_idx < len(row) else 'A1'
        if n and n not in current_norm_en:
            csv_unique_new += 1
            level_dist_new[lvl] = level_dist_new.get(lvl, 0) + 1

print(f"\nIn Dour_DB_Optimized.csv (total {csv_total:,} rows):")
print(f"  New phrases not in current phrases.json: {csv_unique_new:,}")
print("  Distribution of new phrases by level:")
for lvl, c in sorted(level_dist_new.items()):
    print(f"    {lvl:6}: {c:,}")
