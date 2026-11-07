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

raw_orig_phrases = subprocess.check_output(['git', 'show', '8b36cd6f3fc4846f2edb9229f7cc0263ab2184da:phrases.json'], encoding='utf-8', errors='replace')
orig_phrases = json.loads(raw_orig_phrases)

langs = ['en', 'fa', 'nl', 'de', 'fr', 'es', 'it', 'ar', 'tr', 'pl', 'uk']
orig_index = {l: {'exact': set(), 'norm': set()} for l in langs}

for p in orig_phrases:
    txts = p.get('texts', {})
    for l in langs:
        val = txts.get(l) or (txts.get('en-US') if l == 'en' else '') or ''
        if val:
            orig_index[l]['exact'].add(val.strip())
            orig_index[l]['norm'].add(normalize_text(val))

raw_csv_330 = subprocess.check_output(['git', 'show', '8b36cd6f3fc4846f2edb9229f7cc0263ab2184da:public/downloads/dour_complete_language_dataset.csv'], encoding='utf-8', errors='replace')
csv_330_rows = list(csv.DictReader(io.StringIO(raw_csv_330)))

csv_map = {
    'en': 'English',
    'fa': 'Persian_Farsi',
    'nl': 'Dutch_Nederlands',
    'de': 'German_Deutsch',
    'fr': 'French_Francais',
    'es': 'Spanish_Espanol',
    'it': 'Italian_Italiano',
    'ar': 'Arabic',
    'tr': 'Turkish',
    'pl': 'Polish',
    'uk': 'Ukrainian'
}

print("330 CSV Overlap by Language:")
for l in langs:
    col = csv_map[l]
    total_with_lang = sum(1 for r in csv_330_rows if r.get(col, '').strip())
    exact_matches = sum(1 for r in csv_330_rows if r.get(col, '').strip() in orig_index[l]['exact'])
    norm_matches = sum(1 for r in csv_330_rows if normalize_text(r.get(col, '')) in orig_index[l]['norm'])
    print(f"  {l:<4} (col: {col:<16}): total={total_with_lang:<4} exact={exact_matches:<4} norm={norm_matches:<4}")

# For A1_A2_Multilingual_Level_Check
a1_a2_path = r"data\previous_folder_download\A1_A2_Multilingual_Level_Check.xlsx"
a1_a2_data = read_xlsx(a1_a2_path)

header = a1_a2_data['A1_Items'][0]
data_rows = a1_a2_data['A1_Items'][1:]

lang_col_map = {
    'en': 'English (Base)',
    'fa': 'Persian (فارسی)',
    'ar': 'Arabic (عربي)',
    'fr': 'French (Français)',
    'nl': 'Dutch (Nederlands)',
    'de': 'German (Deutsch)',
    'uk': 'Ukrainian (Українська)',
    'tr': 'Turkish (Türkçe)',
    'pl': 'Polish (Polski)',
    'es': 'Spanish (Español)',
    'it': 'Italian (Italiano)'
}

print("\nA1_A2_Multilingual_Level_Check [A1_Items] Overlap by Language:")
for l in langs:
    col_name = lang_col_map[l]
    col_idx = header.index(col_name)
    total_with_lang = sum(1 for r in data_rows if r[col_idx].strip())
    exact_matches = sum(1 for r in data_rows if r[col_idx].strip() in orig_index[l]['exact'])
    norm_matches = sum(1 for r in data_rows if normalize_text(r[col_idx]) in orig_index[l]['norm'])
    print(f"  {l:<4}: total={total_with_lang:<4} exact={exact_matches:<4} ({exact_matches/total_with_lang*100:.1f}%) norm={norm_matches:<4} ({norm_matches/total_with_lang*100:.1f}%)")
