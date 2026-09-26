import zipfile
import xml.etree.ElementTree as ET
import os

def parse_xlsx_to_markdown(xlsx_path, output_md_path):
    with zipfile.ZipFile(xlsx_path) as z:
        strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for elem in tree.iter():
                if elem.tag.endswith('}t'):
                    strings.append(elem.text or '')

        wb_tree = ET.fromstring(z.read('xl/workbook.xml'))
        sheets = []
        for s in wb_tree.iter():
            if s.tag.endswith('}sheet'):
                sheets.append(s.attrib.get('name'))

        md_output = ["# INDICADORES INDEC — ESTADÍSTICAS OFICIALES\n## Base de Datos Extraída para el Asistente ITEC\n"]
        md_output.append(f"- **Fuente**: Instituto Nacional de Estadística y Censos (INDEC) - Archivo Oficial `Principales_indicadores_INDEC.xlsx`.")
        md_output.append(f"- **Áreas cubiertas**: Cuentas Nacionales, Comercio, Sectores Productivos, Precios y Canastas (IPC, CBA, CBT), Empleo, Condiciones de Vida, Sector Externo, Turismo y Servicios.\n")

        sheet_idx = 1
        for name in sheets:
            sheet_file = f'xl/worksheets/sheet{sheet_idx}.xml'
            sheet_idx += 1
            if sheet_file not in z.namelist():
                continue

            stree = ET.fromstring(z.read(sheet_file))
            rows = []
            for row in stree.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
                cells = []
                for c in row.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                    t = c.attrib.get('t')
                    v_elem = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                    val = v_elem.text if v_elem is not None else ''
                    if t == 's' and val.isdigit():
                        s_idx = int(val)
                        val = strings[s_idx] if s_idx < len(strings) else val
                    val = str(val).strip().replace('\n', ' ')
                    cells.append(val)
                # Solo filas con al menos una celda con contenido
                if any(cells):
                    rows.append(cells)

            if not rows:
                continue

            md_output.append(f"### SECCIÓN: {name.upper()}\n")
            # Presentar tabla o lista
            for r in rows:
                non_empty = [c for c in r if c]
                if non_empty:
                    md_output.append("- " + " | ".join(non_empty))
            md_output.append("\n")

        with open(output_md_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(md_output))
        print(f"Generado exitosamente: {output_md_path} ({len(md_output)} bloques)")

if __name__ == '__main__':
    parse_xlsx_to_markdown('docs/Principales_indicadores_INDEC.xlsx', 'docs/principales_indicadores_indec.md')
