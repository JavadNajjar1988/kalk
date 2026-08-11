from __future__ import annotations

from html import escape
from pathlib import Path

from docx import Document
from docx.document import Document as DocType
from docx.table import Table
from docx.text.paragraph import Paragraph
from docx.oxml.table import CT_Tbl
from docx.oxml.text.paragraph import CT_P


ROOT = Path(r"C:\Users\AI\Documents\GitHub\kalk")
DOCX = ROOT / "output" / "documents" / "گزارش مقایسه قابلیت‌های سامانه ما با سامانه C2.docx"
HTML = ROOT / "tmp" / "our-system-comparison-report.html"


def iter_blocks(doc: DocType):
    for child in doc.element.body.iterchildren():
        if isinstance(child, CT_P):
            yield Paragraph(child, doc)
        elif isinstance(child, CT_Tbl):
            yield Table(child, doc)


def run_html(run) -> str:
    text = escape(run.text).replace("\n", "<br>")
    if not text:
        return ""
    styles = []
    if run.bold:
        styles.append("font-weight:700")
    if run.italic:
        styles.append("font-style:italic")
    if run.font.size:
        styles.append(f"font-size:{run.font.size.pt:.1f}pt")
    if run.font.color and run.font.color.rgb:
        styles.append(f"color:#{run.font.color.rgb}")
    return f'<span style="{";".join(styles)}">{text}</span>'


def paragraph_html(paragraph: Paragraph) -> str:
    if "w:type=\"page\"" in paragraph._p.xml:
        return '<div class="page-break"></div>'
    content = "".join(run_html(run) for run in paragraph.runs) or escape(paragraph.text)
    if not content:
        return '<div class="spacer"></div>'
    style = paragraph.style.name if paragraph.style else ""
    if style.startswith("Heading 1"):
        return f"<h1>{content}</h1>"
    if style.startswith("Heading 2"):
        return f"<h2>{content}</h2>"
    if style.startswith("Heading 3"):
        return f"<h3>{content}</h3>"
    if style.startswith("List Bullet") or style.startswith("List Number"):
        return f"<li>{content}</li>"
    return f"<p>{content}</p>"


def table_html(table: Table, index: int) -> str:
    has_header = index >= 3
    head, body = [], []
    for row_index, row in enumerate(table.rows):
        cells = []
        for cell in row.cells:
            content = "<br>".join(
                "".join(run_html(run) for run in p.runs) or escape(p.text)
                for p in cell.paragraphs
                if p.text.strip()
            )
            tag = "th" if has_header and row_index == 0 else "td"
            cells.append(f"<{tag}>{content}</{tag}>")
        rendered = "<tr>" + "".join(cells) + "</tr>"
        (head if has_header and row_index == 0 else body).append(rendered)
    class_name = ["cover-meta", "callout", "metrics"][index] if index < 3 else "data-table"
    return f'<table class="{class_name}"><thead>{"".join(head)}</thead><tbody>{"".join(body)}</tbody></table>'


doc = Document(DOCX)
parts = []
list_mode = None
table_index = 0
for block in iter_blocks(doc):
    if isinstance(block, Paragraph):
        style = block.style.name if block.style else ""
        mode = "ul" if style.startswith("List Bullet") else "ol" if style.startswith("List Number") else None
        if mode != list_mode:
            if list_mode:
                parts.append(f"</{list_mode}>")
            if mode:
                parts.append(f"<{mode}>")
            list_mode = mode
        parts.append(paragraph_html(block))
    else:
        if list_mode:
            parts.append(f"</{list_mode}>")
            list_mode = None
        parts.append(table_html(block, table_index))
        table_index += 1
if list_mode:
    parts.append(f"</{list_mode}>")

css = """
@page { size: Letter; margin: 18mm 18mm 19mm 18mm; }
@font-face {
  font-family: "B Nazanin";
  src: local("B Nazanin"), url("file:///C:/Users/AI/AppData/Local/Microsoft/Windows/Fonts/BNazanin.ttf") format("truetype");
  font-style: normal; font-weight: 400;
}
@font-face {
  font-family: "B Nazanin";
  src: local("B Nazanin Bold"), url("file:///C:/Users/AI/AppData/Local/Microsoft/Windows/Fonts/BNaznnBd.ttf") format("truetype");
  font-style: normal; font-weight: 700;
}
* { box-sizing: border-box; }
html, body { direction: rtl; }
body {
  font-family: "B Nazanin", serif; color: #1a1a1a; font-size: 11.4pt;
  line-height: 1.52; margin: 0; text-align: right;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
p { margin: 0 0 6pt; text-align: right; orphans: 3; widows: 3; }
h1 { color: #2e74b5; font-size: 18pt; margin: 14pt 0 7pt; break-after: avoid; text-align: right; }
h2 { color: #2e74b5; font-size: 15pt; margin: 12pt 0 6pt; break-after: avoid; text-align: right; }
h3 { color: #1f4d78; font-size: 13pt; margin: 8pt 0 4pt; break-after: avoid; text-align: right; }
ul, ol { margin: 3pt 0 8pt; padding-right: 22pt; }
li { margin: 0 0 4pt; padding-right: 2pt; text-align: right; }
table {
  direction: rtl; width: 100%; border-collapse: collapse; table-layout: fixed;
  margin: 7pt 0 11pt; font-size: 9.5pt; break-inside: auto;
}
thead { display: table-header-group; }
tr { break-inside: avoid; break-after: auto; }
th {
  background: #163a5f; color: white; font-weight: 700; text-align: right;
  border: .6pt solid #aab8c7; padding: 6pt 5pt; vertical-align: middle;
}
td {
  border: .6pt solid #c8d1dc; padding: 5pt; vertical-align: middle;
  text-align: right; overflow-wrap: anywhere;
}
tr:nth-child(odd) td { background: #f8fafc; }
.cover-meta td { background: white !important; font-size: 10.5pt; }
.cover-meta td:last-child { background: #e8eef5 !important; color: #163a5f; font-weight: 700; width: 24%; }
.callout td { background: #163a5f !important; color: white; font-weight: 700; text-align: right; font-size: 11pt; padding: 9pt 10pt; }
.metrics td { background: #e8eef5 !important; color: #163a5f; font-weight: 700; text-align: right; font-size: 12pt; }
.page-break { break-before: page; height: 0; }
.spacer { height: 4pt; }
body > p:nth-of-type(1) { margin-top: 38mm; }
"""

HTML.write_text(
    f'<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8">'
    f'<title>گزارش مقایسه قابلیت‌های سامانه ما با سامانه C2</title><style>{css}</style></head>'
    f'<body>{"".join(parts)}</body></html>',
    encoding="utf-8",
)
print(HTML)
