import { escapeHtml, printDocument, wait } from './print';

/** Una tabla del documento: título, columnas y filas ya formateadas como texto. */
export interface PrintTable {
  heading: string;
  columns: string[];
  rows: string[][];
  /** Índices de columnas numéricas (se alinean a la derecha). */
  numeric?: number[];
}

export interface ReportPrintInfo {
  businessName: string;
  /** Sección del reporte: "Resumen", "Caja"... */
  section: string;
  /** Período en palabras: "Del 1 al 29 de septiembre". */
  period: string;
  /** "Sucursal Principal" o "Todas las sucursales". */
  scope: string;
}

/** Hoja A4 sobria: se lee en papel y no gasta tinta en fondos. */
const A4_CSS = `
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:10pt;color:#111;background:#fff}
  header{border-bottom:1.5pt solid #111;padding-bottom:8pt;margin-bottom:14pt}
  h1{font-size:16pt}
  .meta{font-size:9.5pt;color:#444;margin-top:2pt}
  h2{font-size:11.5pt;margin:14pt 0 6pt}
  table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
  th{text-align:left;font-size:9pt;color:#444;font-weight:600;border-bottom:1pt solid #999;padding:4pt 6pt}
  td{border-bottom:0.5pt solid #ddd;padding:4pt 6pt}
  .num{text-align:right}
  tr{break-inside:avoid}
  footer{margin-top:18pt;font-size:8.5pt;color:#666}
  @media print{@page{size:A4;margin:16mm}}
`;

function tableHtml(t: PrintTable): string {
  const cls = (i: number) => (t.numeric?.includes(i) ? ' class="num"' : '');
  const head = t.columns.map((c, i) => `<th${cls(i)}>${escapeHtml(c)}</th>`).join('');
  const body = t.rows
    .map((r) => `<tr>${r.map((cell, i) => `<td${cls(i)}>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('');
  return `<h2>${escapeHtml(t.heading)}</h2><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

/**
 * Imprime una sección del reporte en A4: encabezado del negocio y las cifras en tablas, sin
 * gráficos. Por printDocument(): funciona igual en el navegador y en la app instalada.
 */
export function printReportDocument(info: ReportPrintInfo, tables: PrintTable[]): void {
  const printedAt = new Date().toLocaleString('es-BO', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(info.section)}</title><style>${A4_CSS}</style></head><body>
    <header>
      <h1>${escapeHtml(info.businessName)}: ${escapeHtml(info.section)}</h1>
      <p class="meta">${escapeHtml(info.period)}. ${escapeHtml(info.scope)}.</p>
    </header>
    ${tables.filter((t) => t.rows.length > 0).map(tableHtml).join('')}
    <footer>Impreso el ${escapeHtml(printedAt)}</footer>
  </body></html>`;

  printDocument(html, { width: '210mm', height: '297mm', beforePrint: () => wait(100) });
}
