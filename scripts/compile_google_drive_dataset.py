# scripts/compile_google_drive_dataset.py
# Compiles all 13 Google Drive CEFR spreadsheets (A0 to C2) into phrases.json and dataset files

import os
import sys
import json
import csv
import zipfile
import xml.etree.ElementTree as ET

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sync_dir = os.path.join(os.getcwd(), 'data', 'google_drive_sync')

FILE_LEVEL_MAP = [
    ("A0_Multilingual_Phrases.xlsx", "A0"),
    ("A0+_Multilingual_Phrases.xlsx", "A0+"),
    ("A1_Multilingual_Phrases.xlsx", "A1"),
    ("A1+_Multilingual_Phrases.xlsx", "A1+"),
    ("A2_Multilingual_Phrases.xlsx", "A2"),
    ("A2+_Multilingual_Phrases.xlsx", "A2+"),
    ("B1_Multilingual_Phrases.xlsx", "B1"),
    ("B1+_Multilingual_Phrases.xlsx", "B1+"),
    ("B2_Multilingual_Phrases.xlsx", "B2"),
    ("B2+_Multilingual_Phrases.xlsx", "B2+"),
    ("C1_Multilingual_Phrases.xlsx", "C1"),
    ("C1+_Multilingual_Phrases.xlsx", "C1+"),
    ("C2_Multilingual_Phrases.xlsx", "C2")
]

LANG_COL_MAP = {
    'Arabic': 'ar',
    'Persian': 'fa',
    'Chinese': 'zh',
    'Japanese': 'ja',
    'Korean': 'ko',
    'French': 'fr',
    'Hindi': 'hi',
    'Dutch': 'nl',
    'German': 'de',
    'Ukrainian': 'uk',
    'Turkish': 'tr',
    'Polish': 'pl',
    'Portuguese': 'pt',
    'Spanish': 'es',
    'Italian': 'it'
}

def map_topic(raw_topic):
    t = (raw_topic or '').lower()
    if any(k in t for k in ['greet', 'social', 'meet', 'polite', 'conversa', 'intro']):
        return 'CAT_SOCIAL'
    if any(k in t for k in ['food', 'restaur', 'drink', 'cafe', 'eat', 'order', 'menu']):
        return 'CAT_FOOD'
    if any(k in t for k in ['travel', 'hotel', 'flight', 'airport', 'direct', 'taxi', 'train', 'vacat', 'tour']):
        return 'CAT_TRAVEL'
    if any(k in t for k in ['shop', 'store', 'market', 'price', 'buy', 'cloth', 'pay']):
        return 'CAT_SHOPPING'
    if any(k in t for k in ['work', 'job', 'office', 'career', 'busi', 'meet', 'profess', 'email']):
        return 'CAT_WORK'
    if any(k in t for k in ['health', 'medic', 'doctor', 'emerg', 'hospit', 'pharm', 'body']):
        return 'CAT_EMERGENCY'
    if any(k in t for k in ['cultur', 'idiom', 'slang', 'express', 'humor', 'art', 'music', 'movie']):
        return 'CAT_CULTURE'
    if any(k in t for k in ['home', 'hous', 'family', 'daily', 'routine', 'time', 'weather']):
        return 'CAT_EVERYDAY'
    return 'CAT_EVERYDAY'

