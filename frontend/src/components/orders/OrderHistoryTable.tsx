import { useState } from 'react';
import { OrderStatus, PaymentMethod, UserRole, BOLIVIA_TZ } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { statusAccent, statusLabel } from './OrderCard';
import { useReceiptSettings } from '../../hooks/useReceiptSettings';
import { useAuth } from '../../context/auth.context';
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
  order:            OrderDto;
  receiptSettings:  ReturnType<typeof useReceiptSettings>;
  isOwner:          boolean;
  onPayOrder:       (order: OrderDto) => void;
  onEdit:           (order: OrderDto) => void;
  onStatusChange:   (id: string, s: OrderStatus) => void;
}

function HistoryRow({ order, receiptSettings, isOwner, onPayOrder, onEdit, onStatusChange }: RowProps) {
  const accent      = statusAccent[order.status] ?? { badge: 'bg-[var(--color-surface-2)] text-gray-500 border-[var(--border-subtle)]' };
  const { date, time } = formatDateCell(order.createdAt);
  const isCancelled = order.status === OrderStatus.CANCELLED;
  const isDelivered = order.status === OrderStatus.DELIVERED;
  const isActive    = order.status === OrderStatus.PENDING || order.status === OrderStatus.PREPARING;
  const payment     = paymentSummary(order);

  const [confirming, setConfirming] = useState(false);
  const canCancel = !isCancelled && (isActive || (isDelivered && isOwner));

  return (
    <tr className={`transition-colors hover:bg-[var(--color-surface-2)] ${isCancelled ? 'opacity-50' : ''}`}>

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
          ? <span className="text-xs font-medium text-gray-600 bg-[var(--color-surface-2)] px-2 py-0.5 rounded-md">{payment}</span>
          : <span className="text-xs font-semibold text-amber-700 bg-amber-500/12 border border-amber-500/25 px-2 py-0.5 rounded-md">
              Pendiente
            </span>
        }
      </td>

      {/* Acciones */}
      <td className="pl-2 pr-4 py-3.5">
        <div className="flex items-center justify-end gap-0.5">
          {confirming ? (
            <>
              <span className="text-[11px] font-semibold text-red-400 mr-1 whitespace-nowrap">¿Cancelar?</span>
              <button
                onClick={() => { onStatusChange(order.id, OrderStatus.CANCELLED); setConfirming(false); }}
                className="px-2 py-1 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Sí
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="px-2 py-1 rounded-lg text-xs font-semibold text-gray-400 border border-[var(--border-subtle)] hover:border-gray-400/40 transition-colors"
              >
                No
              </button>
            </>
          ) : (
            <>
              {!order.isPaid && !isCancelled && (
                <button onClick={() => onPayOrder(order)} title="Cobrar pedido"
                  className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 transition-colors">
                  <Icon name="cash" size={16} strokeWidth={2} />
                </button>
              )}
              {!isCancelled && (order.status !== OrderStatus.DELIVERED || isOwner) && (
                <button onClick={() => onEdit(order)} title="Editar pedido"
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-[var(--color-surface-2)] hover:text-gray-600 transition-colors">
                  <Icon name="edit" size={16} strokeWidth={2} />
                </button>
              )}
              {!isCancelled && (
                <button onClick={() => printKitchenTicket(order)} title="Imprimir comanda"
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-primary-500/10 hover:text-orange-500 transition-colors">
                  <Icon name="print" size={16} strokeWidth={2} />
                </button>
              )}
              {order.isPaid && (
                <button onClick={() => printReceipt(order, receiptSettings)} title="Imprimir recibo"
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-sky-500/10 hover:text-sky-300 transition-colors">
                  <Icon name="document" size={16} strokeWidth={2} />
                </button>
              )}
              {canCancel && (
                <button onClick={() => setConfirming(true)} title="Cancelar pedido"
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                  <Icon name="x" size={16} strokeWidth={2} />
                </button>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ─── Table ──────────────────────────────────────────────────────────────── */

interface OrderHistoryTableProps {
  orders:         OrderDto[];
  total:          number;
  onPayOrder:     (order: OrderDto) => void;
  onEdit:         (order: OrderDto) => void;
  onStatusChange: (id: string, s: OrderStatus) => void;
}

const TH = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <th className={`py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider ${className}`}>
    {children}
  </th>
);

export function OrderHistoryTable({ orders, total, onPayOrder, onEdit, onStatusChange }: OrderHistoryTableProps) {
  const receiptSettings = useReceiptSettings();
  const { user } = useAuth();
  const isOwner = user?.role === UserRole.OWNER;

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] shadow-card-md overflow-hidden" style={{ background: 'var(--color-surface-card)' }}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[580px] border-collapse">
          <thead>
            <tr className="bg-[var(--color-surface-2)] border-b border-[var(--border-subtle)]">
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
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {orders.map((order) => (
              <HistoryRow
                key={order.id}
                order={order}
                receiptSettings={receiptSettings}
                isOwner={isOwner}
                onPayOrder={onPayOrder}
                onEdit={onEdit}
                onStatusChange={onStatusChange}
              />
            ))}
          </tbody>
        </table>
      </div>

      {total > orders.length && (
        <div className="px-4 py-3 border-t border-[var(--border-subtle)] bg-[var(--color-surface-2)] text-center">
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
