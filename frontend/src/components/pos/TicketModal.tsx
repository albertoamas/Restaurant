import { useRef } from 'react';
import type { OrderDto } from '@pos/shared';
import { OrderType, PaymentMethod } from '@pos/shared';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: OrderDto;
  businessName: string;
}

const orderTypeLabel: Record<OrderType, string> = {
  [OrderType.DINE_IN]: 'Local',
  [OrderType.TAKEOUT]: 'Para Llevar',
  [OrderType.DELIVERY]: 'Delivery',
};

const paymentLabel: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Efectivo',
  [PaymentMethod.QR]: 'QR',
  [PaymentMethod.TRANSFER]: 'Transferencia',
  [PaymentMethod.CORTESIA]: 'Cortesía',
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('es-BO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function TicketModal({ isOpen, onClose, order, businessName }: Props) {
  const ticketRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = ticketRef.current?.innerHTML ?? '';
    const win = window.open('', '_blank', 'width=400,height=600');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Ticket #${order.orderNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; font-size: 11px; width: 48mm; padding: 2px; }
            @media print { @page { margin: 0; size: 58mm auto; } body { width: 48mm; } }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            .row { display: flex; justify-content: space-between; }
            .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin-top: 4px; }
            .footer { text-align: center; margin-top: 8px; font-size: 11px; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ticket de Venta">
      {/* Ticket preview */}
      <div
        ref={ticketRef}
        className="font-mono text-xs bg-white border border-dashed border-gray-300 rounded p-4 mb-4 max-w-xs mx-auto"
      >
        {/* Header */}
        <div className="center bold text-sm mb-1">{businessName}</div>
        <div className="center text-gray-500 mb-1">Ticket de Venta</div>
        <div className="divider" />

        {/* Order info */}
        <div className="row mb-1">
          <span>Pedido:</span>
          <span className="bold">#{order.orderNumber}</span>
        </div>
        <div className="row mb-1">
          <span>Fecha:</span>
          <span>{formatDateTime(order.createdAt)}</span>
        </div>
        <div className="row mb-1">
          <span>Tipo:</span>
          <span>{orderTypeLabel[order.type]}</span>
        </div>
        <div className="divider" />

        {/* Items */}
        <div className="mb-1 bold">Productos</div>
        {order.items.map((item) => (
          <div key={item.id} className="mb-1">
            <div>{item.productName}</div>
            <div className="row text-gray-600">
              <span>{item.quantity} x Bs {Number(item.unitPrice).toFixed(2)}</span>
              <span>Bs {Number(item.subtotal).toFixed(2)}</span>
            </div>
          </div>
        ))}
        <div className="divider" />

        {/* Total */}
        <div className="total-row">
          <span>TOTAL</span>
          <span>Bs {Number(order.total).toFixed(2)}</span>
        </div>
        <div className="row mt-1 text-gray-600">
          <span>Pago:</span>
          <span>{order.paymentMethod ? paymentLabel[order.paymentMethod] : '—'}</span>
        </div>
        <div className="divider" />

        {/* Footer */}
        <div className="footer text-gray-500">¡Gracias por su compra!</div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="secondary" fullWidth onClick={onClose}>
          Cerrar
        </Button>
        <Button fullWidth onClick={handlePrint}>
          Imprimir ticket
        </Button>
      </div>
    </Modal>
  );
}
