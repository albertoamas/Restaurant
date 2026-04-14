/**
 * CSV export utility.
 * Generates a UTF-8 CSV with BOM (so Excel opens it correctly without import wizard)
 * and triggers a browser download.
 */

type CellValue = string | number | null | undefined;

export interface CsvSection {
  /** Optional section heading row (renders as a single merged label row) */
  title?: string;
  headers: string[];
  rows: CellValue[][];
}

function escapeCell(value: CellValue): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Wrap in quotes if the value contains comma, newline, or double-quote
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(sections: CsvSection[]): string {
  const lines: string[] = [];

  sections.forEach((section, i) => {
    // Blank line between sections (not before the first one)
    if (i > 0) lines.push('');

    if (section.title) {
      lines.push(escapeCell(section.title));
    }

    lines.push(section.headers.map(escapeCell).join(','));

    for (const row of section.rows) {
      lines.push(row.map(escapeCell).join(','));
    }
  });

  return lines.join('\r\n');
}

/**
 * Generate a CSV from one or more sections and trigger a browser download.
 * @param filename  Suggested filename (e.g. "reporte_2026-04-13.csv")
 * @param sections  One or more data sections to include in the file
 */
export function downloadCsv(filename: string, sections: CsvSection[]): void {
  const csv = buildCsv(sections);
  // BOM tells Excel this is UTF-8 — prevents garbled accents on Windows
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href     = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
