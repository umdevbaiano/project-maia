"""
Maia Platform — PDF Generator (ABNT NBR 14724)
Converts markdown text to a formatted PDF using WeasyPrint (HTML → PDF).
No dependency on Microsoft Office or LibreOffice.
"""
import io
import re
from datetime import datetime, timezone

_WEASYPRINT_AVAILABLE = True
try:
    import weasyprint
except (ImportError, OSError):
    _WEASYPRINT_AVAILABLE = False


# ── ABNT-compliant CSS ─────────────────────────────────────────────────────────
_ABNT_CSS = """
@page {
    size: A4;
    margin: 3cm 2cm 2cm 3cm;

    @top-center {
        content: string(doc-title);
        font-family: 'Times New Roman', Times, serif;
        font-size: 9pt;
        color: #646464;
        font-style: italic;
    }
    @bottom-left {
        content: string(workspace-name);
        font-family: 'Times New Roman', Times, serif;
        font-size: 9pt;
        color: #646464;
    }
    @bottom-right {
        content: "Página " counter(page) " de " counter(pages);
        font-family: 'Times New Roman', Times, serif;
        font-size: 9pt;
        color: #646464;
    }
}

* {
    box-sizing: border-box;
}

body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    color: #000000;
    line-height: 1.5;
    text-align: justify;
    hyphens: auto;
}

/* Title string definitions for header/footer */
#doc-title-hidden { string-set: doc-title content(); }
#workspace-name-hidden { string-set: workspace-name content(); }

h1, h2, h3, h4 {
    font-family: 'Times New Roman', Times, serif;
    color: #000000;
    page-break-after: avoid;
}

h1 {
    font-size: 14pt;
    font-weight: bold;
    text-align: center;
    text-transform: uppercase;
    margin: 12pt 0 6pt;
}

h2 {
    font-size: 13pt;
    font-weight: bold;
    text-transform: uppercase;
    margin: 12pt 0 4pt;
    text-align: left;
}

h3 {
    font-size: 12pt;
    font-weight: bold;
    margin: 6pt 0 2pt;
}

p {
    text-indent: 1.25cm;
    margin: 0 0 6pt 0;
    text-align: justify;
}

/* Legal citations / blockquotes */
blockquote {
    margin: 6pt 0 6pt 4cm;
    font-size: 11pt;
    font-style: italic;
    text-align: justify;
    text-indent: 0;
}

blockquote p {
    text-indent: 0;
}

/* Lists — no first-line indent */
ul, ol {
    margin: 4pt 0 4pt 1.25cm;
    padding: 0;
}

li {
    margin: 2pt 0;
    text-align: left;
    text-indent: 0;
}

/* Tables */
table {
    width: 100%;
    border-collapse: collapse;
    margin: 6pt 0;
    font-size: 10pt;
    page-break-inside: avoid;
}

th {
    background: #e8e8e8;
    font-weight: bold;
    text-align: left;
    padding: 4pt 6pt;
    border: 1pt solid #999;
}

td {
    padding: 4pt 6pt;
    border: 1pt solid #999;
    text-align: left;
}

/* Horizontal rule */
hr {
    border: none;
    border-top: 1pt solid #ccc;
    margin: 8pt 0;
}

/* Code / monospace */
code, pre {
    font-family: 'Courier New', Courier, monospace;
    font-size: 10pt;
    background: #f5f5f5;
    padding: 1pt 3pt;
}

/* Separator line under first H1 equivalent handled by page margins */
"""


