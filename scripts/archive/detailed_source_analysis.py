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

from audit_database import read_xlsx, normalize_text

raw_csv_330 = subprocess.check_output(['git', 'show', '8b36cd6f3fc4846f2edb9229f7cc0263ab2184da:public/downloads/dour_complete_language_dataset.csv'], encoding='utf-8', errors='replace')
csv_330_rows = list(csv.DictReader(io.StringIO(raw_csv_330)))

# Let's inspect detailed problems in 330 CSV:
print("--- 330 CSV Detailed Audit ---")
for idx, r in enumerate(csv_330_rows):
    row_num = idx + 1
    # Check level
    level = r.get('CEFR_Difficulty', '').strip()
    data_type = r.get('Data_Type', '').strip()
    en = r.get('English', '').strip()
    fa = r.get('Persian_Farsi', '').strip()
    target_text = r.get('Target_Text', '').strip()
    
    # Missing crucial info:
    if not (en or fa or target_text):
        print(f"Row {row_num} has no text anywhere!")

print("--- Checking All Sources Details ---")
sources = [
    ("A1_A2_Multilingual_Level_Check", r"data\previous_folder_download\A1_A2_Multilingual_Level_Check.xlsx"),
    ("A2_Multilingual_Phrases (google_drive_sync)", r"data\google_drive_sync\A2_Multilingual_Phrases.xlsx"),
    ("A2_Multilingual_Phrases_FINAL (previous_folder)", r"data\previous_folder_download\A2_Multilingual_Phrases_FINAL.xlsx"),
    ("B1_Multilingual_Phrases (google_drive_sync)", r"data\google_drive_sync\B1_Multilingual_Phrases.xlsx"),
    ("B1_Multilingual_Phrases_FINAL (previous_folder)", r"data\previous_folder_download\B1_Multilingual_Phrases_FINAL.xlsx"),
    ("C1_Multilingual_Phrases (google_drive_sync)", r"data\google_drive_sync\C1_Multilingual_Phrases.xlsx"),
    ("C1_Multilingual_Phrases_FINAL (previous_folder)", r"data\previous_folder_download\C1_Multilingual_Phrases_FINAL.xlsx"),
]

for label, path in sources:
    data = read_xlsx(path)
    for sname, rows in data.items():
        if 'Instructions' in sname or len(rows) <= 1:
            continue
        hdr = rows[0]
        data_rows = rows[1:]
        
        types_set = set()
        levels_set = set()
        empty_rows = 0
        missing_lvl = 0
        missing_type = 0
        missing_fa = 0
        missing_en = 0
        
        type_idx = hdr.index('Type') if 'Type' in hdr else -1
        level_idx = hdr.index('Level') if 'Level' in hdr else -1
        
        # find english and persian indices
        en_idx = -1
        for cand in ['English (Base)', 'EN base', 'English', 'American English', 'EN-US']:
            if cand in hdr:
                en_idx = hdr.index(cand)
                break
        fa_idx = -1
        for cand in ['Persian (فارسی)', 'Persian', 'FA']:
            if cand in hdr:
                fa_idx = hdr.index(cand)
                break
        
        for r_idx, r in enumerate(data_rows, start=2):
            t_val = r[type_idx].strip() if type_idx != -1 and type_idx < len(r) else ''
            l_val = r[level_idx].strip() if level_idx != -1 and level_idx < len(r) else ''
            e_val = r[en_idx].strip() if en_idx != -1 and en_idx < len(r) else ''
            f_val = r[fa_idx].strip() if fa_idx != -1 and fa_idx < len(r) else ''
            
            if t_val: types_set.add(t_val)
            else: missing_type += 1
            if l_val: levels_set.add(l_val)
            else: missing_lvl += 1
            if not e_val: missing_en += 1
            if not f_val: missing_fa += 1
            if not any(c.strip() for c in r): empty_rows += 1
            
        print(f"\n{label} -> [{sname}]:")
        print(f"  Rows: {len(data_rows)}, Types found: {types_set}")
        print(f"  Levels found: {levels_set}")
        print(f"  Missing Level: {missing_lvl}, Missing Type: {missing_type}, Missing EN: {missing_en}, Missing FA: {missing_fa}")
