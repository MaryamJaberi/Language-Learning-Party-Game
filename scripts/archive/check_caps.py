import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

with open('data/curatedDatabase.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)

caps = {
    'A0': 4,
    'A0+': 4,
    'A1': 6,
    'A1+': 7.5,
    'A2': 9,
    'A2+': 10.5,
    'A2-B1': 10.5,
    'B1': 12,
    'B1+': 14,
    'B2': 16,
    'B2+': 19,
    'C1': 22,
    'C1+': 25,
    'C2': 28
}

stats = {}
for c in cards:
    lvl = c.get('rawLevel') or c.get('level') or 'A1'
    if lvl == 'easy': lvl = 'A1'
    elif lvl == 'medium': lvl = 'A2'
    elif lvl == 'hard': lvl = 'B1'
    if lvl == 'Collocation': continue
    
    cap = caps.get(lvl, 12)
    text = c.get('translations', {}).get('en', {}).get('text') or c.get('base_en', '')
    units = len(text.strip().split())
    
    if units > cap:
        lclass = 'long'
    elif units > 0.60 * cap:
        lclass = 'medium'
    else:
        lclass = 'short'
        
    stats.setdefault(lvl, {'total': 0, 'short': 0, 'medium': 0, 'long': 0})
    stats[lvl]['total'] += 1
    stats[lvl][lclass] += 1

print(f"{'Level':<8} | {'Total':<6} | {'Cap':<5} | {'Short':<6} | {'Med':<6} | {'Long':<6} | {'% Long':<8}")
print("-" * 60)
for lvl in ['A0', 'A0+', 'A1', 'A1+', 'A2', 'A2+', 'B1', 'B1+', 'B2', 'B2+', 'C1', 'C1+', 'C2']:
    s = stats.get(lvl, {'total': 0, 'short': 0, 'medium': 0, 'long': 0})
    pct = (s['long'] / s['total'] * 100) if s['total'] > 0 else 0
    print(f"{lvl:<8} | {s['total']:>6} | {caps.get(lvl):>5} | {s['short']:>6} | {s['medium']:>6} | {s['long']:>6} | {pct:>6.1f}%")
