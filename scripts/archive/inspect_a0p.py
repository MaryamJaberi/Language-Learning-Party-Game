import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

with open('data/curatedDatabase.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)

a0p = [c for c in cards if c.get('rawLevel') == 'A0+']
print(f"Total A0+ cards: {len(a0p)}")
long_a0p = []
for c in a0p:
    txt = c.get('translations', {}).get('en', {}).get('text') or c.get('base_en', '')
    w = txt.strip().split()
    if len(w) > 4:
        long_a0p.append((len(w), c['id'], txt))

print(f"A0+ cards with > 4 units ({len(long_a0p)} / {len(a0p)} = {len(long_a0p)/len(a0p)*100:.1f}%):")
for words_len, cid, text in sorted(long_a0p, key=lambda x: -x[0]):
    print(f"  {words_len} words | {cid:<20} | {text}")
