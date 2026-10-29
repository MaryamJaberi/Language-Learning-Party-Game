import os
import subprocess
import sys

FILES = [
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

out_dir = os.path.join(os.getcwd(), "data", "google_drive_sync")
os.makedirs(out_dir, exist_ok=True)
gdrive_cmd = r"C:\Users\mjabe\.gemini\config\plugins\gdrive\skills\gdrive\scripts\gdrive.cmd"

for file_id, name in FILES:
    target = os.path.join(out_dir, name)
    print(f"Downloading {name} ({file_id})...")
    cmd = [gdrive_cmd, "readonly", "download", file_id, "-o", target]
    res = subprocess.run(cmd, capture_output=True, text=True, shell=True)
    if res.returncode == 0:
        size = os.path.getsize(target) if os.path.exists(target) else 0
        print(f"  -> SUCCESS: {name} ({size} bytes)")
    else:
        print(f"  -> ERROR downloading {name}: {res.stderr or res.stdout}")

print("Done downloading all Google Drive database files.")
