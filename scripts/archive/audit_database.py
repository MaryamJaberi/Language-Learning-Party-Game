import os
import sys
import zipfile
import xml.etree.ElementTree as ET
import csv
import json
import re
import io
import subprocess

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def read_xlsx(path):
    if not os.path.exists(path):
        return None
    with zipfile.ZipFile(path, 'r') as z:
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                text = ''.join([t.text or '' for t in si.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')])
                shared_strings.append(text)
        
        wb = ET.fromstring(z.read('xl/workbook.xml'))
        sheets = []
        for s in wb.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet'):
            name = s.get('name', '')
            r_id = None
            for k, v in s.attrib.items():
                if k.endswith('id'):
                    r_id = v
            sheets.append((name, r_id))
        
        rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        rel_map = {}
        for r in rels.iter('{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'):
            rel_map[r.get('Id')] = r.get('Target', '')
        
        results = {}
        for sheet_name, r_id in sheets:
            target = rel_map.get(r_id, '').lstrip('/')
            if not target.startswith('xl/'):
                target = 'xl/' + target
            if target not in z.namelist():
                continue
            sheet_xml = ET.fromstring(z.read(target))
            rows = []
            for r in sheet_xml.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
                row_vals = []
                for c in r.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                    t = c.get('t')
                    if t == 'inlineStr':
                        is_elem = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}is')
                        val = ''.join([t_node.text or '' for t_node in is_elem.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')]) if is_elem is not None else ''
                    else:
                        v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                        val = v.text if v is not None else ''
                        if t == 's' and val.isdigit():
                            idx = int(val)
                            val = shared_strings[idx] if idx < len(shared_strings) else val
                    row_vals.append(val)
                rows.append(row_vals)
            results[sheet_name] = rows
        return results

def normalize_text(text):
    if not text:
        return ''
    t = str(text).lower().strip()
    t = re.sub(r'[^\w\s]', '', t, flags=re.UNICODE)
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def run_audit():
    print("================================================================================")
    print("PHASE 0 AUDIT REPORT: CURATED SOURCE DATASETS & OVERLAP ANALYSIS")
    print("================================================================================")

# 1. Inspect source files
# Check git commit 8b36cd6 version of dour_complete_language_dataset.csv (330 rows)
raw_csv_330 = subprocess.check_output(['git', 'show', '8b36cd6f3fc4846f2edb9229f7cc0263ab2184da:public/downloads/dour_complete_language_dataset.csv'], encoding='utf-8', errors='replace')
csv_330_rows = list(csv.DictReader(io.StringIO(raw_csv_330)))

print(f"\n1. SOURCE FILE: dour_complete_language_dataset.csv (Original 330-row curated dataset)")
print(f"   Git Origin: Commit 8b36cd6 (public/downloads/dour_complete_language_dataset.csv)")
print(f"   Row Count: {len(csv_330_rows)}")
print(f"   Headers ({len(csv_330_rows[0].keys())}): {list(csv_330_rows[0].keys())}")
types_330 = {}
for r in csv_330_rows:
    t = r.get('Data_Type', '')
    types_330[t] = types_330.get(t, 0) + 1
print(f"   Data Types: {types_330}")

# Languages in 330 CSV:
langs_330 = ['Persian_Farsi', 'English', 'Dutch_Nederlands', 'German_Deutsch', 'French_Francais', 'Spanish_Espanol', 'Italian_Italiano', 'Arabic', 'Turkish', 'Polish', 'Ukrainian']
lang_counts_330 = {l: sum(1 for r in csv_330_rows if r.get(l, '').strip()) for l in langs_330}
print(f"   Languages Present: {lang_counts_330}")

# Other candidate files
file_candidates = [
    ("A1_A2_Multilingual_Level_Check", r"data\previous_folder_download\A1_A2_Multilingual_Level_Check.xlsx"),
    ("A2_Multilingual_Phrases (google_drive_sync)", r"data\google_drive_sync\A2_Multilingual_Phrases.xlsx"),
    ("A2_Multilingual_Phrases_FINAL (previous_folder)", r"data\previous_folder_download\A2_Multilingual_Phrases_FINAL.xlsx"),
    ("B1_Multilingual_Phrases (google_drive_sync)", r"data\google_drive_sync\B1_Multilingual_Phrases.xlsx"),
    ("B1_Multilingual_Phrases_FINAL (previous_folder)", r"data\previous_folder_download\B1_Multilingual_Phrases_FINAL.xlsx"),
    ("C1_Multilingual_Phrases (google_drive_sync)", r"data\google_drive_sync\C1_Multilingual_Phrases.xlsx"),
    ("C1_Multilingual_Phrases_FINAL (previous_folder)", r"data\previous_folder_download\C1_Multilingual_Phrases_FINAL.xlsx"),
]

xlsx_datasets = {}
for label, p in file_candidates:
    data = read_xlsx(p)
    if not data:
        print(f"\n[!] FILE NOT FOUND: {label} -> {p}")
        continue
    xlsx_datasets[label] = {
        'path': p,
        'sheets': data
    }
    print(f"\nFILE: {label} ({p})")
    for sname, rows in data.items():
        if len(rows) == 0:
            print(f"   Sheet [{sname}]: 0 rows")
            continue
        hdr = rows[0]
        data_rows = rows[1:]
        print(f"   Sheet [{sname}]: {len(data_rows)} data rows, {len(hdr)} columns")
        print(f"   Columns: {hdr}")
        # Detect language columns
        lang_cols = [c for c in hdr if c and c not in ['ID', 'Type', 'Difficulty', 'Topic', 'Level', 'Source', 'diff_sort']]
        print(f"   Detected Content / Language Columns ({len(lang_cols)}): {lang_cols}")

# Check differences between google_drive_sync and previous_folder_download for A2, B1, C1
print("\n" + "="*80)
print("COMPARISON: google_drive_sync vs previous_folder_download for A2, B1, C1")
print("="*80)
for lvl in ['A2', 'B1', 'C1']:
    gkey = f"{lvl}_Multilingual_Phrases (google_drive_sync)"
    pkey = f"{lvl}_Multilingual_Phrases_FINAL (previous_folder)"
    gdata = xlsx_datasets.get(gkey, {}).get('sheets', {})
    pdata = xlsx_datasets.get(pkey, {}).get('sheets', {})
    
    g_main = [rows for name, rows in gdata.items() if 'Instructions' not in name]
    p_main = [rows for name, rows in pdata.items() if 'Instructions' not in name]
    
    g_count = len(g_main[0]) - 1 if g_main else 0
    p_count = len(p_main[0]) - 1 if p_main else 0
    print(f"Level {lvl}: google_drive_sync has {g_count} rows vs previous_folder FINAL has {p_count} rows")

print("\n" + "="*80)
print("AUDIT COMPONENT 3 & 4: OVERLAP & ROW PROBLEMS")
print("="*80)

# Load existing app sources:
# 1. Original phrases.json from 8b36cd6
raw_orig_phrases = subprocess.check_output(['git', 'show', '8b36cd6f3fc4846f2edb9229f7cc0263ab2184da:phrases.json'], encoding='utf-8', errors='replace')
orig_phrases = json.loads(raw_orig_phrases)
print(f"Original phrases.json entries (commit 8b36cd6): {len(orig_phrases)}")

# 2. Current phrases.json in working tree
with open('phrases.json', 'r', encoding='utf-8') as f:
    current_phrases = json.load(f)
print(f"Current phrases.json entries (working tree): {len(current_phrases)}")

# Build search index for existing phrases (English, Persian, etc.)
orig_en_exact = set()
orig_en_norm = set()
orig_fa_exact = set()
orig_fa_norm = set()

for p in orig_phrases:
    txts = p.get('texts', {})
    en = txts.get('en-US') or txts.get('en') or ''
    fa = txts.get('fa') or ''
    if en:
        orig_en_exact.add(en.strip())
        orig_en_norm.add(normalize_text(en))
    if fa:
        orig_fa_exact.add(fa.strip())
        orig_fa_norm.add(normalize_text(fa))

# Overlap for 330-row dataset with original phrases.json
overlap_330_exact = 0
overlap_330_norm = 0
problems_330 = []

for idx, r in enumerate(csv_330_rows):
    en = r.get('English', '').strip()
    fa = r.get('Persian_Farsi', '').strip()
    t_en = normalize_text(en)
    
    if en in orig_en_exact:
        overlap_330_exact += 1
    if t_en in orig_en_norm:
        overlap_330_norm += 1
        
    # Check problem
    level = r.get('CEFR_Difficulty', '').strip()
    ctype = r.get('Data_Type', '').strip()
    # Check translations present
    has_any_trans = any(bool(r.get(l, '').strip()) for l in langs_330)
    if not level:
        problems_330.append((idx+1, 'missing_level', r))
    if not ctype:
        problems_330.append((idx+1, 'missing_type', r))
    if not has_any_trans:
        problems_330.append((idx+1, 'empty_translations', r))

print(f"\n330 CSV Overlap with original phrases.json:")
print(f"   Exact English match: {overlap_330_exact} / {len(csv_330_rows)}")
print(f"   Normalized English match: {overlap_330_norm} / {len(csv_330_rows)}")
print(f"   Problem rows in 330 CSV: {len(problems_330)}")

# Check each xlsx file for overlap with original phrases.json and problem rows
for label, item in xlsx_datasets.items():
    data = item['sheets']
    for sname, rows in data.items():
        if 'Instructions' in sname or len(rows) <= 1:
            continue
        hdr = rows[0]
        data_rows = rows[1:]
        
        # Determine column indexes
        id_idx = hdr.index('ID') if 'ID' in hdr else 0
        en_idx = -1
        for col_name in ['English (Base)', 'English', 'EN base', 'English British', 'English American', 'EN-US']:
            if col_name in hdr:
                en_idx = hdr.index(col_name)
                break
        
        type_idx = hdr.index('Type') if 'Type' in hdr else -1
        level_idx = hdr.index('Level') if 'Level' in hdr else -1
        topic_idx = hdr.index('Topic') if 'Topic' in hdr else -1
        
        overlap_exact = 0
        overlap_norm = 0
        problem_rows = []
        
        for r_num, row in enumerate(data_rows, start=2):
            row_id = row[id_idx] if id_idx < len(row) else ''
            en_val = row[en_idx] if en_idx != -1 and en_idx < len(row) else ''
            norm_en = normalize_text(en_val)
            
            if en_val.strip() in orig_en_exact:
                overlap_exact += 1
            if norm_en in orig_en_norm:
                overlap_norm += 1
            
            lvl_val = row[level_idx] if level_idx != -1 and level_idx < len(row) else ''
            typ_val = row[type_idx] if type_idx != -1 and type_idx < len(row) else ''
            
            # Check for problems
            issues = []
            if not en_val.strip():
                issues.append('empty_base_english')
            if not lvl_val.strip():
                issues.append('missing_level')
            if not typ_val.strip():
                issues.append('missing_type')
                
            # Check translation count
            trans_count = sum(1 for c in row if str(c).strip())
            if trans_count <= 4: # Only metadata
                issues.append('missing_all_translations')
                
            if issues:
                problem_rows.append((row_id, r_num, issues, en_val[:30]))
        
        print(f"\nAudit for {label} -> Sheet [{sname}]:")
        print(f"   Total rows: {len(data_rows)}")
        print(f"   Overlap with orig phrases.json (Exact EN): {overlap_exact} ({overlap_exact/len(data_rows)*100:.1f}%)")
        print(f"   Overlap with orig phrases.json (Norm EN): {overlap_norm} ({overlap_norm/len(data_rows)*100:.1f}%)")
        print(f"   Problem rows detected: {len(problem_rows)}")
        if problem_rows:
            print(f"   Sample problem rows (first 5): {problem_rows[:5]}")
