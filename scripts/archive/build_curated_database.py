import os
import sys
import zipfile
import xml.etree.ElementTree as ET
import csv
import json
import re

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.append('scripts')
from xlsx_utils import read_xlsx, normalize_text, normalize_unicode

def make_concept_id(base_en):
    norm = normalize_text(base_en)
    slug = re.sub(r'[^a-z0-9]+', '_', norm).strip('_')
    return f"c_{slug[:60]}" if slug else "c_empty"

def compute_pacing(text, level):
    clean = (text or '').strip()
    if not clean:
        return {'units': 0, 'readSec': 0.0, 'lengthClass': 'short'}
    words = clean.split()
    units = len(words)
    
    wpm_map = {
        'A0': 100, 'A0+': 110, 'A1': 120, 'A1+': 130, 'A2': 140, 'A2+': 150,
        'A2-B1': 155, 'B1': 165, 'B1+': 175, 'B2': 190, 'B2+': 200, 'C1': 220,
        'C1+': 230, 'C2': 250
    }
    wpm = wpm_map.get(level, 150)
    read_sec = max(0.5, round((units / (wpm / 60)) * 10) / 10)
    
    if read_sec > 6.0 or units >= 10:
        length_class = 'long'
    elif read_sec > 3.0 or units >= 5:
        length_class = 'medium'
    else:
        length_class = 'short'
        
    return {'units': units, 'readSec': read_sec, 'lengthClass': length_class}

