# scripts/save_folder_files_json.py
import subprocess
import json
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

folder_id = "18SC15GQByVrShchd76btsBHU_is7amOK"
cmd = f"gdrive readonly search --parent-id {folder_id} --max 200 --json"
res = subprocess.run(cmd, capture_output=True, text=True, shell=True)

if res.returncode == 0:
    items = json.loads(res.stdout)
    print(f"Total items found: {len(items)}")
    os.makedirs("data", exist_ok=True)
    out_path = os.path.join("data", "previous_folder_files.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f"Saved to {out_path}")
    
    # Categorize items
    spreadsheets = []
    csvs = []
    docs = []
    zips = []
    pdfs = []
    others = []
    
    for it in items:
        name = it.get('name', '')
        mtype = it.get('mimeType', '')
        fid = it.get('id', '')
        size = it.get('size', '0')
        entry = {'id': fid, 'name': name, 'size': size, 'mimeType': mtype}
        
        if 'spreadsheet' in mtype or name.endswith('.xlsx') or name.endswith('.xls'):
            spreadsheets.append(entry)
        elif name.endswith('.csv') or 'csv' in mtype:
            csvs.append(entry)
        elif 'document' in mtype or name.endswith('.docx') or name.endswith('.doc'):
            docs.append(entry)
        elif name.endswith('.zip') or 'zip' in mtype:
            zips.append(entry)
        elif name.endswith('.pdf') or 'pdf' in mtype:
            pdfs.append(entry)
        else:
            others.append(entry)
            
    print(f"\nSpreadsheets ({len(spreadsheets)}):")
    for s in spreadsheets:
        print(f"  {s['id']} | {int(s['size'] or 0):>10,} bytes | {s['name']}")
        
    print(f"\nCSVs ({len(csvs)}):")
    for c in csvs:
        print(f"  {c['id']} | {int(c['size'] or 0):>10,} bytes | {c['name']}")
        
    print(f"\nZips ({len(zips)}):")
    for z in zips:
        print(f"  {z['id']} | {int(z['size'] or 0):>10,} bytes | {z['name']}")
        
    print(f"\nDocs ({len(docs)}):")
    for d in docs:
        print(f"  {d['id']} | {int(d['size'] or 0):>10,} bytes | {d['name']}")
else:
    print("Error:", res.stderr)
