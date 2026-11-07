import os
import sys
import zipfile
import xml.etree.ElementTree as ET
import csv
import json
import re
import datetime

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def read_xlsx(path):
    if not os.path.exists(path):
        return None
    try:
        with zipfile.ZipFile(path, 'r') as z:
            shared_strings = []
            if 'xl/sharedStrings.xml' in z.namelist():
                tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
                for si in tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                    text = ''.join([t.text or '' for t in si.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')])
                    shared_strings.append(text)
            
            wb = ET.fromstring(z.read('xl/workbook.xml'))
            sheets = []
            for s in wb.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet'):
                name = s.get('name', '')
                r_id = None
                for k, v in s.attrib.items():
                    if k.endswith('id'): r_id = v
                sheets.append((name, r_id))
            
            rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
            rel_map = {}
            for r in rels.iter('{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'):
                rel_map[r.get('Id')] = r.get('Target', '')
            
            results = {}
            for sheet_name, r_id in sheets:
                target = rel_map.get(r_id, '').lstrip('/')
                if not target.startswith('xl/'):
                    target = 'xl/' + target
                if target not in z.namelist():
                    continue
                sheet_xml = ET.fromstring(z.read(target))
                rows = []
                for r in sheet_xml.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
                    row_vals = []
                    for c in r.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                        t = c.get('t')
                        if t == 'inlineStr':
                            is_elem = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}is')
                            val = ''.join([t_node.text or '' for t_node in is_elem.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')]) if is_elem is not None else ''
                        else:
                            v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                            val = v.text if v is not None else ''
                            if t == 's' and val.isdigit():
                                idx = int(val)
                                val = shared_strings[idx] if idx < len(shared_strings) else val
                        row_vals.append(val)
                    rows.append(row_vals)
                results[sheet_name] = rows
            return results
    except Exception as e:
        print(f"Error reading {path}: {e}")
        return None

def read_csv_info(path):
    if not os.path.exists(path):
        return None
    try:
        with open(path, 'r', encoding='utf-8', errors='replace') as f:
            reader = list(csv.reader(f))
            if not reader:
                return {'headers': [], 'row_count': 0, 'rows': []}
            return {'headers': reader[0], 'row_count': len(reader) - 1, 'rows': reader[1:]}
    except Exception as e:
        print(f"Error reading csv {path}: {e}")
        return None

# Target files to audit
folders = [
    r'data\google_drive_sync',
    r'data\previous_folder_download',
    r'public\downloads'
]

file_audit_results = []

for folder in folders:
    if not os.path.exists(folder):
        continue
    for fname in sorted(os.listdir(folder)):
        fpath = os.path.join(folder, fname)
        if os.path.isdir(fpath):
            continue
        stat = os.stat(fpath)
        mtime = datetime.datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S')
        size_bytes = stat.st_size
        
        info = {
            'filename': fname,
            'path': fpath,
            'size': size_bytes,
            'mtime': mtime,
            'format': os.path.splitext(fname)[1].lower()
        }
        
        if info['format'] == '.xlsx':
            data = read_xlsx(fpath)
            sheets_info = {}
            if data:
                for sname, rows in data.items():
                    if not rows:
                        continue
                    hdr = rows[0]
                    rows_data = rows[1:]
                    # count levels & languages
                    levels = set()
                    lvl_idx = -1
                    for lcand in ['Level', 'CEFR', 'CEFR_Difficulty', 'difficulty']:
                        if lcand in hdr:
                            lvl_idx = hdr.index(lcand)
                            break
                    if lvl_idx != -1:
                        for r in rows_data:
                            if lvl_idx < len(r) and r[lvl_idx].strip():
                                levels.add(r[lvl_idx].strip())
                    
                    sheets_info[sname] = {
                        'row_count': len(rows_data),
                        'columns': hdr,
                        'levels': sorted(list(levels))
                    }
            info['sheets'] = sheets_info
            
        elif info['format'] == '.csv':
            cinfo = read_csv_info(fpath)
            if cinfo:
                hdr = cinfo['headers']
                rows_data = cinfo['rows']
                levels = set()
                lvl_idx = -1
                for lcand in ['Level', 'CEFR', 'CEFR_Difficulty', 'difficulty']:
                    if lcand in hdr:
                        lvl_idx = hdr.index(lcand)
                        break
                if lvl_idx != -1:
                    for r in rows_data:
                        if lvl_idx < len(r) and r[lvl_idx].strip():
                            levels.add(r[lvl_idx].strip())
                info['csv'] = {
                    'row_count': cinfo['row_count'],
                    'columns': hdr,
                    'levels': sorted(list(levels))
                }
        elif info['format'] == '.zip':
            try:
                with zipfile.ZipFile(fpath, 'r') as z:
                    info['zip_contents'] = z.namelist()
            except Exception as e:
                info['zip_contents'] = [str(e)]
                
        file_audit_results.append(info)

print(f"Total audited files: {len(file_audit_results)}")

with open('scripts/audit_output.json', 'w', encoding='utf-8') as out:
    json.dump(file_audit_results, out, indent=2, ensure_ascii=False)

print("Saved audit results to scripts/audit_output.json")
