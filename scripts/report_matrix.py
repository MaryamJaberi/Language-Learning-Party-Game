import json

with open('data/curatedDatabase.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)

langs = ['en', 'fa', 'nl', 'de', 'ja', 'zh']
levels = ['A0', 'A0+', 'A1', 'A1+', 'A2', 'A2+', 'B1', 'B1+', 'B2', 'B2+', 'C1', 'C1+', 'C2']

# matrix: level -> lang -> {'total': X, 'long': Y}
matrix = {lvl: {l: {'total': 0, 'long': 0} for l in langs} for lvl in levels}

for c in cards:
    lvl = c.get('rawLevel') or c.get('level')
    if lvl not in matrix:
        continue
    m_dict = c.get('measured', {})
    for l in langs:
        if l in m_dict:
            matrix[lvl][l]['total'] += 1
            if m_dict[l].get('lengthClass') == 'long':
                matrix[lvl][l]['long'] += 1

print('Level | en | fa | nl | de | ja | zh | Flag (>35%)')
print('---|---|---|---|---|---|---|---')
for lvl in levels:
    row_strs = []
    flagged = []
    for l in langs:
        d = matrix[lvl][l]
        tot = d['total']
        pct = (d['long'] / tot * 100) if tot > 0 else 0
        pct_str = f"{pct:.1f}% ({d['long']}/{tot})"
        if pct > 35.0:
            flagged.append(f"{l}: {pct:.1f}%")
            pct_str = f"**{pct_str}**"
        row_strs.append(pct_str)
    flag_str = ', '.join(flagged) if flagged else 'None (OK)'
    line = ' | '.join(row_strs)
    print(f"{lvl} | {line} | {flag_str}")
