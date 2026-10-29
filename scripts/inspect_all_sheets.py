import os
import sys
import zipfile
import xml.etree.ElementTree as ET

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sync_dir = os.path.join(os.getcwd(), 'data', 'google_drive_sync')
files = sorted([f for f in os.listdir(sync_dir) if f.endswith('.xlsx')])

def get_row_data(cell, shared_strings):
    t = cell.get('t')
    if t == 'inlineStr':
        is_elem = cell.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}is')
        if is_elem is not None:
            return ''.join([t_node.text or '' for t_node in is_elem.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')])
    v = cell.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
    val = v.text if v is not None else ''
    if t == 's' and val.isdigit():
        idx = int(val)
        val = shared_strings[idx] if idx < len(shared_strings) else val
    return val

total_items = 0
for f in files:
    path = os.path.join(sync_dir, f)
    with zipfile.ZipFile(path, 'r') as z:
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                text = ''.join([t.text or '' for t in si.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')])
                shared_strings.append(text)
        
        # Find the data sheet (usually sheet2 or the one not named Instructions)
        wb = ET.fromstring(z.read('xl/workbook.xml'))
        data_sheet_id = 'rId2'
        sheet_name = 'sheet2'
        for s in wb.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet'):
            name = s.get('name', '')
            if 'Instructions' not in name:
                sheet_name = name
                # get r:id
                for k, v in s.attrib.items():
                    if k.endswith('id'):
                        data_sheet_id = v
        
        # resolve target xml from workbook.xml.rels
        rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        target_xml = 'worksheets/sheet2.xml'
        for r in rels.iter('{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'):
            if r.get('Id') == data_sheet_id:
                target_xml = r.get('Target', '')
        
        sheet_path = 'xl/' + target_xml.lstrip('/')
        if sheet_path not in z.namelist():
            sheet_path = 'xl/worksheets/sheet2.xml'
        
        sheet_xml = ET.fromstring(z.read(sheet_path))
        rows = []
        for r in sheet_xml.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
            row_vals = [get_row_data(c, shared_strings) for c in r.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c')]
            rows.append(row_vals)
        
        items_count = max(0, len(rows) - 1)
        total_items += items_count
        print(f"File: {f:<30} Sheet: {sheet_name:<15} Rows: {items_count}")

print("=" * 60)
print(f"TOTAL MULTILINGUAL DATABASE ITEMS: {total_items}")
