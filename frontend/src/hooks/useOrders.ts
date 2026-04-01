import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import type { OrderDto } from '@pos/shared';
import { ordersApi } from '../api/orders.api';

export function useOrders(date: string, statusFilter: string) {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      // Compute local-timezone UTC boundaries so orders aren't missed in UTC± offsets
      const localStart = new Date(date + 'T00:00:00');
      const localEnd = new Date(date + 'T23:59:59.999');
      const params: any = { from: localStart.toISOString(), to: localEnd.toISOString() };
      if (statusFilter) params.status = statusFilter;
      const data = await ordersApi.getAll(params);
      setOrders(data);
    } catch {
      toast.error('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, [date, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return { orders, setOrders, loading, fetchOrders };
}
