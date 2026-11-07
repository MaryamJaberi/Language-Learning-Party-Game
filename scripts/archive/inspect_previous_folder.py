# scripts/inspect_previous_folder.py
import subprocess
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

folder_id = "18SC15GQByVrShchd76btsBHU_is7amOK"
cmd = f"gdrive readonly tree {folder_id} --json"
res = subprocess.run(cmd, capture_output=True, text=True, shell=True)

if res.returncode == 0:
    data = json.loads(res.stdout)
    print(f"Total entries from tree: {len(data)}")
    with open("data/previous_folder_tree.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    # summarize file types
    types = {}
    for item in data:
        m = item.get('mimeType', 'unknown')
        types[m] = types.get(m, 0) + 1
    print("MIME types distribution:")
    for m, count in sorted(types.items(), key=lambda x: -x[1]):
        print(f"  {m}: {count}")
else:
    print("Tree failed, trying search...")
    query = f"'{folder_id}' in parents and trashed = false"
    cmd2 = f"gdrive readonly search \"{query}\" --json"
    res2 = subprocess.run(cmd2, capture_output=True, text=True, shell=True)
    if res2.returncode == 0:
        data = json.loads(res2.stdout)
        print(f"Total entries from search: {len(data)}")
        with open("data/previous_folder_tree.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    else:
        print("Error:", res2.stderr)
