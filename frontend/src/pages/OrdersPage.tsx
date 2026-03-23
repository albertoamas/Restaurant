import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { OrderStatus, OrderType } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { ordersApi } from '../api/orders.api';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';
import { Button } from '../components/ui/Button';

const statusFilters = [
  { value: '', label: 'Todos' },
  { value: OrderStatus.PENDING, label: 'Pendientes' },
  { value: OrderStatus.PREPARING, label: 'Preparando' },
  { value: OrderStatus.DELIVERED, label: 'Entregados' },
];

const typeLabels: Record<string, string> = {
  [OrderType.DINE_IN]: 'Local',
  [OrderType.TAKEOUT]: 'Para Llevar',
  [OrderType.DELIVERY]: 'Delivery',
};

function today() {
  return new Date().toISOString().split('T')[0];
}

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [date, setDate] = useState(today());
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = { date };
      if (statusFilter) params.status = statusFilter;
      const data = await ordersApi.getAll(params);
      setOrders(data);
    } catch {
      toast.error('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [date, statusFilter]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      toast.success('Estado actualizado');
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al actualizar');
    }
  };

  const getNextStatus = (status: OrderStatus): OrderStatus | null => {
    if (status === OrderStatus.PENDING) return OrderStatus.PREPARING;
    if (status === OrderStatus.PREPARING) return OrderStatus.DELIVERED;
    return null;
  };

  const nextStatusLabel: Record<string, string> = {
    [OrderStatus.PREPARING]: 'Preparando',
    [OrderStatus.DELIVERED]: 'Entregado',
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === f.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">No hay pedidos</p>
          <p className="text-sm mt-1">Cambia la fecha o filtros para buscar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const next = getNextStatus(order.status);
            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-lg font-bold text-gray-900">
                      #{order.orderNumber}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {typeLabels[order.type]}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </div>

                <div className="text-sm text-gray-600 mb-2">
                  {order.items.map((item) => (
                    <span key={item.id} className="mr-3">
                      {item.quantity}x {item.productName}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">
                    S/ {order.total.toFixed(2)}
                  </span>
                  <div className="flex gap-2">
                    {next && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(order.id, next)}
                      >
                        Marcar {nextStatusLabel[next]}
                      </Button>
                    )}
                    {order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.DELIVERED && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleStatusChange(order.id, OrderStatus.CANCELLED)}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
