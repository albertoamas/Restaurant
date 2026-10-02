import type { DailyReportDto, OrderDto } from '@pos/shared';
import { OrderType, PaymentMethod } from '@pos/shared';
import { bs } from '../utils/money';

/**
 * Escapa los caracteres especiales HTML para prevenir XSS al insertar
 * strings de usuario dentro de plantillas HTML (ventana de impresión).
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  [OrderType.DINE_IN]:  'LOCAL',
  [OrderType.TAKEOUT]:  'PARA LLEVAR',
  [OrderType.DELIVERY]: 'DELIVERY',
};

const PAYMENT_LABEL: Partial<Record<PaymentMethod, string>> = {
  [PaymentMethod.CASH]:     'Efectivo',
  [PaymentMethod.QR]:       'QR',
  [PaymentMethod.TRANSFER]: 'Transferencia',
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-BO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/**
 * CSS base para impresora térmica 58mm (ancho imprimible ~48mm).
 * - Unidades en `pt` para consistencia entre pantalla (96dpi) y térmica (203dpi).
 * - Colores forzados a #000 puro — las térmicas no tienen escala de grises real.
 * - @page con margin:0mm y size:58mm auto para que el driver no añada márgenes.
 */
const THERMAL_CSS = `
  *{margin:0;padding:0;box-sizing:border-box;word-break:break-word;overflow-wrap:break-word}
  body{
    font-family:'Courier New',Courier,monospace;
    font-size:9pt;
    font-weight:bold;
    color:#000;
    background:#fff;
    width:44mm;
  }
  .center{text-align:center}
  .right{text-align:right}
  .bold{font-weight:bold}
  .divider{border-top:1px dashed #000;margin:4pt 0}
  .row{display:flex;justify-content:space-between;align-items:baseline}
  @media print{
    @page{
      margin:0mm;
      size:58mm auto;
    }
    body{
      width:44mm;
      -webkit-print-color-adjust:exact;
      print-color-adjust:exact;
    }
  }
`;

export interface PrintDocumentOptions {
  /** Ancho del viewport del iframe: el del área imprimible, para que el layout sea el real. */
  width:  string;
  height: string;
  /** Qué esperar tras `load` antes de imprimir (imágenes, fuentes). */
  beforePrint: (win: Window) => Promise<unknown>;
}

/**
 * Imprime un documento HTML completo desde un iframe oculto. Única vía de impresión de la app.
 *
 * Por qué iframe en lugar de window.open():
 *  - window.open() es bloqueado por Chrome/Edge como popup no autorizado.
 *  - En la app instalada (PWA) abre una ventana suelta o el navegador del sistema.
 *  - La impresión la dispara la app: el documento no necesita `<script>`, que la CSP de
 *    producción bloquearía.
 *  - afterprint limpia el iframe cuando el usuario cierra el diálogo,
 *    sin necesidad de win.close() ni timeouts arbitrarios para el cierre.
 */
export function printDocument(documentHtml: string, { width, height, beforePrint }: PrintDocumentOptions): void {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  // top:-200% lo mantiene invisible fuera de pantalla.
  iframe.style.cssText =
    `position:fixed;top:-200%;left:0;width:${width};height:${height};border:0;opacity:0;pointer-events:none;`;
  // srcdoc evita document.write() (deprecado) y carga el documento de forma estándar.
  iframe.srcdoc = documentHtml;

  document.body.appendChild(iframe);

  const cleanup = () => {
    if (document.body.contains(iframe)) document.body.removeChild(iframe);
  };

  // load se dispara cuando el documento (y recursos síncronos) está listo.
  iframe.addEventListener('load', () => {
    const win = iframe.contentWindow;
    if (!win) { cleanup(); return; }

    // Limpiar al cerrar el diálogo de impresión
    win.addEventListener('afterprint', cleanup);
    // Fallback: eliminar el iframe si afterprint no dispara (2 min)
    const fallback = setTimeout(cleanup, 120_000);
    win.addEventListener('afterprint', () => clearTimeout(fallback));

    void beforePrint(win).then(() => {
      win.focus();
      win.print();
    });
  });
}

export const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Ticket térmico: envuelve el contenido con el CSS de 58mm y lo imprime.
 * El driver de la impresora posiciona el área imprimible dentro del rollo — no se añaden márgenes CSS.
 *
 * @param html     Contenido <body> del ticket
 * @param delayMs  Margen tras `load` para imágenes async (logo en el recibo)
 */
function printViaIframe(html: string, delayMs = 450): void {
  printDocument(
    `<!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <style>${THERMAL_CSS}</style>
  </head><body>${html}</body></html>`,
    { width: '44mm', height: '1px', beforePrint: () => wait(delayMs) },
  );
}

/* ─── Comanda de cocina ──────────────────────────────────────────────────── */

