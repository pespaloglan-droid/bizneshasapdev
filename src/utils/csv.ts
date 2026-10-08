function escapeCell(value: string | number): string {
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function downloadBlob(fileName: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/** Excel-de dogry açylmagy üçin BOM goşulýar (türkmen harplary). */
export function exportCsv(
  fileName: string,
  headers: readonly string[],
  rows: readonly (readonly (string | number)[])[]
): void {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(','));
  downloadBlob(`${fileName}.csv`, `\uFEFF${lines.join('\r\n')}`, 'text/csv;charset=utf-8');
}

export function escapeHtml(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface ReportTable {
  readonly title: string;
  readonly columns: readonly string[];
  readonly rows: readonly (readonly (string | number)[])[];
}

function renderTable(table: ReportTable): string {
  const head = table.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('');
  const body = table.rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell, index) =>
            index === 0
              ? `<td class="l">${escapeHtml(cell)}</td>`
              : `<td class="r">${escapeHtml(cell)}</td>`
          )
          .join('')}</tr>`
    )
    .join('');
  return `<div class="sec">${escapeHtml(table.title)}</div>
    <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

/** Hasabat çapy üçin bitewüleşdirilen HTML şablony (goşmaça tablolary goldaýar). */
export function buildReportHtml(
  title: string,
  subtitle: string,
  columns: readonly string[],
  rows: readonly (readonly (string | number)[])[],
  footer: string,
  extras: readonly ReportTable[] = []
): string {
  const mainTable = renderTable({ title: '', columns, rows });
  const extraHtml = extras.map(renderTable).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Courier New',monospace;padding:8px;color:#000;background:#fff}
    h1{font-size:15px;text-align:center;margin-bottom:2px}
    .sub{font-size:10px;text-align:center;margin-bottom:8px}
    .hr{border-top:1px dashed #000;margin:6px 0}
    .sec{font-size:10px;font-weight:700;margin:8px 0 3px}
    table{width:100%;border-collapse:collapse;font-size:10px}
    th,td{padding:3px 2px;border-bottom:1px dotted #999}
    th{text-align:left;font-weight:700}
    .r{text-align:right}.l{text-align:left}
    .footer{margin-top:8px;text-align:center;font-size:10px;font-weight:700}
  </style></head><body>
    <h1>${escapeHtml(title)}</h1>
    <div class="sub">${escapeHtml(subtitle)}</div>
    <div class="hr"></div>
    ${mainTable}
    ${extraHtml}
    <div class="hr"></div>
    <div class="footer">${escapeHtml(footer)}</div>
  </body></html>`;
}