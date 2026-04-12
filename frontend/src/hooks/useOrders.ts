import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { OrderStatus } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { ordersApi, type OrdersParams } from '../api/orders.api';
import { getBoliviaDayBounds } from '../utils/timezone';

export function useOrders(date: string, statusFilter: string) {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      // Límites exactos del día en Bolivia (UTC-4), independiente del timezone del dispositivo
      const { start, end } = getBoliviaDayBounds(date);
      const params: OrdersParams = {
        from: start,
        to:   end,
        ...(statusFilter ? { status: statusFilter as OrderStatus } : {}),
      };
      const data = await ordersApi.getAll(params);
      setOrders(data);
    } catch {
      toast.error('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, [date, statusFilter]);

  // Initial load + polling every 30s as fallback to socket
  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, 30_000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  return { orders, setOrders, loading, fetchOrders };
}
