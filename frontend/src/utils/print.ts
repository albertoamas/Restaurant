import type { OrderDto } from '@pos/shared';
import { OrderType, PaymentMethod } from '@pos/shared';

const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  [OrderType.DINE_IN]: 'LOCAL',
  [OrderType.TAKEOUT]: 'PARA LLEVAR',
  [OrderType.DELIVERY]: 'DELIVERY',
};

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Efectivo',
  [PaymentMethod.QR]: 'QR',
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

function openPrintWindow(html: string, title: string) {
  const win = window.open('', '_blank', 'width=320,height=500');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <title>${title}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Courier New',monospace;font-size:11px;width:48mm;padding:2px}
      .center{text-align:center}
      .big{font-size:48px;font-weight:900;text-align:center;letter-spacing:2px;line-height:1}
      .type{font-size:18px;font-weight:bold;text-align:center;border:2px solid #000;padding:4px;margin:6px 0}
      .divider{border-top:1px dashed #000;margin:6px 0}
      .row{display:flex;justify-content:space-between}
      .item-name{font-weight:bold}
      .qty{font-size:16px;font-weight:bold}
      .total-row{display:flex;justify-content:space-between;font-size:15px;font-weight:bold;margin-top:4px}
      .footer{text-align:center;margin-top:8px;font-size:11px}
      @media print{@page{margin:0;size:58mm auto}body{width:48mm}}
    </style>
  </head><body>${html}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 300);
}

/** Comanda para cocina — se imprime automáticamente al crear el pedido */
export function printKitchenTicket(order: OrderDto) {
  const items = order.items
    .map(i => `
      <div style="margin-bottom:6px">
        <div class="row">
          <span class="qty">${i.quantity}x</span>
          <span class="item-name" style="flex:1;margin-left:8px">${i.productName}</span>
        </div>
      </div>`)
    .join('');

  const notasBlock = order.notes
    ? `<div class="divider"></div>
       <div style="border:2px solid #000;padding:4px;margin:4px 0">
         <div style="font-weight:bold;font-size:12px">NOTAS:</div>
         <div style="font-size:14px;margin-top:2px">${order.notes}</div>
       </div>`
    : '';

  const html = `
    <div class="center" style="font-size:11px;color:#666">${formatTime(order.createdAt)}</div>
    <div class="big">#${order.orderNumber}</div>
    <div class="type">${ORDER_TYPE_LABEL[order.type]}</div>
    <div class="divider"></div>
    <div style="margin-bottom:4px"><strong>PRODUCTOS</strong></div>
    ${items}
    ${notasBlock}
    <div class="divider"></div>
    <div class="center" style="font-size:11px;color:#666">— COMANDA —</div>
  `;

  openPrintWindow(html, `Comanda #${order.orderNumber}`);
}

export interface ReceiptSettings {
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  receiptFooter?: string;
  logoUrl?: string | null;
}

/** Recibo para el cliente — se imprime a pedido */
export function printReceipt(order: OrderDto, settings: ReceiptSettings) {
  const items = order.items
    .map(i => `
      <div style="margin-bottom:4px">
        <div>${i.productName}</div>
        <div class="row" style="color:#555">
          <span>${i.quantity} x Bs ${Number(i.unitPrice).toFixed(2)}</span>
          <span>Bs ${Number(i.subtotal).toFixed(2)}</span>
        </div>
      </div>`)
    .join('');

  const addressLine = settings.businessAddress
    ? `<div class="center" style="color:#555;font-size:11px">${settings.businessAddress}</div>` : '';
  const phoneLine = settings.businessPhone
    ? `<div class="center" style="color:#555;font-size:11px">Tel: ${settings.businessPhone}</div>` : '';
  const footer = settings.receiptFooter ?? '¡Gracias por su compra!';
  const logoBlock = settings.logoUrl
    ? `<div style="text-align:center;margin-bottom:4px"><img src="${settings.logoUrl}" alt="logo" style="max-width:100px;max-height:60px;object-fit:contain;display:inline-block" /></div>`
    : '';

  const html = `
    ${logoBlock}
    <div class="center" style="font-size:15px;font-weight:bold">${settings.businessName}</div>
    ${addressLine}
    ${phoneLine}
    <div class="center" style="color:#555;font-size:11px">Comprobante de venta</div>
    <div class="divider"></div>
    <div class="row"><span>Pedido:</span><span><strong>#${order.orderNumber}</strong></span></div>
    <div class="row"><span>Fecha:</span><span>${formatDateTime(order.createdAt)}</span></div>
    <div class="row"><span>Tipo:</span><span>${ORDER_TYPE_LABEL[order.type]}</span></div>
    <div class="divider"></div>
    ${items}
    <div class="divider"></div>
    <div class="total-row"><span>TOTAL</span><span>Bs ${Number(order.total).toFixed(2)}</span></div>
    <div class="row" style="color:#555;margin-top:4px">
      <span>Pago:</span><span>${PAYMENT_LABEL[order.paymentMethod]}</span>
    </div>
    <div class="divider"></div>
    <div class="footer">${footer}</div>
  `;

  openPrintWindow(html, `Recibo #${order.orderNumber}`);
}
