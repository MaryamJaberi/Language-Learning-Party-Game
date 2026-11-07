# scripts/download_key_previous_files.py
import os
import subprocess
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

with open('data/previous_folder_files.json', 'r', encoding='utf-8') as f:
    files = json.load(f)

download_dir = os.path.join('data', 'previous_folder_download')
os.makedirs(download_dir, exist_ok=True)

candidates = [
    'Dour_DB_Optimized.csv',
    'Dour_Language_DB_Light.csv',
    'Collocations_Extracted.xlsx',
    'A1_A2_Multilingual_Level_Check.xlsx',
    'C2_Multilingual_Phrases_FINAL.xlsx',
    'C1_Multilingual_Phrases_FINAL.xlsx',
    'B2_Multilingual_Phrases_FINAL.xlsx',
    'B1_Multilingual_Phrases_FINAL.xlsx',
    'A2_Multilingual_Phrases_FINAL.xlsx',
    'A1_Multilingual_Phrases_FINAL.xlsx'
]

file_map = {item['name']: item['id'] for item in files}

for c in candidates:
    if c in file_map:
        fid = file_map[c]
        target = os.path.join(download_dir, c)
        if not os.path.exists(target):
            print(f'Downloading {c} ({fid})...')
            subprocess.run(f'gdrive readonly download {fid} -o "{target}"', shell=True)
            if os.path.exists(target):
                print(f'  OK: {os.path.getsize(target):,} bytes')
        else:
            print(f'Already exists: {c} ({os.path.getsize(target):,} bytes)')
