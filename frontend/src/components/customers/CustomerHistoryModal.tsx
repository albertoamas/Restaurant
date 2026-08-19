import { useState, useEffect } from 'react';
import type { CustomerStatsDto, OrderDto } from '@pos/shared';
import { OrderType, OrderStatus, PaymentMethod } from '@pos/shared';
import { Modal } from '../ui/Modal';
import { Spinner } from '../ui/Spinner';
import { Icon } from '../ui/Icon';
import { ordersApi } from '../../api/orders.api';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  [OrderType.DINE_IN]: 'Mesa',
  [OrderType.TAKEOUT]: 'Para llevar',
  [OrderType.DELIVERY]: 'Delivery',
};

const STATUS_STYLE: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'bg-amber-500/12 text-amber-600',
  [OrderStatus.PREPARING]: 'bg-sky-500/12 text-sky-600',
  [OrderStatus.DELIVERED]: 'bg-[var(--color-surface-2)] text-gray-600',
  [OrderStatus.CANCELLED]: 'bg-red-500/12 text-red-500',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Pendiente',
  [OrderStatus.PREPARING]: 'Preparando',
  [OrderStatus.DELIVERED]: 'Entregado',
  [OrderStatus.CANCELLED]: 'Cancelado',
};

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Efectivo',
  [PaymentMethod.QR]: 'QR',
  [PaymentMethod.TRANSFER]: 'Transferencia',
  [PaymentMethod.CORTESIA]: 'Cortesía',
};

export function CustomerOrderHistory({ customerId }: { customerId: string }) {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.getAll({ customerId, limit: 50 }).then((r) => setOrders(r.data)).catch(() => setOrders([])).finally(() => setLoading(false));
  }, [customerId]);

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;
  if (orders.length === 0) return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-12 h-12 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center mb-3">
        <Icon name="bag" size={24} className="text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-500">Sin pedidos registrados</p>
    </div>
  );

  return (
    <div className="space-y-2.5 h-full overflow-y-auto pr-2 custom-scrollbar">
      {orders.map((o) => {
        const paymentText = o.payments?.length > 0
          ? o.payments.map((p) => PAYMENT_LABEL[p.method]).join(' + ')
          : o.paymentMethod ? PAYMENT_LABEL[o.paymentMethod] : null;

        return (
          <div key={o.id} className="bg-[var(--color-surface-2)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 hover:border-primary-500/30 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900 bg-white dark:bg-white/10 px-1.5 py-0.5 rounded-md shadow-sm border border-[var(--border-subtle)]">#{o.orderNumber}</span>
                <span className="text-[11px] font-medium text-gray-500 bg-[var(--color-surface-3)] px-1.5 py-0.5 rounded-md">{ORDER_TYPE_LABEL[o.type]}</span>
                {paymentText && <span className="text-[11px] font-medium text-gray-500">{paymentText}</span>}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLE[o.status]}`}>
                {STATUS_LABEL[o.status]}
              </span>
            </div>
            <div className="flex items-start justify-between mt-1.5">
              <p className="text-[13px] text-gray-600 leading-snug pr-4 whitespace-normal">
                {o.items.map((i) => `${i.quantity}× ${i.productName}`).join(', ')}
              </p>
              <p className="text-sm font-bold text-gray-900 shrink-0 ml-3 mt-0.5">Bs {o.total.toFixed(2)}</p>
            </div>
            <p className="text-[11px] font-medium text-gray-400 mt-1">{formatDate(o.createdAt)}</p>
          </div>
        );
      })}
    </div>
  );
}

export function CustomerHistoryModal({
  customer,
  onClose,
}: {
  customer: CustomerStatsDto;
  onClose: () => void;
}) {
  return (
    <Modal isOpen onClose={onClose} title={`Historial de ${customer.name}`} size="md">
      <div className="bg-[var(--color-surface-2)] border border-[var(--border-subtle)] rounded-2xl p-4 mb-5 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Última compra</p>
          <p className="text-sm font-semibold text-gray-900">{formatDate(customer.lastOrderAt)}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total Acumulado</p>
          <p className="text-base font-black text-primary-600 font-heading tracking-tight">Bs {customer.totalSpent.toFixed(2)}</p>
        </div>
      </div>

      <div className="h-[400px]">
        <CustomerOrderHistory customerId={customer.id} />
      </div>
    </Modal>
  );
}
