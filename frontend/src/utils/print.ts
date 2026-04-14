import type { OrderDto } from '@pos/shared';
import { OrderType, PaymentMethod } from '@pos/shared';

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
  *{margin:0;padding:0;box-sizing:border-box}
  body{
    font-family:'Courier New',Courier,monospace;
    font-size:8pt;
    color:#000;
    background:#fff;
    width:48mm;
  }
  .center{text-align:center}
  .right{text-align:right}
  .bold{font-weight:bold}
  .divider{border-top:1px dashed #000;margin:3pt 0}
  .row{display:flex;justify-content:space-between;align-items:baseline}
  @media print{
    @page{
      margin:0mm;
      size:58mm auto;
    }
    body{
      width:48mm;
      -webkit-print-color-adjust:exact;
      print-color-adjust:exact;
    }
  }
`;

/**
 * Inyecta el HTML en un iframe oculto y dispara window.print().
 *
 * Por qué iframe en lugar de window.open():
 *  - window.open() es bloqueado por Chrome/Edge como popup no autorizado.
 *  - El iframe evita el blocker al no abrir una ventana visible.
 *  - afterprint limpia el iframe cuando el usuario cierra el diálogo,
 *    sin necesidad de win.close() ni timeouts arbitrarios para el cierre.
 *
 * @param html     Contenido <body> del ticket
 * @param delayMs  Tiempo de espera antes de print() — usar 600 si hay imágenes
 */
function printViaIframe(html: string, delayMs = 450): void {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;border:0;opacity:0;pointer-events:none;';

  // srcdoc evita document.write() (deprecado) y carga el documento de forma estándar.
  iframe.srcdoc = `<!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <style>${THERMAL_CSS}</style>
  </head><body>${html}</body></html>`;

  document.body.appendChild(iframe);

  const cleanup = () => {
    if (document.body.contains(iframe)) document.body.removeChild(iframe);
  };

  // load se dispara cuando el documento (y recursos síncronos) está listo.
  // delayMs adicional da margen para imágenes async (logo en el recibo).
  iframe.addEventListener('load', () => {
    const win = iframe.contentWindow;
    if (!win) { cleanup(); return; }

    // Limpiar al cerrar el diálogo de impresión
    win.addEventListener('afterprint', cleanup);
    // Fallback: eliminar el iframe si afterprint no dispara (2 min)
    const fallback = setTimeout(cleanup, 120_000);
    win.addEventListener('afterprint', () => clearTimeout(fallback));

    setTimeout(() => {
      win.focus();
      win.print();
    }, delayMs);
  });
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
        <span style="font-size:13pt;font-weight:900;min-width:18pt">${i.quantity}x</span>
        <span style="font-size:9pt;font-weight:bold;flex:1">${escapeHtml(i.productName)}</span>
      </div>`)
    .join('');

  const notasBlock = order.notes
    ? `<div class="divider"></div>
       <div style="border:2px solid #000;padding:3pt;margin:3pt 0">
         <div style="font-weight:bold;font-size:8pt">NOTAS:</div>
         <div style="font-size:9pt;margin-top:2pt">${escapeHtml(order.notes)}</div>
       </div>`
    : '';

  const html = `
    <div class="center" style="font-size:8pt">${formatTime(order.createdAt)}</div>
    <div class="center" style="font-size:36pt;font-weight:900;letter-spacing:1pt;line-height:1.1">#${order.orderNumber}</div>
    <div class="center" style="font-size:14pt;font-weight:bold;border:2px solid #000;padding:3pt;margin:4pt 0">${ORDER_TYPE_LABEL[order.type]}</div>
    <div class="divider"></div>
    <div style="font-size:7pt;font-weight:bold;margin-bottom:3pt">PRODUCTOS</div>
    ${items}
    ${notasBlock}
    <div class="divider"></div>
    <div class="center" style="font-size:8pt">--- COMANDA ---</div>
  `;

  printViaIframe(html, 450);
}

/* ─── Recibo para cliente ────────────────────────────────────────────────── */

export interface ReceiptSettings {
  businessName:     string;
  businessAddress?: string;
  businessPhone?:   string;
  receiptFooter?:   string;
  logoUrl?:         string | null;
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
      <div style="margin-bottom:3pt">
        <div style="font-size:8pt">${escapeHtml(i.productName)}</div>
        <div class="row" style="font-size:8pt">
          <span>${i.quantity} x Bs ${Number(i.unitPrice).toFixed(2)}</span>
          <span>Bs ${Number(i.subtotal).toFixed(2)}</span>
        </div>
      </div>`)
    .join('');

  const addressLine = settings.businessAddress
    ? `<div class="center" style="font-size:7pt">${escapeHtml(settings.businessAddress)}</div>` : '';
  const phoneLine = settings.businessPhone
    ? `<div class="center" style="font-size:7pt">Tel: ${escapeHtml(settings.businessPhone)}</div>` : '';
  const footer = escapeHtml(settings.receiptFooter ?? '¡Gracias por su compra!');

  const logoSrc = settings.logoUrl
    ? (settings.logoUrl.startsWith('http')
        ? settings.logoUrl
        : `${window.location.origin}${settings.logoUrl}`)
    : null;
  const logoBlock = logoSrc
    ? `<div class="center" style="margin-bottom:3pt">
         <img src="${logoSrc}" alt="" style="max-width:80pt;max-height:40pt;object-fit:contain"/>
       </div>`
    : '';

  // Desglose de pagos (soporta split: "Efectivo Bs 50.00 + QR Bs 30.00")
  const pagoStr = order.payments.length > 0
    ? order.payments
        .map(p => `${PAYMENT_LABEL[p.method] ?? p.method} Bs ${Number(p.amount).toFixed(2)}`)
        .join(' + ')
    : '—';

  const html = `
    ${logoBlock}
    <div class="center bold" style="font-size:11pt">${escapeHtml(settings.businessName)}</div>
    ${addressLine}
    ${phoneLine}
    <div class="center" style="font-size:7pt">Comprobante de venta</div>
    <div class="divider"></div>
    <div class="row"><span>Pedido:</span><span class="bold">#${order.orderNumber}</span></div>
    <div class="row"><span>Fecha:</span><span>${formatDateTime(order.createdAt)}</span></div>
    <div class="row"><span>Tipo:</span><span>${ORDER_TYPE_LABEL[order.type]}</span></div>
    <div class="divider"></div>
    ${items}
    <div class="divider"></div>
    <div class="row bold" style="font-size:11pt"><span>TOTAL</span><span>Bs ${Number(order.total).toFixed(2)}</span></div>
    <div class="row" style="font-size:7pt;margin-top:2pt"><span>Pago:</span><span>${pagoStr}</span></div>
    <div class="divider"></div>
    <div class="center" style="font-size:7pt;margin-top:4pt">${footer}</div>
  `;

  // 650ms si hay logo (imagen async), 450ms si no
  printViaIframe(html, logoSrc ? 650 : 450);
}
