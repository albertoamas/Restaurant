import { useState, useEffect, useCallback } from 'react';
import { OrderStatus } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { ordersApi } from '../api/orders.api';
import { useSocketEvent } from '../context/socket.context';
import { today } from '../utils/date';
import { handleApiError } from '../utils/api-error';

export function useKitchenOrders(branchId: string | null) {
  const [orders, setOrders] = useState<OrderDto[]>([]);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await ordersApi.getAll({ date: today(), branchId: branchId ?? undefined });
      setOrders(data.filter((o) =>
        o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING,
      ));
    } catch {
      // silently ignore — kitchen screen should not show error toasts on auto-refresh
    }
  }, [branchId]);

  // Initial load + fallback polling every 30s (WebSocket is primary)
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30_000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Handlers estables con useCallback para que useSocketEvent no re-registre
  // el listener en cada render (evita el frame sin listener durante off+on).
  const handleOrderCreated = useCallback((order: OrderDto) => {
    if (order.branchId !== branchId) return;
    if (order.status === OrderStatus.PENDING) {
      setOrders((prev) => [...prev, order]);
    }
  }, [branchId]);

  const handleOrderUpdated = useCallback((order: OrderDto) => {
    if (order.branchId !== branchId) return;
    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
    } else {
      setOrders((prev) => prev.map((o) => o.id === order.id ? order : o));
    }
  }, [branchId]);

  // Real-time via WebSocket
  useSocketEvent<OrderDto>('order.created', handleOrderCreated);
  useSocketEvent<OrderDto>('order.updated', handleOrderUpdated);

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      // Optimistic update
      setOrders((prev) =>
        newStatus === OrderStatus.DELIVERED
          ? prev.filter((o) => o.id !== orderId)
          : prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o),
      );
    } catch (err) {
      handleApiError(err, 'Error al actualizar');
      fetchOrders(); // re-sync on error
    }
  };

  const pending = orders.filter((o) => o.status === OrderStatus.PENDING);
  const preparing = orders.filter((o) => o.status === OrderStatus.PREPARING);

  return { orders, pending, preparing, updateStatus, refresh: fetchOrders };
}