def _markdown_to_html(markdown_text: str, titulo: str, workspace_name: str) -> str:
    """Convert markdown to HTML preserving basic formatting."""
    import html as html_module

    lines = markdown_text.split("\n")
    html_parts = []
    i = 0

    while i < len(lines):
        line = lines[i]
        stripped = line.rstrip()

        if not stripped:
            i += 1
            continue

        # Headers
        if stripped.startswith("# "):
            content = html_module.escape(stripped[2:].strip())
            html_parts.append(f"<h1>{content}</h1>")
            i += 1
            continue

        if stripped.startswith("## "):
            content = html_module.escape(stripped[3:].strip())
            html_parts.append(f"<h2>{content}</h2>")
            i += 1
            continue

        if stripped.startswith("### "):
            content = html_module.escape(stripped[4:].strip())
            html_parts.append(f"<h3>{content}</h3>")
            i += 1
            continue

        # Horizontal rule
        if stripped.strip() in ("---", "***", "___"):
            html_parts.append("<hr>")
            i += 1
            continue

        # Blockquote
        if stripped.startswith("> "):
            content = _inline_format(html_module.escape(stripped[2:].strip()))
            html_parts.append(f"<blockquote><p>{content}</p></blockquote>")
            i += 1
            continue

        # Numbered list
        if re.match(r"^\d+\.\s", stripped):
            items = []
            while i < len(lines) and re.match(r"^\d+\.\s", lines[i].rstrip()):
                text = re.sub(r"^\d+\.\s", "", lines[i].rstrip()).strip()
                items.append(f"<li>{_inline_format(html_module.escape(text))}</li>")
                i += 1
            html_parts.append("<ol>" + "".join(items) + "</ol>")
            continue

        # Bullet list
        if stripped.startswith("- ") or stripped.startswith("* "):
            items = []
            while i < len(lines) and (lines[i].rstrip().startswith("- ") or lines[i].rstrip().startswith("* ")):
                text = lines[i].rstrip()[2:].strip()
                items.append(f"<li>{_inline_format(html_module.escape(text))}</li>")
                i += 1
            html_parts.append("<ul>" + "".join(items) + "</ul>")
            continue

        # Table
        if "|" in stripped and i + 1 < len(lines) and "---" in lines[i + 1]:
            rows = []
            while i < len(lines) and "|" in lines[i]:
                cells = [c.strip() for c in lines[i].strip("|").split("|")]
                if not all(c.replace("-", "").replace(":", "") == "" for c in cells):
                    rows.append(cells)
                i += 1
            if rows:
                thead = "".join(f"<th>{html_module.escape(c)}</th>" for c in rows[0])
                tbody = "".join(
                    "<tr>" + "".join(f"<td>{html_module.escape(c)}</td>" for c in row) + "</tr>"
                    for row in rows[1:]
                )
                html_parts.append(f"<table><thead><tr>{thead}</tr></thead><tbody>{tbody}</tbody></table>")
            continue

        # Regular paragraph
        content = _inline_format(html_module.escape(stripped))
        html_parts.append(f"<p>{content}</p>")
        i += 1

    generated_date = datetime.now(timezone.utc).strftime("%d/%m/%Y")
    body = "\n".join(html_parts)

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>{html_module.escape(titulo)}</title>
</head>
<body>
    <!-- Hidden elements for CSS string() values used in header/footer -->
    <span id="doc-title-hidden" style="display:none">{html_module.escape(titulo)}</span>
    <span id="workspace-name-hidden" style="display:none">{html_module.escape(workspace_name)}</span>

    {body}

    <!-- Generation timestamp (last page bottom) -->
    <p style="text-indent:0; font-size:9pt; color:#888; margin-top:24pt; text-align:right;">
        Documento gerado em {generated_date} pela Plataforma Maia
    </p>
</body>
</html>"""


def _inline_format(text: str) -> str:
    """Convert **bold** and *italic* markdown to HTML tags."""
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"\*(.+?)\*", r"<em>\1</em>", text)
    return text


def markdown_to_pdf(
    markdown_text: str,
    titulo: str = "Documento Jurídico",
    workspace_name: str = "",
) -> io.BytesIO:
    """
    Convert markdown text to a PDF with ABNT NBR 14724 formatting.
    Returns a BytesIO buffer ready for download.
    Raises RuntimeError if WeasyPrint is not installed.
    """
    if not _WEASYPRINT_AVAILABLE:
        raise RuntimeError(
            "WeasyPrint não está instalado. Execute: pip install weasyprint"
        )

    from weasyprint import HTML, CSS
    html_content = _markdown_to_html(markdown_text, titulo, workspace_name)
    html_obj = HTML(string=html_content, base_url=None)
    css_obj = CSS(string=_ABNT_CSS)

    pdf_bytes = html_obj.write_pdf(stylesheets=[css_obj])

    buffer = io.BytesIO(pdf_bytes)
    buffer.seek(0)
    return buffer
