import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { OrderStatus } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { ordersApi, type OrdersParams } from '../api/orders.api';
import { getBoliviaDayBounds } from '../utils/timezone';
import { useSocketEvent } from '../context/socket.context';

const PAGE_SIZE = 50;

export function useOrders(date: string, statusFilter: string, branchId: string | null) {
  const [orders, setOrders]           = useState<OrderDto[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageRef                       = useRef(1);
  const abortRef                      = useRef<AbortController | null>(null);

  const buildParams = useCallback((p: number): OrdersParams => {
    const { start, end } = getBoliviaDayBounds(date);
    return {
      from:     start,
      to:       end,
      page:     p,
      limit:    PAGE_SIZE,
      branchId: branchId ?? undefined,
      ...(statusFilter ? { status: statusFilter as OrderStatus } : {}),
    };
  }, [date, statusFilter, branchId]);

  // Full refresh — always replaces the list and resets to page 1
  const fetchOrders = useCallback(async () => {
    if (!branchId) {
      setOrders([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;
    setLoading(true);
    try {
      const result = await ordersApi.getAll(buildParams(1));
      if (!signal.aborted) {
        setOrders(result.data);
        setTotal(result.total);
        pageRef.current = 1;
      }
    } catch {
      if (!signal.aborted) toast.error('Error al cargar pedidos');
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [buildParams, branchId]);

  // Append next page without replacing existing orders (user-triggered, no abort needed)
  const loadMore = useCallback(async () => {
    const nextPage = pageRef.current + 1;
    setLoadingMore(true);
    try {
      const result = await ordersApi.getAll(buildParams(nextPage));
      setOrders((prev) => [...prev, ...result.data]);
      setTotal(result.total);
      pageRef.current = nextPage;
    } catch {
      toast.error('Error al cargar más pedidos');
    } finally {
      setLoadingMore(false);
    }
  }, [buildParams]);

  // Initial load + polling every 30s as fallback to socket
  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, 30_000);
    return () => { clearInterval(id); abortRef.current?.abort(); };
  }, [fetchOrders]);

  const handleOrderCreated = useCallback((order: OrderDto) => {
    if (order.branchId !== branchId) return;
    const d = order.createdAt.split('T')[0];
    if (d !== date) return;
    if (statusFilter && order.status !== statusFilter) return;
    setOrders((prev) => [order, ...prev]);
  }, [branchId, date, statusFilter]);

  const handleOrderUpdated = useCallback((order: OrderDto) => {
    setOrders((prev) =>
      prev.map((o) => o.id === order.id ? order : o)
          .filter((o) => !statusFilter || o.status === statusFilter),
    );
  }, [statusFilter]);

  useSocketEvent<OrderDto>('order.created', handleOrderCreated);
  useSocketEvent<OrderDto>('order.updated', handleOrderUpdated);

  const hasMore = orders.length < total;

  return { orders, setOrders, total, loading, loadingMore, hasMore, fetchOrders, loadMore };
}
