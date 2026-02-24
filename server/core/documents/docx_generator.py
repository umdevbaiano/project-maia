"""
Maia Platform — DOCX Generator
Converts markdown text to formatted .docx documents with legal formatting.
"""
import io
import re
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH


def markdown_to_docx(markdown_text: str, titulo: str = "Documento Jurídico") -> io.BytesIO:
    """
    Convert markdown text to a formatted .docx document.
    Returns a BytesIO buffer ready for download.
    """
    doc = Document()

    # Page margins (legal standard: 3cm top/left, 2cm bottom/right)
    for section in doc.sections:
        section.top_margin = Cm(3)
        section.bottom_margin = Cm(2)
        section.left_margin = Cm(3)
        section.right_margin = Cm(2)

    # Default font
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Times New Roman'
    font.size = Pt(12)
    font.color.rgb = RGBColor(0, 0, 0)
    style.paragraph_format.line_spacing = 1.5
    style.paragraph_format.space_after = Pt(6)

    # Process markdown line by line
    lines = markdown_text.split('\n')
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()

        # Skip empty lines
        if not line:
            i += 1
            continue

        # Headers
        if line.startswith('# '):
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = p.add_run(line[2:].strip())
            run.bold = True
            run.font.size = Pt(14)
            run.font.name = 'Times New Roman'
            i += 1
            continue

        if line.startswith('## '):
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            run = p.add_run(line[3:].strip())
            run.bold = True
            run.font.size = Pt(13)
            run.font.name = 'Times New Roman'
            run.font.all_caps = True
            i += 1
            continue

        if line.startswith('### '):
            p = doc.add_paragraph()
            run = p.add_run(line[4:].strip())
            run.bold = True
            run.font.size = Pt(12)
            run.font.name = 'Times New Roman'
            i += 1
            continue

        # Horizontal rule
        if line.strip() in ('---', '***', '___'):
            doc.add_paragraph('_' * 60)
            i += 1
            continue

        # Blockquote
        if line.startswith('> '):
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Cm(2)
            run = p.add_run(line[2:].strip())
            run.italic = True
            run.font.name = 'Times New Roman'
            run.font.size = Pt(11)
            i += 1
            continue

        # Numbered list
        if re.match(r'^\d+\.\s', line):
            text = re.sub(r'^\d+\.\s', '', line).strip()
            p = doc.add_paragraph(style='List Number')
            _add_formatted_run(p, text)
            i += 1
            continue

        # Bullet list
        if line.startswith('- ') or line.startswith('* '):
            text = line[2:].strip()
            p = doc.add_paragraph(style='List Bullet')
            _add_formatted_run(p, text)
            i += 1
            continue

        # Table (markdown table)
        if '|' in line and i + 1 < len(lines) and '---' in lines[i + 1]:
            rows = []
            while i < len(lines) and '|' in lines[i]:
                cells = [c.strip() for c in lines[i].strip('|').split('|')]
                if not all(c.replace('-', '').replace(':', '') == '' for c in cells):
                    rows.append(cells)
                i += 1
            if rows:
                _add_table(doc, rows)
            continue

        # Regular paragraph (with bold/italic formatting)
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        _add_formatted_run(p, line)
        i += 1

    # Save to buffer
    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer


def _add_formatted_run(paragraph, text: str):
    """Parse inline markdown formatting (bold, italic) and add runs."""
    # Split by bold (**text**) and italic (*text*)
    parts = re.split(r'(\*\*[^*]+\*\*|\*[^*]+\*)', text)
    for part in parts:
        if part.startswith('**') and part.endswith('**'):
            run = paragraph.add_run(part[2:-2])
            run.bold = True
            run.font.name = 'Times New Roman'
        elif part.startswith('*') and part.endswith('*'):
            run = paragraph.add_run(part[1:-1])
            run.italic = True
            run.font.name = 'Times New Roman'
        else:
            run = paragraph.add_run(part)
            run.font.name = 'Times New Roman'


def _add_table(doc, rows: list):
    """Add a formatted table to the document."""
    if not rows:
        return
    num_cols = len(rows[0])
    table = doc.add_table(rows=len(rows), cols=num_cols)
    table.style = 'Table Grid'

    for i, row_data in enumerate(rows):
        for j, cell_text in enumerate(row_data):
            if j < num_cols:
                cell = table.rows[i].cells[j]
                cell.text = cell_text.strip()
                # Bold header row
                if i == 0:
                    for p in cell.paragraphs:
                        for run in p.runs:
                            run.bold = True
                            run.font.name = 'Times New Roman'
                            run.font.size = Pt(10)
                else:
                    for p in cell.paragraphs:
                        for run in p.runs:
                            run.font.name = 'Times New Roman'
                            run.font.size = Pt(10)
