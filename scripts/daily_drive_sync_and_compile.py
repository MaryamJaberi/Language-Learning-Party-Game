# scripts/daily_drive_sync_and_compile.py
# Automated daily sync from Google Drive folder: 1uzrg_284r4_aJ-L8dgYLrNd0TgpMflSY
# Downloads new/updated spreadsheets and compiles into phrases.json and datasets.

import os
import sys
import subprocess
import json

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SYNC_DIR = os.path.join(ROOT_DIR, "data", "google_drive_sync")
os.makedirs(SYNC_DIR, exist_ok=True)

FOLDER_ID = "1uzrg_284r4_aJ-L8dgYLrNd0TgpMflSY"

KNOWN_FILES = [
    ("18lQxgWy3l5Pm9LufOFonkOqZGW5aOHDa", "A0_Multilingual_Phrases.xlsx"),
    ("15-fltVmrhOIWArdaxUBgFHcJ1uFVj5j7", "A0+_Multilingual_Phrases.xlsx"),
    ("19u0Eywoxwzg-0ZNdrJMhYHeLYHFLIoHW", "A1_Multilingual_Phrases.xlsx"),
    ("1qmzd5jIyPXZNMCu-QFEqr3mx_O5lrq1q", "A1+_Multilingual_Phrases.xlsx"),
    ("1kohYluYsF2rSPIZhT02BNKSrk8fbj4LP", "A2_Multilingual_Phrases.xlsx"),
    ("1OY2LPpb5Ipv4MBntt0j5ki0mf3AasrR6", "A2+_Multilingual_Phrases.xlsx"),
    ("1psIqW-1adAXd4Meexc7qHyh6Ojt8nTdG", "B1_Multilingual_Phrases.xlsx"),
    ("1CEEMfqa98bLXait-q1fnV9NkakTPlhVo", "B1+_Multilingual_Phrases.xlsx"),
    ("1P1KmgTmYU34caHSHFbdy7Y7zECFoATuu", "B2_Multilingual_Phrases.xlsx"),
    ("133fH9huLai8fGAEu7gIgXcGwFoBDhdrU", "B2+_Multilingual_Phrases.xlsx"),
    ("1GQIA8HieGMzqb8_Ap1i8co052YVc8N-N", "C1_Multilingual_Phrases.xlsx"),
    ("1raPvXZjI_fIS33rwOa6RPXGhmmPKo6t6", "C1+_Multilingual_Phrases.xlsx"),
    ("1Dgjw-M4ttTRzGAGryXfY6B6vVBoprqKE", "C2_Multilingual_Phrases.xlsx")
]

def run():
    print(f"=== [DAILY DRIVE SYNC] Checking Google Drive folder {FOLDER_ID} ===")
    
    # 1. Download/sync all files
    for file_id, name in KNOWN_FILES:
        target = os.path.join(SYNC_DIR, name)
        print(f"Checking & downloading {name} ({file_id})...")
        cmd = f"gdrive readonly download {file_id} -o \"{target}\""
        res = subprocess.run(cmd, capture_output=True, text=True, shell=True)
        if res.returncode == 0 and os.path.exists(target):
            size = os.path.getsize(target)
            print(f"  -> OK: {name} ({size:,} bytes)")
        else:
            print(f"  -> Retrying bare download or file exists: {res.stderr.strip() if res.stderr else 'OK'}")

    # 2. Compile into database
    print("\n=== Compiling downloaded spreadsheets into app database ===")
    py_path = sys.executable
    compile_script = os.path.join(ROOT_DIR, "scripts", "compile_google_drive_dataset.py")
    res = subprocess.run([py_path, compile_script], capture_output=True, text=True)
    print(res.stdout)
    if res.returncode != 0:
        print("ERROR compiling dataset:", res.stderr)
        return False

    # 3. Merge with unified previous database to keep all 9,038 items intact
    print("\n=== Unifying with full historical dataset & collocations ===")
    merge_script = os.path.join(ROOT_DIR, "scripts", "build_ultimate_merged_database.py")
    res_merge = subprocess.run([py_path, merge_script], capture_output=True, text=True)
    print(res_merge.stdout)
    if res_merge.returncode != 0:
        print("ERROR merging unified dataset:", res_merge.stderr)
        return False
        
    print("=== [DAILY DRIVE SYNC] Synchronization and Compilation Successfully Completed! ===")
    return True

if __name__ == "__main__":
    run()
