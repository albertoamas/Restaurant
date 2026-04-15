import { OrderStatus } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { ordersApi } from '../api/orders.api';
import { useSocketEvent } from '../context/socket.context';
import { Spinner } from '../components/ui/Spinner';
import { useOrders } from '../hooks/useOrders';
import { today } from '../utils/date';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { handleApiError } from '../utils/api-error';
import { OrderCard } from '../components/orders/OrderCard';
import { PayOrderModal } from '../components/orders/PayOrderModal';
import { OrderSuccessModal } from '../components/pos/OrderSuccessModal';
import { EditOrderModal } from '../components/orders/EditOrderModal';

const statusFilters = [
  { value: '', label: 'Todos' },
  { value: OrderStatus.PENDING, label: 'Pendientes' },
  { value: OrderStatus.PREPARING, label: 'Preparando' },
  { value: OrderStatus.DELIVERED, label: 'Entregados' },
];

export function OrdersPage() {
  const [date, setDate] = useState(today());
  const [statusFilter, setStatusFilter] = useState('');
  const [payingOrder, setPayingOrder] = useState<OrderDto | null>(null);
  const [paidOrder, setPaidOrder] = useState<OrderDto | null>(null);
  const [editingOrder, setEditingOrder] = useState<OrderDto | null>(null);
  const { orders, setOrders, total, loading, loadingMore, hasMore, fetchOrders, loadMore } = useOrders(date, statusFilter);

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
            {total > orders.length ? `${orders.length} de ${total} pedidos` : `${total} pedidos`}
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
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
              onPayOrder={setPayingOrder}
              onEdit={setEditingOrder}
            />
          ))}
          {hasMore && (
            <div className="flex justify-center pt-2 pb-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_1px_3px_oklch(0.13_0.012_260/0.07)]"
              >
                {loadingMore ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    Cargando...
                  </>
                ) : (
                  <>
                    Cargar más
                    <span className="text-xs font-normal text-gray-400">({total - orders.length} restantes)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {payingOrder && (
        <PayOrderModal
          isOpen
          order={payingOrder}
          onClose={() => setPayingOrder(null)}
          onPaid={(order) => { setPayingOrder(null); setPaidOrder(order); fetchOrders(); }}
        />
      )}

      {paidOrder && (
        <OrderSuccessModal
          isOpen
          order={paidOrder}
          title="¡Cobro registrado!"
          onClose={() => setPaidOrder(null)}
        />
      )}

      {editingOrder && (
        <EditOrderModal
          isOpen
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSaved={(updated) => {
            setEditingOrder(null);
            setOrders((prev) => prev.map((o) => o.id === updated.id ? updated : o));
          }}
        />
      )}
    </div>
  );
}