/**
 * Comanda para cocina — se imprime automáticamente al crear el pedido.
 *
 * Diseño optimizado para lectura rápida en cocina:
 *  - Número de pedido en 36pt (visible a distancia)
 *  - Tipo de orden en caja bordeada
 *  - Cada item con cantidad prominente
 *  - Notas en recuadro propio
 */
export function printKitchenTicket(order: OrderDto): void {
  const items = order.items
    .map(i => `
      <div style="margin-bottom:5pt;display:flex;align-items:baseline;gap:4pt">
        <span style="font-size:14pt;font-weight:900;min-width:20pt">${i.quantity}x</span>
        <span style="font-size:10pt;font-weight:900;flex:1">${escapeHtml(i.productName)}</span>
      </div>`)
    .join('');

  const notasBlock = order.notes
    ? `<div class="divider"></div>
       <div style="border:2px solid #000;padding:4pt;margin:4pt 0">
         <div style="font-weight:900;font-size:9pt">NOTAS:</div>
         <div style="font-size:9pt;margin-top:2pt">${escapeHtml(order.notes)}</div>
       </div>`
    : '';

  const html = `
    <div class="center" style="font-size:9pt">${formatTime(order.createdAt)}</div>
    <div class="center" style="font-size:36pt;font-weight:900;letter-spacing:1pt;line-height:1.1">#${order.orderNumber}</div>
    <div class="center" style="font-size:14pt;font-weight:900;border:2px solid #000;padding:3pt;margin:4pt 0">${ORDER_TYPE_LABEL[order.type]}</div>
    <div class="divider"></div>
    <div style="font-size:9pt;font-weight:900;margin-bottom:3pt">PRODUCTOS</div>
    ${items}
    ${notasBlock}
    <div class="divider"></div>
    <div class="center" style="font-size:9pt">--- COMANDA ---</div>
  `;

  printViaIframe(html, 450);
}

/* ─── Recibo para cliente ────────────────────────────────────────────────── */

export interface ReceiptSettings {
  businessName:     string;
  businessAddress?: string;
  businessPhone?:   string;
  receiptSlogan?:   string;
}

/**
 * Recibo para el cliente — se imprime a pedido tras confirmar el pago.
 *
 * Incluye logo si está configurado (requiere driver Epson-compatible;
 * el driver "Generic / Text Only" no renderiza imágenes).
 * El delay es mayor (650ms) para dar tiempo a cargar la imagen del logo.
 */
export function printReceipt(order: OrderDto, settings: ReceiptSettings): void {
  const items = order.items
    .map(i => `
      <div style="margin-bottom:4pt">
        <div style="font-size:9pt;font-weight:900">${escapeHtml(i.productName)}</div>
        <div class="row" style="font-size:9pt">
          <span>${i.quantity} x ${bs(Number(i.unitPrice))}</span>
          <span>${bs(Number(i.subtotal))}</span>
        </div>
      </div>`)
    .join('');

  const addressLine = settings.businessAddress
    ? `<div class="center" style="font-size:8pt">${escapeHtml(settings.businessAddress)}</div>` : '';
  const phoneLine = settings.businessPhone
    ? `<div class="center" style="font-size:8pt">Tel: ${escapeHtml(settings.businessPhone)}</div>` : '';
  const sloganLine = settings.receiptSlogan
    ? `<div class="center" style="font-size:8pt;font-style:italic">${escapeHtml(settings.receiptSlogan)}</div>` : '';
  const customerLine = order.customer?.name
    ? `<div class="center" style="font-size:8pt">Cliente: ${escapeHtml(order.customer.name)}</div>` : '';

  // Desglose de pagos (soporta split: "Efectivo Bs 50.00 + QR Bs 30.00")
  const pagoStr = order.payments.length > 0
    ? order.payments
        .map(p => `${PAYMENT_LABEL[p.method] ?? p.method} ${bs(Number(p.amount))}`)
        .join(' + ')
    : '-';

  const html = `
    <div class="center" style="font-size:36pt;font-weight:900;line-height:1.1">#${order.orderNumber}</div>
    ${customerLine}
    <div class="divider"></div>
    <div class="center bold" style="font-size:12pt">${escapeHtml(settings.businessName)}</div>
    ${addressLine}
    ${phoneLine}
    ${sloganLine}
    <div class="divider"></div>
    <div class="row"><span>Fecha:</span><span>${formatDateTime(order.createdAt)}</span></div>
    <div class="row"><span>Tipo:</span><span>${ORDER_TYPE_LABEL[order.type]}</span></div>
    <div class="divider"></div>
    ${items}
    <div class="divider"></div>
    <div class="row bold" style="font-size:12pt"><span>TOTAL</span><span>${bs(Number(order.total))}</span></div>
    <div class="row" style="font-size:8pt;margin-top:2pt"><span>Pago:</span><span>${pagoStr}</span></div>
    <div class="divider"></div>
    <div class="center" style="font-size:8pt;margin-top:4pt">¡Gracias por su compra!</div>
  `;

  // 650ms si hay logo (imagen async), 450ms si no
  printViaIframe(html, 450);
}

