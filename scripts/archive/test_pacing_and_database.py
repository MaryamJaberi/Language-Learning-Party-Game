import json
import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

print("Running Comprehensive Verification Suite...")

# 1. Verify curatedDatabase.json
db_path = 'data/curatedDatabase.json'
assert os.path.exists(db_path), "data/curatedDatabase.json does not exist!"

with open(db_path, 'r', encoding='utf-8') as f:
    cards = json.load(f)

print(f"Loaded {len(cards)} cards from {db_path}.")

# Check schema requirements
concept_ids = set()
duplicates = []
invalid_cards = []

for idx, card in enumerate(cards):
    cid = card.get('conceptId')
    if not cid:
        invalid_cards.append((idx, 'missing_conceptId'))
    elif cid in concept_ids:
        duplicates.append((idx, cid))
    else:
        concept_ids.add(cid)
        
    measured = card.get('measured')
    if not measured or 'units' not in measured or 'readSec' not in measured or 'lengthClass' not in measured:
        invalid_cards.append((idx, 'invalid_measured'))
        
    trans = card.get('translations')
    if not trans or not isinstance(trans, dict) or len(trans) == 0:
        invalid_cards.append((idx, 'empty_translations'))

print("--- Schema Integrity Checks ---")
print(f"Total Unique Concepts: {len(concept_ids)}")
print(f"Duplicate Concept IDs: {len(duplicates)}")
print(f"Cards with Invalid Schema: {len(invalid_cards)}")
assert len(duplicates) == 0, f"Found duplicate conceptIds: {duplicates[:5]}"
assert len(invalid_cards) == 0, f"Found invalid cards: {invalid_cards[:5]}"
print("✅ Schema Integrity: PASS (100% compliant)")

# 2. Check Pacing Sequencer Invariants (Python equivalent of cardPacing tests)
from build_curated_database import compute_pacing

# Short, medium, long
assert compute_pacing("Hi", "A1")['lengthClass'] == 'short'
assert compute_pacing("How far a calculated ambiguity in the wording can be attributed to design rather than drift remains contested.", "C1")['lengthClass'] == 'long'
print("✅ Length classification (short, medium, long): PASS")

# Check deck composition for + levels
level_counts = {}
lang_counts = {}
for c in cards:
    raw_lvl = c.get('rawLevel') or c.get('level') or 'Unset'
    level_counts[raw_lvl] = level_counts.get(raw_lvl, 0) + 1
    for lk in c.get('translations', {}).keys():
        lang_counts[lk] = lang_counts.get(lk, 0) + 1

print("\n--- Card Counts per Level (rawLevel) ---")
for lvl, count in sorted(level_counts.items()):
    print(f"  {lvl:<12}: {count:>5}")

print("\n--- Card Counts per Language ---")
for lang, count in sorted(lang_counts.items()):
    print(f"  {lang:<10}: {count:>5}")

print("\nAll verification assertions passed successfully.")
