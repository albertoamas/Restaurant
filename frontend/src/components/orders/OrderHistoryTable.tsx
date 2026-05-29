import { OrderStatus, PaymentMethod, BOLIVIA_TZ } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { statusAccent, statusLabel } from './OrderCard';
import { useReceiptSettings } from '../../hooks/useReceiptSettings';
import { Icon } from '../ui/Icon';
import { printReceipt, printKitchenTicket } from '../../utils/print';

const PAYMENT_LABEL: Record<string, string> = {
  [PaymentMethod.CASH]:     'Efectivo',
  [PaymentMethod.QR]:       'QR',
  [PaymentMethod.TRANSFER]: 'Transferencia',
  [PaymentMethod.CORTESIA]: 'Cortesía',
};

function formatDateCell(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const opts = { timeZone: BOLIVIA_TZ } as const;
  return {
    date: new Intl.DateTimeFormat('es-BO', { ...opts, day: '2-digit', month: 'short' }).format(d),
    time: new Intl.DateTimeFormat('es-BO', { ...opts, hour: '2-digit', minute: '2-digit' }).format(d),
  };
}

function itemsSummary(items: OrderDto['items']): string {
  const preview = items.slice(0, 2).map((i) => `${i.productName} ×${i.quantity}`).join(', ');
  const extra   = items.length - 2;
  return extra > 0 ? `${preview} +${extra} más` : preview;
}

function paymentSummary(order: OrderDto): string | null {
  if (!order.isPaid) return null;
  return order.payments.length > 1
    ? order.payments.map((p) => PAYMENT_LABEL[p.method] ?? p.method).join(' + ')
    : (PAYMENT_LABEL[order.payments[0]?.method] ?? '—');
}

/* ─── Row ────────────────────────────────────────────────────────────────── */

interface RowProps {
  order:           OrderDto;
  receiptSettings: ReturnType<typeof useReceiptSettings>;
  onPayOrder:      (order: OrderDto) => void;
  onEdit:          (order: OrderDto) => void;
}

function HistoryRow({ order, receiptSettings, onPayOrder, onEdit }: RowProps) {
  const accent      = statusAccent[order.status] ?? { badge: 'bg-gray-100 text-gray-500 border-gray-200' };
  const { date, time } = formatDateCell(order.createdAt);
  const isCancelled = order.status === OrderStatus.CANCELLED;
  const isDelivered = order.status === OrderStatus.DELIVERED;
  const payment     = paymentSummary(order);

  return (
    <tr className={`transition-colors hover:bg-gray-50/60 ${isCancelled ? 'opacity-50' : ''}`}>

      {/* # */}
      <td className="pl-4 pr-3 py-3.5 whitespace-nowrap">
        <span className="font-heading font-black text-[15px] text-primary-600 tabular-nums">
          #{order.orderNumber}
        </span>
      </td>

      {/* Fecha */}
      <td className="px-3 py-3.5 whitespace-nowrap">
        <p className="text-xs font-semibold text-gray-700 capitalize">{date}</p>
        <p className="text-[11px] text-gray-400 tabular-nums mt-0.5">{time}</p>
      </td>

      {/* Cliente — oculto en mobile */}
      <td className="px-3 py-3.5 hidden sm:table-cell max-w-[140px]">
        {order.customer
          ? <span className="text-sm text-gray-700 font-medium truncate block">{order.customer.name}</span>
          : <span className="text-xs text-gray-300 select-none">—</span>
        }
      </td>

      {/* Ítems — oculto en tablet y menor */}
      <td className="px-3 py-3.5 hidden md:table-cell max-w-[210px]">
        <p className="text-xs text-gray-500 truncate">{itemsSummary(order.items)}</p>
      </td>

      {/* Total */}
      <td className="px-3 py-3.5 whitespace-nowrap text-right">
        <span className="font-heading font-bold text-sm text-gray-900 tabular-nums">
          Bs {order.total.toFixed(2)}
        </span>
      </td>

      {/* Estado */}
      <td className="px-3 py-3.5 whitespace-nowrap">
        <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-lg border ${accent.badge}`}>
          {statusLabel[order.status]}
        </span>
      </td>

      {/* Pago — oculto en mobile */}
      <td className="px-3 py-3.5 hidden sm:table-cell whitespace-nowrap">
        {payment != null
          ? <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">{payment}</span>
          : <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
              Pendiente
            </span>
        }
      </td>

      {/* Acciones */}
      <td className="pl-2 pr-4 py-3.5">
        <div className="flex items-center justify-end gap-0.5">
          {!order.isPaid && !isCancelled && (
            <button onClick={() => onPayOrder(order)} title="Cobrar pedido"
              className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 transition-colors">
              <Icon name="cash" size={16} strokeWidth={2} />
            </button>
          )}
          {!isCancelled && !isDelivered && (
            <button onClick={() => onEdit(order)} title="Editar pedido"
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
              <Icon name="edit" size={16} strokeWidth={2} />
            </button>
          )}
          {!isCancelled && (
            <button onClick={() => printKitchenTicket(order)} title="Imprimir comanda"
              className="p-1.5 rounded-lg text-gray-400 hover:bg-orange-50 hover:text-orange-500 transition-colors">
              <Icon name="print" size={16} strokeWidth={2} />
            </button>
          )}
          {order.isPaid && (
            <button onClick={() => printReceipt(order, receiptSettings)} title="Imprimir recibo"
              className="p-1.5 rounded-lg text-gray-400 hover:bg-sky-500/10 hover:text-sky-300 transition-colors">
              <Icon name="document" size={16} strokeWidth={2} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ─── Table ──────────────────────────────────────────────────────────────── */

interface OrderHistoryTableProps {
  orders:     OrderDto[];
  total:      number;
  onPayOrder: (order: OrderDto) => void;
  onEdit:     (order: OrderDto) => void;
}

const TH = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <th className={`py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider ${className}`}>
    {children}
  </th>
);

export function OrderHistoryTable({ orders, total, onPayOrder, onEdit }: OrderHistoryTableProps) {
  const receiptSettings = useReceiptSettings();

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/70 shadow-[0_8px_24px_oklch(0.13_0.012_260/0.10)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[580px] border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <TH className="pl-4 pr-3 text-left">#</TH>
              <TH className="px-3 text-left">Fecha</TH>
              <TH className="px-3 text-left hidden sm:table-cell">Cliente</TH>
              <TH className="px-3 text-left hidden md:table-cell">Ítems</TH>
              <TH className="px-3 text-right">Total</TH>
              <TH className="px-3 text-left">Estado</TH>
              <TH className="px-3 text-left hidden sm:table-cell">Pago</TH>
              <TH className="pl-2 pr-4 text-right">Acciones</TH>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map((order) => (
              <HistoryRow
                key={order.id}
                order={order}
                receiptSettings={receiptSettings}
                onPayOrder={onPayOrder}
                onEdit={onEdit}
              />
            ))}
          </tbody>
        </table>
      </div>

      {total > orders.length && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 text-center">
          <p className="text-xs text-gray-400">
            Mostrando{' '}
            <span className="font-semibold text-gray-600">{orders.length}</span>
            {' '}de{' '}
            <span className="font-semibold text-gray-600">{total}</span>
            {' '}resultados — refina la búsqueda para ver más
          </p>
        </div>
      )}
    </div>
  );
}
