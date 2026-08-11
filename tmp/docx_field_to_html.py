from __future__ import annotations

import argparse
from html import escape
from pathlib import Path

from docx import Document
from docx.document import Document as DocType
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.table import Table
from docx.text.paragraph import Paragraph
from docx.oxml.table import CT_Tbl
from docx.oxml.text.paragraph import CT_P


def iter_blocks(doc: DocType):
    for child in doc.element.body.iterchildren():
        if isinstance(child, CT_P):
            yield Paragraph(child, doc)
        elif isinstance(child, CT_Tbl):
            yield Table(child, doc)


def rgb(run) -> str | None:
    try:
        value = run.font.color.rgb
        return str(value) if value else None
    except Exception:
        return None


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
    color = rgb(run)
    if color:
        styles.append(f"color:#{color}")
    return f'<span style="{";".join(styles)}">{text}</span>'


def paragraph_num_id(paragraph: Paragraph) -> str | None:
    p_pr = paragraph._p.pPr
    if p_pr is None or p_pr.numPr is None or p_pr.numPr.numId is None:
        return None
    return p_pr.numPr.numId.val


def paragraph_html(paragraph: Paragraph, *, first_nonempty: bool = False) -> str:
    xml = paragraph._p.xml
    if 'w:type="page"' in xml:
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
    classes = []
    if paragraph.alignment == WD_ALIGN_PARAGRAPH.CENTER:
        classes.append("center")
    if first_nonempty:
        classes.append("cover-title")
    cls = f' class="{" ".join(classes)}"' if classes else ""
    return f"<p{cls}>{content}</p>"


def cell_fill(cell) -> str | None:
    tc_pr = cell._tc.tcPr
    if tc_pr is None:
        return None
    shd = tc_pr.find(qn("w:shd"))
    return shd.get(qn("w:fill")) if shd is not None else None


def table_html(table: Table) -> str:
    one_cell = len(table.columns) == 1 and len(table.rows) == 1
    widths = []
    for cell in table.rows[0].cells:
        tc_w = cell._tc.tcPr.find(qn("w:tcW")) if cell._tc.tcPr is not None else None
        widths.append(int(tc_w.get(qn("w:w"), "1")) if tc_w is not None else 1)
    width_total = max(1, sum(widths))
    colgroup = "<colgroup>" + "".join(
        f'<col style="width:{(w / width_total) * 100:.3f}%">' for w in widths
    ) + "</colgroup>"

    header_html = ""
    rows_html = []
    for row_index, row in enumerate(table.rows):
        cells = []
        for cell in row.cells:
            pieces = []
            for paragraph in cell.paragraphs:
                content = "".join(run_html(run) for run in paragraph.runs) or escape(paragraph.text)
                if content.strip():
                    pieces.append(content)
            tag = "th" if not one_cell and row_index == 0 else "td"
            fill = cell_fill(cell)
            style = f' style="background:#{fill}"' if fill and fill.lower() != "auto" else ""
            cells.append(f"<{tag}{style}>{'<br>'.join(pieces)}</{tag}>")
        rendered = "<tr>" + "".join(cells) + "</tr>"
        if not one_cell and row_index == 0:
            header_html = rendered
        else:
            rows_html.append(rendered)
    class_name = "callout" if one_cell else "data-table"
    thead = f"<thead>{header_html}</thead>" if header_html else ""
    return f'<table class="{class_name}">{colgroup}{thead}<tbody>{"".join(rows_html)}</tbody></table>'


def convert(docx_path: Path, html_path: Path, title: str) -> None:
    doc = Document(docx_path)
    parts: list[str] = []
    list_open = False
    found_first = False

    for block in iter_blocks(doc):
        if isinstance(block, Paragraph):
            num_id = paragraph_num_id(block)
            if num_id:
                if not list_open:
                    parts.append("<ul>")
                    list_open = True
                content = "".join(run_html(run) for run in block.runs) or escape(block.text)
                parts.append(f"<li>{content}</li>")
                continue
            if list_open:
                parts.append("</ul>")
                list_open = False
            first_nonempty = not found_first and bool(block.text.strip())
            if first_nonempty:
                found_first = True
            parts.append(paragraph_html(block, first_nonempty=first_nonempty))
        else:
            if list_open:
                parts.append("</ul>")
                list_open = False
            parts.append(table_html(block))
    if list_open:
        parts.append("</ul>")

    css = """
@page { size: A4; margin: 18mm 20mm 19mm 20mm; }
@font-face {
  font-family: "B Nazanin";
  src: url("file:///C:/Users/AI/AppData/Local/Microsoft/Windows/Fonts/BNazanin.ttf") format("truetype");
  font-style: normal; font-weight: 400;
}
@font-face {
  font-family: "B Nazanin";
  src: url("file:///C:/Users/AI/AppData/Local/Microsoft/Windows/Fonts/BNaznnBd.ttf") format("truetype");
  font-style: normal; font-weight: 700;
}
* { box-sizing: border-box; }
html, body { direction: rtl; }
body {
  font-family: "B Nazanin", serif; color: #1e293b; font-size: 12.6pt;
  line-height: 1.55; margin: 0; text-align: right;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
p { margin: 0 0 6pt; text-align: justify; orphans: 3; widows: 3; }
p.center { text-align: center; }
p.cover-title { margin-top: 34mm; font-size: 25pt; font-weight: 700; color: #243b53; }
h1 { color: #243b53; font-size: 18pt; margin: 15pt 0 7pt; break-after: avoid; text-align: right; }
h2 { color: #2f6f5e; font-size: 15.5pt; margin: 11pt 0 5pt; break-after: avoid; text-align: right; }
h3 { color: #243b53; font-size: 14pt; margin: 8pt 0 4pt; break-after: avoid; text-align: right; }
ul { margin: 3pt 0 8pt; padding-right: 22pt; }
li { margin: 0 0 3pt; padding-right: 2pt; text-align: right; break-inside: avoid; }
table {
  direction: rtl; width: 100%; border-collapse: collapse; table-layout: fixed;
  margin: 7pt 0 10pt; font-size: 10.5pt; break-inside: auto;
}
thead { display: table-header-group; }
tr { break-inside: avoid; break-after: auto; }
th {
  background: #243b53 !important; color: white; font-weight: 700; text-align: center;
  border: .55pt solid #9aa8b5; padding: 5.5pt 5pt; vertical-align: middle;
}
td {
  border: .55pt solid #cbd5e1; padding: 5pt; vertical-align: middle;
  text-align: right; overflow-wrap: anywhere;
}
.callout { font-size: 11.8pt; break-inside: avoid; }
.callout td { padding: 8pt 9pt; border-color: #b8c8c1; }
.page-break { break-before: page; height: 0; }
.spacer { height: 3pt; }
"""
    html_path.parent.mkdir(parents=True, exist_ok=True)
    html_path.write_text(
        '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8">'
        f"<title>{escape(title)}</title><style>{css}</style></head>"
        f'<body>{"".join(parts)}</body></html>',
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("docx", type=Path)
    parser.add_argument("html", type=Path)
    parser.add_argument("--title", required=True)
    args = parser.parse_args()
    convert(args.docx, args.html, args.title)
    print(args.html.as_posix())


if __name__ == "__main__":
    main()
