import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/audit_output.json', 'r', encoding='utf-8') as f:
    files = json.load(f)

for item in files:
    fn = item['filename']
    fmt = item['format']
    size_kb = item['size'] / 1024
    mtime = item['mtime']
    if fmt == '.xlsx':
        sheets = item.get('sheets', {})
        s_summary = []
        for s, meta in sheets.items():
            if 'Instructions' not in s:
                s_summary.append(f"{s} ({meta['row_count']} rows, {len(meta['columns'])} cols, levels={meta.get('levels')})")
        print(f"{fn:<42} | XLSX | {size_kb:>8.1f} KB | {mtime} | {'; '.join(s_summary)}")
    elif fmt == '.csv':
        csv_info = item.get('csv', {})
        cols_count = len(csv_info.get('columns', []))
        print(f"{fn:<42} | CSV  | {size_kb:>8.1f} KB | {mtime} | Rows: {csv_info.get('row_count')}, Cols: {cols_count}, Levels: {csv_info.get('levels')}")
    elif fmt == '.zip':
        print(f"{fn:<42} | ZIP  | {size_kb:>8.1f} KB | {mtime} | Entries: {len(item.get('zip_contents', []))}")
    else:
        print(f"{fn:<42} | {fmt:<4} | {size_kb:>8.1f} KB | {mtime}")
