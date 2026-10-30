# scripts/build_ultimate_merged_database.py
# Merges the newest Google Drive dataset (6,478 items) with all unique items
# from the previous database folder (Dour_DB_Optimized, Master_Learning_Items, Collocations_Extracted, etc.)
# Deduplicates by normalized base text, preserves rich 17+ languages, topics, CEFR levels, and collocations.

import os
import sys
import json
import csv
import zipfile
import re

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHRASES_JSON = os.path.join(ROOT_DIR, 'phrases.json')
OUT_JSON = os.path.join(ROOT_DIR, 'public', 'downloads', 'dour_complete_language_dataset.json')
OUT_CSV = os.path.join(ROOT_DIR, 'public', 'downloads', 'dour_complete_language_dataset.csv')

def norm(s):
    if not s:
        return ''
    s = str(s).lower().strip()
    s = re.sub(r'[^\w\s]', '', s)
    return ' '.join(s.split())

def map_topic(raw_topic):
    t = (raw_topic or '').lower()
    if any(k in t for k in ['greet', 'social', 'meet', 'polite', 'conversa', 'intro', 'feeling', 'people']):
        return 'CAT_SOCIAL'
    if any(k in t for k in ['food', 'restaur', 'drink', 'cafe', 'eat', 'order', 'menu', 'meal']):
        return 'CAT_FOOD'
    if any(k in t for k in ['travel', 'hotel', 'flight', 'airport', 'direct', 'taxi', 'train', 'vacat', 'tour', 'transp']):
        return 'CAT_TRAVEL'
    if any(k in t for k in ['shop', 'store', 'market', 'price', 'buy', 'cloth', 'pay', 'money', 'cost']):
        return 'CAT_SHOPPING'
    if any(k in t for k in ['work', 'job', 'office', 'career', 'busi', 'meet', 'profess', 'email']):
        return 'CAT_WORK'
    if any(k in t for k in ['health', 'medic', 'doctor', 'emerg', 'hospit', 'pharm', 'body', 'sick']):
        return 'CAT_EMERGENCY'
    if any(k in t for k in ['cultur', 'idiom', 'slang', 'express', 'humor', 'art', 'music', 'movie', 'collocat']):
        return 'CAT_CULTURE'
    if any(k in t for k in ['home', 'hous', 'family', 'daily', 'routine', 'time', 'weather', 'nature', 'animal']):
        return 'CAT_EVERYDAY'
    return 'CAT_EVERYDAY'

def clean_level(raw_level):
    l = (raw_level or 'A1').strip().upper()
    l = l.replace('PLUS', '+')
    valid = ['A0', 'A0+', 'A1', 'A1+', 'A2', 'A2+', 'B1', 'B1+', 'B2', 'B2+', 'C1', 'C1+', 'C2']
    if l in valid:
        return l
    if l == 'A2-B1':
        return 'B1'
    if l.startswith('A0'):
        return 'A0'
    if l.startswith('A1'):
        return 'A1'
    if l.startswith('A2'):
        return 'A2'
    if l.startswith('B1'):
        return 'B1'
    if l.startswith('B2'):
        return 'B2'
    if l.startswith('C1'):
        return 'C1'
    if l.startswith('C2'):
        return 'C2'
    return 'A1'

LANG_COL_MAP = {
    'EN': 'en',
    'EN-GB': 'en',
    'EN-US': 'en-US',
    'NL': 'nl',
    'DE': 'de',
    'FA': 'fa',
    'FR': 'fr',
    'ES': 'es',
    'IT': 'it',
    'AR': 'ar',
    'TR': 'tr',
    'PL': 'pl',
    'UK': 'uk',
    'PT': 'pt',
    'ZH': 'zh',
    'JA': 'ja',
    'KO': 'ko',
    'HI': 'hi'
}

