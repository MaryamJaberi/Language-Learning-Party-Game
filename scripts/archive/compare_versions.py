import os
import sys
import json
import csv
import re

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from audit_database import read_xlsx, normalize_text

def compare_level(lvl, path_sync, path_final, sheet_sync, sheet_final):
    d_sync = read_xlsx(path_sync)
    d_final = read_xlsx(path_final)
    
    rows_sync = d_sync[sheet_sync]
    rows_final = d_final[sheet_final]
    
    hdr_s = rows_sync[0]
    hdr_f = rows_final[0]
    
    # en col
    en_s_idx = hdr_s.index('English (Base)') if 'English (Base)' in hdr_s else hdr_s.index('EN base')
    en_f_idx = hdr_f.index('English (Base)') if 'English (Base)' in hdr_f else hdr_f.index('EN base')
    
    sync_concepts = {normalize_text(r[en_s_idx]): r for r in rows_sync[1:] if len(r) > en_s_idx and r[en_s_idx].strip()}
    final_concepts = {normalize_text(r[en_f_idx]): r for r in rows_final[1:] if len(r) > en_f_idx and r[en_f_idx].strip()}
    
    shared = set(sync_concepts.keys()) & set(final_concepts.keys())
    only_sync = set(sync_concepts.keys()) - set(final_concepts.keys())
    only_final = set(final_concepts.keys()) - set(sync_concepts.keys())
    
    print(f"\n--- Level {lvl} Version Comparison ---")
    print(f"Sync file ({path_sync}): {len(sync_concepts)} valid concepts")
    print(f"Final file ({path_final}): {len(final_concepts)} valid concepts")
    print(f"Shared concepts: {len(shared)}")
    print(f"Concepts only in Sync: {len(only_sync)}")
    print(f"Concepts only in Final: {len(only_final)}")
    
    # Check conflicting Persian / Dutch translations on shared concepts
    fa_s_idx = -1
    for c in ['Persian', 'Persian (فارسی)', 'FA']:
        if c in hdr_s: fa_s_idx = hdr_s.index(c); break
    fa_f_idx = -1
    for c in ['Persian', 'Persian (فارسی)', 'FA']:
        if c in hdr_f: fa_f_idx = hdr_f.index(c); break
        
    conflicts = 0
    sample_conflicts = []
    for k in shared:
        r_s = sync_concepts[k]
        r_f = final_concepts[k]
        fa_s = r_s[fa_s_idx].strip() if fa_s_idx != -1 and fa_s_idx < len(r_s) else ''
        fa_f = r_f[fa_f_idx].strip() if fa_f_idx != -1 and fa_f_idx < len(r_f) else ''
        if fa_s and fa_f and fa_s != fa_f:
            conflicts += 1
            if len(sample_conflicts) < 3:
                sample_conflicts.append((k, 'Persian', fa_s, fa_f))
    print(f"Conflicting translations detected on shared concepts: {conflicts}")
    if sample_conflicts:
        print(f"Sample conflicts: {sample_conflicts}")

compare_level('A2', r'data\google_drive_sync\A2_Multilingual_Phrases.xlsx', r'data\previous_folder_download\A2_Multilingual_Phrases_FINAL.xlsx', 'A2_Items', 'A2_Items')
compare_level('B1', r'data\google_drive_sync\B1_Multilingual_Phrases.xlsx', r'data\previous_folder_download\B1_Multilingual_Phrases_FINAL.xlsx', 'B1_Items', 'B1_Items')
compare_level('C1', r'data\google_drive_sync\C1_Multilingual_Phrases.xlsx', r'data\previous_folder_download\C1_Multilingual_Phrases_FINAL.xlsx', 'C1_Items', 'C1_Items')