def get_row_data(cell, shared_strings):
    t = cell.get('t')
    if t == 'inlineStr':
        is_elem = cell.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}is')
        if is_elem is not None:
            return ''.join([t_node.text or '' for t_node in is_elem.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')]).strip()
    v = cell.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
    val = v.text if v is not None else ''
    if t == 's' and val.isdigit():
        idx = int(val)
        val = shared_strings[idx] if idx < len(shared_strings) else val
    return (val or '').strip()

def parse_file(filename, default_level):
    path = os.path.join(sync_dir, filename)
    if not os.path.exists(path):
        print(f"Warning: {filename} does not exist in {sync_dir}")
        return []
    
    with zipfile.ZipFile(path, 'r') as z:
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                text = ''.join([t.text or '' for t in si.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')])
                shared_strings.append(text)

        wb = ET.fromstring(z.read('xl/workbook.xml'))
        data_sheet_id = None
        for s in wb.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet'):
            name = s.get('name', '')
            if 'Instructions' not in name:
                # Get the relationship ID (e.g. {http://...}id or r:id)
                for k, v in s.attrib.items():
                    if k.endswith('}id') or k == 'r:id':
                        data_sheet_id = v
                        break

        rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        target_xml = None
        for r in rels.iter('{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'):
            if r.get('Id') == data_sheet_id:
                target_xml = r.get('Target', '')
                break

        if target_xml:
            # normalize target
            t = target_xml.lstrip('/')
            if not t.startswith('xl/'):
                t = 'xl/' + t.replace('worksheets/', 'worksheets/') if not t.startswith('worksheets/') else 'xl/' + t
            sheet_path = t
        else:
            sheet_path = 'xl/worksheets/sheet1.xml'

        if sheet_path not in z.namelist():
            for candidate in ['xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml']:
                if candidate in z.namelist():
                    sheet_path = candidate
                    break

        sheet_xml = ET.fromstring(z.read(sheet_path))
        rows = []
        for r in sheet_xml.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
            row_vals = [get_row_data(c, shared_strings) for c in r.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c')]
            rows.append(row_vals)

        if not rows:
            return []

        header = [h.strip() for h in rows[0]]
        # Find column indices
        col_idx = {}
        for idx, h in enumerate(header):
            col_idx[h] = idx

        items = []
        prefix = default_level.replace('+', 'Plus')
        
        for row_num, row in enumerate(rows[1:], start=1):
            if not row or not any(row):
                continue
            
            def get_col(*names):
                for name in names:
                    if name in col_idx and col_idx[name] < len(row):
                        val = row[col_idx[name]]
                        if val:
                            return val
                return ''

            eng_base = get_col('English (Base)', 'English')
            if not eng_base:
                continue
            
            eng_uk = get_col('English British', 'British English') or eng_base
            eng_us = get_col('English American', 'American English') or eng_base
            item_type = get_col('Type') or 'Phrase'
            difficulty = (get_col('Difficulty') or 'easy').lower()
            if difficulty not in ['easy', 'medium', 'hard']:
                difficulty = 'easy'
            raw_topic = get_col('Topic') or 'General'
            topic = map_topic(raw_topic)
            level = get_col('Level') or default_level

            texts = {
                'en': eng_uk,
                'en-US': eng_us
            }

            for lang_header, lang_code in LANG_COL_MAP.items():
                val = get_col(lang_header)
                if val:
                    texts[lang_code] = val

            item_id = f"{prefix}_{row_num}"
            items.append({
                'id': item_id,
                'level': level,
                'rawLevel': default_level,
                'type': item_type,
                'difficulty': difficulty,
                'topic': topic,
                'rawTopic': raw_topic,
                'texts': texts
            })
            
        print(f"  Parsed {len(items):<5} items from {filename} ({default_level})")
        return items

def main():
    print("=== Compiling Google Drive Datasets into App Database ===")
    all_items = []
    level_counts = {}

    for filename, level in FILE_LEVEL_MAP:
        items = parse_file(filename, level)
        all_items.extend(items)
        level_counts[level] = len(items)

    print(f"\nTotal Compiled Items: {len(all_items)}")
    for lvl, cnt in level_counts.items():
        print(f"  - {lvl:<4}: {cnt} items")

    # 1. Write phrases.json
    out_phrases = os.path.join(os.getcwd(), 'phrases.json')
    with open(out_phrases, 'w', encoding='utf-8') as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)
    print(f"\nWritten {len(all_items)} items to {out_phrases}")

    # 2. Write public/downloads/dour_complete_language_dataset.json
    out_public_json = os.path.join(os.getcwd(), 'public', 'downloads', 'dour_complete_language_dataset.json')
    with open(out_public_json, 'w', encoding='utf-8') as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)
    print(f"Written dataset to {out_public_json}")

    # 3. Write public/downloads/dour_complete_language_dataset.csv
    out_csv = os.path.join(os.getcwd(), 'public', 'downloads', 'dour_complete_language_dataset.csv')
    with open(out_csv, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['id', 'level', 'rawLevel', 'type', 'difficulty', 'topic', 'en', 'en-US', 'fa', 'ar', 'nl', 'de', 'fr', 'es', 'it', 'tr', 'ru', 'zh', 'ja', 'ko', 'hi', 'pt', 'pl', 'uk'])
        for it in all_items:
            tx = it['texts']
            writer.writerow([
                it['id'], it['level'], it['rawLevel'], it['type'], it['difficulty'], it['topic'],
                tx.get('en', ''), tx.get('en-US', ''), tx.get('fa', ''), tx.get('ar', ''),
                tx.get('nl', ''), tx.get('de', ''), tx.get('fr', ''), tx.get('es', ''),
                tx.get('it', ''), tx.get('tr', ''), tx.get('ru', ''), tx.get('zh', ''),
                tx.get('ja', ''), tx.get('ko', ''), tx.get('hi', ''), tx.get('pt', ''),
                tx.get('pl', ''), tx.get('uk', '')
            ])
    print(f"Written CSV dataset to {out_csv}")

    print("\n>>> DATABASE COMPILATION COMPLETE! <<<")

if __name__ == '__main__':
    main()