def main():
    print("=== BUILDING ULTIMATE MERGED MULTILINGUAL DATABASE ===")
    
    # 1. Load current primary phrases.json
    with open(PHRASES_JSON, 'r', encoding='utf-8') as f:
        existing_items = json.load(f)
    print(f"Loaded {len(existing_items):,} existing primary items from phrases.json")

    merged_items = []
    seen_norm_en = set()
    
    # Add existing items first (they have high-quality curated 17 languages from the latest spreadsheets)
    for it in existing_items:
        en_text = it.get('texts', {}).get('en') or it.get('texts', {}).get('en-US') or ''
        key = norm(en_text)
        if key:
            seen_norm_en.add(key)
        merged_items.append(it)

    print(f"Tracking {len(seen_norm_en):,} unique base texts from existing dataset.")

    # 2. Ingest previous Dour_DB_Optimized.csv (contains 7,997 rows, many C1 & A1 rich entries)
    prev_csv_path = os.path.join(ROOT_DIR, 'data', 'previous_folder_download', 'Dour_DB_Optimized.csv')
    added_from_prev_csv = 0
    if os.path.exists(prev_csv_path):
        with open(prev_csv_path, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.reader(f)
            header = [h.strip().lstrip('\ufeff') for h in next(reader)]
            col_idx = {h: idx for idx, h in enumerate(header)}
            
            for row_idx, row in enumerate(reader, start=1):
                if not row or not any(row):
                    continue
                
                en_val = row[col_idx.get('EN', 0)] if 'EN' in col_idx and col_idx['EN'] < len(row) else ''
                if not en_val:
                    continue
                
                key = norm(en_val)
                if key in seen_norm_en:
                    continue
                
                # New item to incorporate!
                seen_norm_en.add(key)
                added_from_prev_csv += 1
                
                en_us = row[col_idx['EN-US']] if 'EN-US' in col_idx and col_idx['EN-US'] < len(row) and row[col_idx['EN-US']] else en_val
                en_gb = row[col_idx['EN-GB']] if 'EN-GB' in col_idx and col_idx['EN-GB'] < len(row) and row[col_idx['EN-GB']] else en_val
                raw_level = row[col_idx['Level']] if 'Level' in col_idx and col_idx['Level'] < len(row) else 'A1'
                level = clean_level(raw_level)
                item_type = row[col_idx['Type']] if 'Type' in col_idx and col_idx['Type'] < len(row) and row[col_idx['Type']] else 'Phrase'
                difficulty = (row[col_idx['Difficulty']] if 'Difficulty' in col_idx and col_idx['Difficulty'] < len(row) and row[col_idx['Difficulty']] else 'easy').lower()
                if difficulty not in ['easy', 'medium', 'hard']:
                    difficulty = 'easy'
                raw_topic = row[col_idx['Topic']] if 'Topic' in col_idx and col_idx['Topic'] < len(row) and row[col_idx['Topic']] else 'General'
                topic = map_topic(raw_topic)
                
                texts = {
                    'en': en_gb,
                    'en-US': en_us
                }
                for col_name, lang_code in LANG_COL_MAP.items():
                    if col_name in ['EN', 'EN-GB', 'EN-US']:
                        continue
                    if col_name in col_idx and col_idx[col_name] < len(row):
                        val = row[col_idx[col_name]].strip()
                        if val:
                            texts[lang_code] = val
                            
                item_id = f"ARCHIVE_{level}_{added_from_prev_csv}"
                merged_items.append({
                    'id': item_id,
                    'level': level,
                    'rawLevel': raw_level,
                    'type': item_type,
                    'difficulty': difficulty,
                    'topic': topic,
                    'rawTopic': raw_topic,
                    'texts': texts
                })

        print(f"Added {added_from_prev_csv:,} unique historical items from Dour_DB_Optimized.csv")

    # 3. Ingest Collocations_Extracted.xlsx (48 specialized native English-Persian collocations)
    colloc_path = os.path.join(ROOT_DIR, 'data', 'previous_folder_download', 'Collocations_Extracted.xlsx')
    added_collocs = 0
    if os.path.exists(colloc_path):
        import xml.etree.ElementTree as ET
        with zipfile.ZipFile(colloc_path, 'r') as z:
            shared = []
            if 'xl/sharedStrings.xml' in z.namelist():
                tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
                for si in tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                    shared.append(''.join([t.text or '' for t in si.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')]))
            
            sheet = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
            c_rows = []
            for r in sheet.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
                rv = []
                for c in r.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                    t = c.get('t')
                    v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                    val = v.text if v is not None else ''
                    if t == 's' and val.isdigit():
                        val = shared[int(val)] if int(val) < len(shared) else val
                    elif t == 'inlineStr':
                        is_el = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}is')
                        if is_el is not None:
                            val = ''.join([tn.text or '' for tn in is_el.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')])
                    rv.append(val)
                c_rows.append(rv)

            for cr in c_rows[1:]:
                if len(cr) >= 4:
                    colloc_en = cr[1].strip()
                    colloc_fa = cr[3].strip()
                    example = cr[2].strip() if len(cr) > 2 else ''
                    category = cr[4].strip() if len(cr) > 4 else 'Collocation'
                    
                    key = norm(colloc_en)
                    if key and key not in seen_norm_en:
                        seen_norm_en.add(key)
                        added_collocs += 1
                        merged_items.append({
                            'id': f"COLLOC_{added_collocs}",
                            'level': 'B2',
                            'rawLevel': 'B2',
                            'type': 'Collocation',
                            'difficulty': 'medium',
                            'topic': 'CAT_CULTURE',
                            'rawTopic': f'Collocation: {category}',
                            'texts': {
                                'en': colloc_en,
                                'en-US': colloc_en,
                                'fa': colloc_fa
                            },
                            'example': example
                        })
        print(f"Added {added_collocs} rich collocations from Collocations_Extracted.xlsx")

    # 4. Save merged database
    print(f"\nTOTAL MERGED ITEMS IN COMPLETE DATABASE: {len(merged_items):,}")
    
    # Sort and stats
    level_counts = {}
    for it in merged_items:
        lvl = it['level']
        level_counts[lvl] = level_counts.get(lvl, 0) + 1
        
    print("Database breakdown by level:")
    for lvl in ['A0', 'A0+', 'A1', 'A1+', 'A2', 'A2+', 'B1', 'B1+', 'B2', 'B2+', 'C1', 'C1+', 'C2']:
        print(f"  - {lvl:5}: {level_counts.get(lvl, 0):,} items")

    with open(PHRASES_JSON, 'w', encoding='utf-8') as f:
        json.dump(merged_items, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(merged_items):,} items to {PHRASES_JSON}")

    with open(OUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(merged_items, f, ensure_ascii=False, indent=2)
    print(f"Saved public JSON dataset to {OUT_JSON}")

    # Export CSV
    all_langs = ['en', 'en-US', 'nl', 'de', 'fa', 'fr', 'es', 'it', 'ar', 'tr', 'pl', 'uk', 'pt', 'zh', 'ja', 'ko', 'hi']
    csv_headers = ['ID', 'Level', 'RawLevel', 'Type', 'Difficulty', 'Topic', 'RawTopic'] + [l.upper() for l in all_langs]

    with open(OUT_CSV, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(csv_headers)
        for it in merged_items:
            row = [
                it['id'],
                it['level'],
                it.get('rawLevel', ''),
                it.get('type', 'Phrase'),
                it.get('difficulty', 'easy'),
                it.get('topic', 'CAT_EVERYDAY'),
                it.get('rawTopic', '')
            ]
            texts = it.get('texts', {})
            for l in all_langs:
                row.append(texts.get(l, ''))
            writer.writerow(row)
    print(f"Saved public CSV dataset to {OUT_CSV}")

    print("\n>>> COMPLETE MULTILINGUAL DATABASE UNIFICATION FINISHED! <<<")

if __name__ == '__main__':
    main()
