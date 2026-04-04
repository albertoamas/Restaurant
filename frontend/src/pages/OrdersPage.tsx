import { OrderStatus } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { ordersApi } from '../api/orders.api';
import { useSocketEvent } from '../context/socket.context';
import { Spinner } from '../components/ui/Spinner';
import { orderTypeLabels } from '../utils/order';
import { useOrders } from '../hooks/useOrders';
import { today } from '../utils/date';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { handleApiError } from '../utils/api-error';

const statusFilters = [
  { value: '', label: 'Todos' },
  { value: OrderStatus.PENDING, label: 'Pendientes' },
  { value: OrderStatus.PREPARING, label: 'Preparando' },
  { value: OrderStatus.DELIVERED, label: 'Entregados' },
];

const STEPS = [
  { status: OrderStatus.PENDING,   label: 'Recibido'  },
  { status: OrderStatus.PREPARING, label: 'Preparando' },
  { status: OrderStatus.DELIVERED, label: 'Entregado'  },
];

const stepIndex = (s: OrderStatus) => STEPS.findIndex((x) => x.status === s);

const statusAccent: Record<string, string> = {
  [OrderStatus.PENDING]:   'border-l-amber-400',
  [OrderStatus.PREPARING]: 'border-l-primary-400',
  [OrderStatus.DELIVERED]: 'border-l-emerald-400',
  [OrderStatus.CANCELLED]: 'border-l-gray-300',
};

const actionConfig: Record<string, { label: string; nextStatus: OrderStatus; color: string } | null> = {
  [OrderStatus.PENDING]:   { label: 'Iniciar preparación', nextStatus: OrderStatus.PREPARING, color: 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700' },
  [OrderStatus.PREPARING]: { label: 'Marcar como entregado', nextStatus: OrderStatus.DELIVERED, color: 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700' },
  [OrderStatus.DELIVERED]: null,
  [OrderStatus.CANCELLED]: null,
};

function OrderCard({ order, onStatusChange }: { order: OrderDto; onStatusChange: (id: string, s: OrderStatus) => void }) {
  const action = actionConfig[order.status];
  const currentStep = stepIndex(order.status);
  const isCancelled = order.status === OrderStatus.CANCELLED;

  return (
    <div className={[
      'bg-white/90 backdrop-blur-md rounded-2xl border border-white/70 shadow-[0_8px_24px_oklch(0.13_0.012_260/0.09)]',
      'overflow-hidden border-l-4 animate-fade',
      statusAccent[order.status] ?? 'border-l-gray-200',
      isCancelled ? 'opacity-60' : '',
    ].join(' ')}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-[linear-gradient(180deg,oklch(0.99_0.004_255),oklch(1_0_0/0))]">
        <div className="flex items-center gap-2.5">
          <span className="font-heading font-black text-2xl text-gray-900 leading-none">
            #{order.orderNumber}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {new Date(order.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg">
          {orderTypeLabels[order.type]}
        </span>
      </div>

      {/* Items */}
      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        {order.items.map((item) => (
          <span
            key={item.id}
            className="inline-flex items-center gap-1 text-xs bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-2.5 py-1"
          >
            <span className="font-heading font-bold text-gray-900">{item.quantity}×</span>
            {item.productName}
          </span>
        ))}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="px-4 pb-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1.5 rounded-xl">
            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            {order.notes}
          </span>
        </div>
      )}

      {/* Progress stepper */}
      {!isCancelled ? (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-0">
            {STEPS.map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <div key={step.status} className="flex items-center flex-1 last:flex-none">
                  {/* Circle */}
                  <div className="flex flex-col items-center gap-1">
                    <div className={[
                      'w-6 h-6 rounded-full flex items-center justify-center transition-all',
                      done
                        ? active
                          ? 'bg-primary-500 shadow-[0_0_0_3px_oklch(0.58_0.22_225/0.20)]'
                          : 'bg-primary-200'
                        : 'bg-gray-100 border-2 border-gray-200',
                    ].join(' ')}>
                      {done && !active && (
                        <svg className="w-3 h-3 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {active && <span className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className={`text-[10px] font-semibold whitespace-nowrap ${
                      done ? 'text-primary-600' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {/* Connector line */}
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mb-4 mx-1 rounded-full transition-all ${
                      i < currentStep ? 'bg-primary-300' : 'bg-gray-150'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="px-4 pb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancelado
          </span>
        </div>
      )}

      {/* Footer */}
      <div className={[
        'flex items-center gap-3 px-4 py-3 border-t border-gray-100/80 bg-[oklch(0.99_0.004_250)]',
        action ? 'flex-col sm:flex-row' : '',
      ].join(' ')}>
        <span className="font-heading font-black text-xl text-gray-900 shrink-0">
          Bs {order.total.toFixed(2)}
        </span>

        {action && (
          <div className="flex gap-2 w-full sm:flex-1">
            {/* Cancel */}
            <button
              onClick={() => onStatusChange(order.id, OrderStatus.CANCELLED)}
              className="px-3 py-2.5 text-xs font-semibold text-gray-500 border border-gray-200
                rounded-xl hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
            >
              Cancelar
            </button>
            {/* Primary action */}
            <button
              onClick={() => onStatusChange(order.id, action.nextStatus)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all
                active:scale-[0.97] ${action.color}`}
            >
              {action.label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function OrdersPage() {
  const [date, setDate] = useState(today());
  const [statusFilter, setStatusFilter] = useState('');
  const { orders, setOrders, loading, fetchOrders } = useOrders(date, statusFilter);

  useSocketEvent<OrderDto>('order.created', (order) => {
    const d = order.createdAt.split('T')[0];
    if (d !== date) return;
    if (statusFilter && order.status !== statusFilter) return;
    setOrders((prev) => [order, ...prev]);
  });

  useSocketEvent<OrderDto>('order.updated', (order) => {
    setOrders((prev) =>
      prev.map((o) => o.id === order.id ? order : o)
          .filter((o) => !statusFilter || o.status === statusFilter),
    );
  });

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      toast.success(newStatus === OrderStatus.CANCELLED ? 'Pedido cancelado' : 'Estado actualizado');
      fetchOrders();
    } catch (err) {
      handleApiError(err, 'Error al actualizar');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto animate-slide">
      {/* Toolbar */}
      <div className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_8px_24px_oklch(0.13_0.012_260/0.08)] p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="font-heading font-black text-xl text-gray-900">Gestión de Pedidos</h2>
            <p className="text-xs text-gray-500 mt-0.5">Monitorea y actualiza estados en tiempo real.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200 w-fit">
            {orders.length} pedidos
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white
              focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500
              shadow-[0_1px_2px_oklch(0.13_0.012_260/0.06)] transition-[border-color,box-shadow]"
          />
          <div className="flex gap-0.5 bg-[oklch(0.96_0.008_252)] rounded-xl p-1 overflow-x-auto">
            {statusFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-[9px] whitespace-nowrap transition-all duration-150 ${
                  statusFilter === f.value
                    ? 'bg-white text-gray-900 shadow-[0_1px_3px_oklch(0.13_0.012_260/0.10)]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <svg className="w-10 h-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm font-semibold text-gray-500">Sin pedidos</p>
          <p className="text-xs mt-1 text-gray-400">Cambia la fecha o filtros</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}
