import os
import re
import zipfile
import xml.etree.ElementTree as ET

def read_xlsx(path):
    if not os.path.exists(path):
        return None
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
                if k.endswith('id'):
                    r_id = v
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

def normalize_text(text):
    if not text:
        return ''
    t = str(text).lower().strip()
    t = re.sub(r'[^\w\s]', '', t, flags=re.UNICODE)
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def normalize_unicode(s):
    if not s:
        return ''
    text = str(s).strip()
    text = text.replace('\u064A', '\u06CC') # Arabic Yeh to Persian Yeh
    text = text.replace('\u0643', '\u06A9') # Arabic Kaf to Persian Keheh
    text = re.sub(r'[ \t\r\f\v]+', ' ', text)
    return text.strip()
