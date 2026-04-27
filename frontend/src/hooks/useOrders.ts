import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { OrderStatus } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { ordersApi, type OrdersParams } from '../api/orders.api';
import { getBoliviaDayBounds } from '../utils/timezone';

const PAGE_SIZE = 50;

export function useOrders(date: string, statusFilter: string, branchId: string | null) {
  const [orders, setOrders]           = useState<OrderDto[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageRef                       = useRef(1);

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
    setLoading(true);
    try {
      const result = await ordersApi.getAll(buildParams(1));
      setOrders(result.data);
      setTotal(result.total);
      pageRef.current = 1;
    } catch {
      toast.error('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, [buildParams, branchId]);

  // Append next page without replacing existing orders
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
    return () => clearInterval(id);
  }, [fetchOrders]);

  const hasMore = orders.length < total;

  return { orders, setOrders, total, loading, loadingMore, hasMore, fetchOrders, loadMore };
}