/* ─── Tickets físicos de sorteo ──────────────────────────────────────────── */

/**
 * Imprime uno o varios tickets físicos de sorteo en impresora térmica.
 *
 * Cada ticket se separa con page-break-after:always para que el driver
 * trate cada uno como una "página" independiente en el rollo —
 * sin esto, tickets consecutivos salen pegados sin separación visual.
 */
export interface RaffleTicketPrintSettings {
  businessName:     string;
  businessAddress?: string;
  businessPhone?:   string;
  receiptSlogan?:   string;
}

export function printRaffleTickets(
  tickets: Array<{ ticketNumber: number; customerName: string }>,
  raffleName: string,
  settings: RaffleTicketPrintSettings,
): void {
  if (!tickets.length) return;

  const today = new Date().toLocaleDateString('es-BO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  const addressLine = settings.businessAddress
    ? `<div class="center" style="font-size:7pt">${escapeHtml(settings.businessAddress)}</div>` : '';
  const phoneLine = settings.businessPhone
    ? `<div class="center" style="font-size:7pt">Tel: ${escapeHtml(settings.businessPhone)}</div>` : '';
  const sloganLine = settings.receiptSlogan
    ? `<div class="center" style="font-size:7pt;font-style:italic;margin-top:1pt">${escapeHtml(settings.receiptSlogan)}</div>` : '';

  const html = tickets
    .map((t, i) => {
      const isLast = i === tickets.length - 1;
      return `
        <div style="${isLast ? '' : 'page-break-after:always;break-after:page;'}padding-bottom:8pt">
          <div class="center" style="font-size:9pt;font-weight:900">${escapeHtml(settings.businessName)}</div>
          ${addressLine}${phoneLine}${sloganLine}
          <div class="divider"></div>
          <div class="center" style="font-size:9pt;font-weight:900;margin:2pt 0">${escapeHtml(raffleName)}</div>
          <div class="divider"></div>
          <div class="center" style="font-size:48pt;font-weight:900;line-height:1.1;letter-spacing:2pt">#${t.ticketNumber}</div>
          <div class="divider"></div>
          <div class="center" style="font-size:11pt;font-weight:900">${escapeHtml(t.customerName)}</div>
          <div class="center" style="font-size:8pt;margin-top:2pt">${today}</div>
          <div class="center" style="margin-top:6pt;font-size:8pt;letter-spacing:4pt">- - - - - -</div>
        </div>
      `;
    })
    .join('');

  printViaIframe(html, 450);
}

/* ─── Rendición del cajero ───────────────────────────────────────────────── */

export interface CashierReportPrintInfo {
  cashierName:  string;
  businessName: string;
  branchName:   string | null;
  /** Período en palabras: "Hoy, 29 de septiembre", "Del 22 al 29 de septiembre". */
  periodLabel:  string;
}

/**
 * Rendición en la impresora del punto de venta (58 mm): el efectivo a entregar arriba y en
 * grande, el resto del desglose debajo y una línea para la firma de quien recibe.
 */
export function printCashierReport(report: DailyReportDto, info: CashierReportPrintInfo): void {
  const row = (label: string, value: string) =>
    `<div class="row" style="font-size:9pt;margin:2pt 0"><span>${label}</span><span>${value}</span></div>`;
  const p = report.paymentBreakdown;

  const html = `
    <div class="center" style="font-size:11pt">${escapeHtml(info.businessName)}</div>
    ${info.branchName ? `<div class="center" style="font-size:9pt">${escapeHtml(info.branchName)}</div>` : ''}
    <div class="divider"></div>
    <div class="center" style="font-size:12pt">RENDICION</div>
    <div class="center" style="font-size:9pt">${escapeHtml(info.cashierName)}</div>
    <div class="center" style="font-size:9pt">${escapeHtml(info.periodLabel)}</div>
    <div class="divider"></div>
    <div class="center" style="font-size:9pt">Efectivo a entregar</div>
    <div class="center" style="font-size:18pt;margin:2pt 0">${bs(p.cash)}</div>
    <div class="divider"></div>
    ${row('QR', bs(p.qr))}
    ${row('Transferencia', bs(p.transfer))}
    ${row('Total cobrado', bs(report.totalSales))}
    ${p.cortesia > 0 ? row('Cortesias', bs(p.cortesia)) : ''}
    <div class="divider"></div>
    ${row('Pedidos', String(report.orderCount))}
    ${row('Ticket promedio', bs(report.averageTicket))}
    <div style="margin-top:24pt;border-top:1px solid #000"></div>
    <div class="center" style="font-size:8pt;margin-top:2pt">Firma de quien recibe</div>
    <div class="center" style="font-size:8pt;margin-top:6pt">Impreso ${formatDateTime(new Date().toISOString())}</div>
  `;

  printViaIframe(html, 150);
}
