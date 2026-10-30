# scripts/fetch_all_folder_files.py
import subprocess
import json
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

folder_id = "18SC15GQByVrShchd76btsBHU_is7amOK"
# Using gdrive readonly search with parent query
cmd = ['gdrive', 'readonly', 'search', f"'{folder_id}' in parents and trashed = false", '--json']
res = subprocess.run(cmd, capture_output=True, text=True, shell=True)

if res.returncode == 0:
    items = json.loads(res.stdout)
    print(f"Total items found: {len(items)}")
    out_path = os.path.join("data", "previous_folder_files.json")
    os.makedirs("data", exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f"Saved to {out_path}")
    
    # Print table of files
    for item in items:
        name = item.get('name', '')
        size = item.get('size', '0')
        mtype = item.get('mimeType', '')
        fid = item.get('id', '')
        print(f"{fid} | {mtype[:35]:35} | {size:>10} | {name}")
else:
    print("Error:", res.stderr)