def run_importer():
    print("Running Curated Database Importer Pipeline...")

    raw_sources = [
        # (source_name, path, is_final)
        ("dour_complete_language_dataset.csv", r"data\sources\dour_complete_language_dataset.csv", True),
        ("A0_Multilingual_Phrases.xlsx", r"data\google_drive_sync\A0_Multilingual_Phrases.xlsx", True),
        ("A0+_Multilingual_Phrases.xlsx", r"data\google_drive_sync\A0+_Multilingual_Phrases.xlsx", True),
        ("A1_A2_Multilingual_Level_Check.xlsx", r"data\previous_folder_download\A1_A2_Multilingual_Level_Check.xlsx", True),
        ("A1_Multilingual_Phrases.xlsx", r"data\google_drive_sync\A1_Multilingual_Phrases.xlsx", False),
        ("A1+_Multilingual_Phrases.xlsx", r"data\google_drive_sync\A1+_Multilingual_Phrases.xlsx", True),
        ("A1_Multilingual_Phrases_FINAL.xlsx", r"data\previous_folder_download\A1_Multilingual_Phrases_FINAL.xlsx", True),
        ("A2_Multilingual_Phrases.xlsx", r"data\google_drive_sync\A2_Multilingual_Phrases.xlsx", False),
        ("A2+_Multilingual_Phrases.xlsx", r"data\google_drive_sync\A2+_Multilingual_Phrases.xlsx", True),
        ("A2_Multilingual_Phrases_FINAL.xlsx", r"data\previous_folder_download\A2_Multilingual_Phrases_FINAL.xlsx", True),
        ("B1_Multilingual_Phrases.xlsx", r"data\google_drive_sync\B1_Multilingual_Phrases.xlsx", False),
        ("B1+_Multilingual_Phrases.xlsx", r"data\google_drive_sync\B1+_Multilingual_Phrases.xlsx", True),
        ("B1_Multilingual_Phrases_FINAL.xlsx", r"data\previous_folder_download\B1_Multilingual_Phrases_FINAL.xlsx", True),
        ("B2_Multilingual_Phrases.xlsx", r"data\google_drive_sync\B2_Multilingual_Phrases.xlsx", False),
        ("B2+_Multilingual_Phrases.xlsx", r"data\google_drive_sync\B2+_Multilingual_Phrases.xlsx", True),
        ("B2_Multilingual_Phrases_FINAL.xlsx", r"data\previous_folder_download\B2_Multilingual_Phrases_FINAL.xlsx", True),
        ("C1_Multilingual_Phrases.xlsx", r"data\google_drive_sync\C1_Multilingual_Phrases.xlsx", False),
        ("C1+_Multilingual_Phrases.xlsx", r"data\google_drive_sync\C1+_Multilingual_Phrases.xlsx", True),
        ("C1_Multilingual_Phrases_FINAL.xlsx", r"data\previous_folder_download\C1_Multilingual_Phrases_FINAL.xlsx", True),
        ("C2_Multilingual_Phrases.xlsx", r"data\google_drive_sync\C2_Multilingual_Phrases.xlsx", False),
        ("C2_Multilingual_Phrases_FINAL.xlsx", r"data\previous_folder_download\C2_Multilingual_Phrases_FINAL.xlsx", True),
        ("Collocations_Extracted.xlsx", r"data\previous_folder_download\Collocations_Extracted.xlsx", True)
    ]

    LANG_KEYS = [
        ('en', ['English (Base)', 'EN base', 'English', 'en']),
        ('en-GB', ['British English', 'English British', 'EN-GB']),
        ('en-US', ['American English', 'English American', 'EN-US']),
        ('ar', ['Arabic (عربي)', 'Arabic', 'AR']),
        ('fa', ['Persian (فارسی)', 'Persian', 'FA', 'Persian_Farsi']),
        ('nl', ['Dutch (Nederlands)', 'Dutch', 'NL', 'Dutch_Nederlands']),
        ('de', ['German (Deutsch)', 'German', 'DE', 'German_Deutsch']),
        ('fr', ['French (Français)', 'French', 'FR', 'French_Francais']),
        ('es', ['Spanish (Español)', 'Spanish', 'ES', 'Spanish_Espanol']),
        ('it', ['Italian (Italiano)', 'Italian', 'IT', 'Italian_Italiano']),
        ('tr', ['Turkish (Türkçe)', 'Turkish', 'TR']),
        ('pl', ['Polish (Polski)', 'Polish', 'PL']),
        ('uk', ['Ukrainian (Українська)', 'Ukrainian', 'UK']),
        ('zh', ['Chinese (中文)', 'Chinese', 'ZH']),
        ('ja', ['Japanese (日本語)', 'Japanese', 'JA']),
        ('ko', ['Korean (한국어)', 'Korean', 'KO']),
        ('hi', ['Hindi (हिन्दी)', 'Hindi', 'HI']),
        ('pt', ['Portuguese (Português)', 'Portuguese', 'PT']),
    ]

    c2_shift_fixes = []
    parsed_records = []
    skipped_rows = []

    for s_name, path, is_final in raw_sources:
        if not os.path.exists(path):
            print(f"File not found: {path}")
            continue
        
        if path.endswith('.csv'):
            with open(path, 'r', encoding='utf-8', errors='replace') as f:
                reader = list(csv.DictReader(f))
                for r_idx, row in enumerate(reader, start=1):
                    base_en = row.get('English', '').strip()
                    if not base_en:
                        base_en = row.get('Target_Text', '').strip()
                    if not base_en:
                        skipped_rows.append({'source': s_name, 'row': r_idx, 'reason': 'empty_english_base', 'data': row})
                        continue
                    
                    raw_level = row.get('CEFR_Difficulty', '').strip()
                    diff_map = {'easy': 'A1', 'medium': 'A2', 'hard': 'B1'}
                    level = diff_map.get(raw_level.lower(), raw_level.upper())
                    if level not in ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']:
                        level = 'A1'
                        
                    cid = make_concept_id(base_en)
                    translations = {}
                    csv_trans_map = {
                        'en': row.get('English'),
                        'fa': row.get('Persian_Farsi'),
                        'nl': row.get('Dutch_Nederlands'),
                        'de': row.get('German_Deutsch'),
                        'fr': row.get('French_Francais'),
                        'es': row.get('Spanish_Espanol'),
                        'it': row.get('Italian_Italiano'),
                        'ar': row.get('Arabic'),
                        'tr': row.get('Turkish'),
                        'pl': row.get('Polish'),
                        'uk': row.get('Ukrainian')
                    }
                    for lk, val in csv_trans_map.items():
                        if val and val.strip():
                            translations[lk] = {'text': normalize_unicode(val)}
                            
                    parsed_records.append({
                        'id': f"csv_{row.get('Row_ID', r_idx)}",
                        'conceptId': cid,
                        'source': s_name,
                        'is_final': is_final,
                        'base_en': base_en,
                        'level': level,
                        'rawLevel': raw_level,
                        'topic': row.get('Category_Topic', ''),
                        'type': row.get('Data_Type', 'phrase').lower().replace('curated card (', '').replace(')', '').replace(' ', '_'),
                        'translations': translations,
                        'prompt': row.get('Prompt_Scenario', ''),
                        'hint': row.get('Hint_Grammar_Note', '')
                    })
            continue

        # Process Excel file
        data = read_xlsx(path)
        for sname, rows in data.items():
            if 'Instructions' in sname or len(rows) <= 1:
                continue
            hdr = rows[0]
            data_rows = rows[1:]
            
            # Collocations file has special columns
            if s_name == 'Collocations_Extracted.xlsx':
                for r_idx, r in enumerate(data_rows, start=2):
                    colloc = r[1].strip() if len(r) > 1 else ''
                    example = r[2].strip() if len(r) > 2 else ''
                    fa_text = r[3].strip() if len(r) > 3 else ''
                    cat = r[4].strip() if len(r) > 4 else ''
                    if not colloc:
                        skipped_rows.append({'source': s_name, 'row': r_idx, 'reason': 'empty_collocation'})
                        continue
                    cid = make_concept_id(colloc)
                    trans = {
                        'en': {'text': normalize_unicode(example or colloc)},
                        'fa': {'text': normalize_unicode(fa_text)}
                    }
                    parsed_records.append({
                        'id': f"col_{r[0]}",
                        'conceptId': cid,
                        'source': s_name,
                        'is_final': True,
                        'base_en': colloc,
                        'level': None, # explicitly unset per user decision #5
                        'rawLevel': 'Collocation',
                        'topic': cat or 'Collocation',
                        'type': 'idiom',
                        'translations': trans,
                        'is_collocation_excluded': True
                    })
                continue
                
            # Standard multilingual sheets
            id_idx = hdr.index('ID') if 'ID' in hdr else 0
            en_idx = -1
            for c in ['English (Base)', 'EN base', 'English']:
                if c in hdr: en_idx = hdr.index(c); break
            if en_idx == -1: en_idx = 1
            
            type_idx = hdr.index('Type') if 'Type' in hdr else -1
            level_idx = hdr.index('Level') if 'Level' in hdr else -1
            topic_idx = hdr.index('Topic') if 'Topic' in hdr else -1
            
            # Build lang index map
            lang_idx_map = {}
            for lk, aliases in LANG_KEYS:
                for al in aliases:
                    if al in hdr:
                        lang_idx_map[lk] = hdr.index(al)
                        break
                        
            for r_idx, r in enumerate(data_rows, start=2):
                row_id = r[id_idx].strip() if id_idx < len(r) else f"row_{r_idx}"
                base_en = r[en_idx].strip() if en_idx < len(r) else ''
                raw_lvl = r[level_idx].strip() if level_idx != -1 and level_idx < len(r) else ''
                
                # Check C2 shifted row condition!
                if s_name == 'C2_Multilingual_Phrases.xlsx' and raw_lvl != 'C2':
                    c2_shift_fixes.append({
                        'row_id': row_id,
                        'row_index': r_idx,
                        'before_level_col': raw_lvl,
                        'sentence_en': base_en,
                        'fixed_level': 'C2',
                        'arabic_text_recovered': r[7].strip() if len(r) > 7 else '',
                        'persian_text_recovered': r[8].strip() if len(r) > 8 else ''
                    })
                    trans = {'en': {'text': normalize_unicode(base_en)}}
                    ar_col = 7
                    fa_col = 8
                    if ar_col < len(r) and r[ar_col].strip():
                        trans['ar'] = {'text': normalize_unicode(r[ar_col])}
                    if fa_col < len(r) and r[fa_col].strip():
                        trans['fa'] = {'text': normalize_unicode(r[fa_col])}
                    langs_order = ['zh', 'ja', 'ko', 'fr', 'hi', 'nl', 'de', 'uk', 'tr', 'pl', 'pt', 'es', 'it']
                    for offset, lk in enumerate(langs_order, start=9):
                        if offset < len(r) and r[offset].strip():
                            trans[lk] = {'text': normalize_unicode(r[offset])}
                            
                    cid = make_concept_id(base_en)
                    parsed_records.append({
                        'id': f"c2_sync_{row_id}",
                        'conceptId': cid,
                        'source': s_name,
                        'is_final': is_final,
                        'base_en': base_en,
                        'level': 'C2',
                        'rawLevel': 'C2',
                        'topic': r[topic_idx].strip() if topic_idx != -1 and topic_idx < len(r) else 'C2 Advanced',
                        'type': 'sentence',
                        'translations': trans
                    })
                    continue
                    
                if not base_en:
                    skipped_rows.append({'source': s_name, 'row': r_idx, 'reason': 'empty_english_base'})
                    continue
                    
                cid = make_concept_id(base_en)
                
                # Determine level
                level = raw_lvl.strip()
                if level in ['A0', 'A0+']:
                    base_level = 'A1'
                elif level.endswith('+'):
                    base_level = level[:-1]
                elif level == 'A2-B1':
                    base_level = 'A2'
                elif level in ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']:
                    base_level = level
                else:
                    base_level = 'A1'
                    
                card_type = r[type_idx].strip().lower() if type_idx != -1 and type_idx < len(r) else 'phrase'
                if card_type in ['question', 'sentence', 'vocabulary', 'phrase', 'situation', 'idiom']:
                    ctype = card_type
                elif 'question' in card_type:
                    ctype = 'question'
                elif 'vocab' in card_type:
                    ctype = 'vocabulary'
                elif 'idiom' in card_type:
                    ctype = 'idiom'
                else:
                    ctype = 'phrase'
                    
                trans = {}
                for lk, c_idx in lang_idx_map.items():
                    if c_idx < len(r) and r[c_idx].strip():
                        trans[lk] = {'text': normalize_unicode(r[c_idx])}
                        
                if not trans:
                    skipped_rows.append({'source': s_name, 'row': r_idx, 'reason': 'no_translations_found'})
                    continue
                    
                parsed_records.append({
                    'id': f"{s_name.split('.')[0].lower()}_{row_id}",
                    'conceptId': cid,
                    'source': s_name,
                    'is_final': is_final,
                    'base_en': base_en,
                    'level': base_level,
                    'rawLevel': raw_lvl or base_level,
                    'topic': r[topic_idx].strip() if topic_idx != -1 and topic_idx < len(r) else '',
                    'type': ctype,
                    'translations': trans
                })

    # Group by conceptId
    concepts_map = {}
    conflicts_list = []

    INTERMEDIATE_LEVELS = {'A0', 'A0+', 'A1+', 'A2+', 'B1+', 'B2+', 'C1+'}

    for rec in parsed_records:
        cid = rec['conceptId']
        if cid not in concepts_map:
            concepts_map[cid] = [rec]
        else:
            concepts_map[cid].append(rec)

    merged_cards = []

    for cid, candidates in concepts_map.items():
        if len(candidates) == 1:
            chosen = dict(candidates[0])
            base_text = chosen['translations'].get('en', {}).get('text') or chosen['base_en']
            chosen['measured'] = compute_pacing(base_text, chosen['level'] or 'A1')
            merged_cards.append(chosen)
            continue
            
        special_candidate = None
        for cand in candidates:
            if cand.get('rawLevel') in INTERMEDIATE_LEVELS:
                special_candidate = cand
                break
                
        candidates.sort(
            key=lambda c: (
                1 if c.get('rawLevel') in INTERMEDIATE_LEVELS else 0,
                len(c['translations']),
                c['is_final']
            ),
            reverse=True
        )
        
        winner = dict(candidates[0])
        winner['translations'] = dict(winner['translations'])
        
        if special_candidate:
            winner['rawLevel'] = special_candidate['rawLevel']
            winner['level'] = special_candidate['level']
            
        for other in candidates[1:]:
            for lk, o_val in other['translations'].items():
                if lk not in winner['translations']:
                    winner['translations'][lk] = o_val
                else:
                    w_text = winner['translations'][lk]['text']
                    o_text = o_val['text']
                    if w_text != o_text:
                        chosen_text = w_text
                        if other['is_final'] and not winner['is_final']:
                            chosen_text = o_text
                            winner['translations'][lk] = o_val
                            
                        conflicts_list.append({
                            'conceptId': cid,
                            'lang': lk,
                            'version_A': f"{winner['source']}: {w_text}",
                            'version_B': f"{other['source']}: {o_text}",
                            'chosen': chosen_text
                        })
                        
        base_text = winner['translations'].get('en', {}).get('text') or winner['base_en']
        winner['measured'] = compute_pacing(base_text, winner['level'] or 'A1')
        merged_cards.append(winner)

    os.makedirs('data/reports', exist_ok=True)

    with open('data/curatedDatabase.json', 'w', encoding='utf-8') as f:
        json.dump(merged_cards, f, ensure_ascii=False, indent=2)

    with open('data/reports/conflicts.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['conceptId', 'lang', 'version_A', 'version_B', 'chosen'])
        writer.writeheader()
        for conf in conflicts_list:
            writer.writerow(conf)

    with open('data/reports/skipped_rows.json', 'w', encoding='utf-8') as f:
        json.dump(skipped_rows, f, ensure_ascii=False, indent=2)

    with open('data/reports/c2_shift_fixes.json', 'w', encoding='utf-8') as f:
        json.dump(c2_shift_fixes, f, ensure_ascii=False, indent=2)

    level_counts = {}
    lang_counts = {}
    for c in merged_cards:
        lvl = c.get('rawLevel') or c.get('level') or 'Unset'
        level_counts[lvl] = level_counts.get(lvl, 0) + 1
        for lk in c.get('translations', {}).keys():
            lang_counts[lk] = lang_counts.get(lk, 0) + 1

    print("\n=== Curated Database Final Importer Results ===")
    print("Total Merged Cards:", len(merged_cards))
    print("Cards per Level (rawLevel):", dict(sorted(level_counts.items())))
    print("Cards per Language:", dict(sorted(lang_counts.items())))
    print("Conflicts logged:", len(conflicts_list))
    print("Skipped rows:", len(skipped_rows))
    print("C2 shifted rows fixed:", len(c2_shift_fixes))

if __name__ == '__main__':
    run_importer()
