import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { OrderStatus, SOCKET_EVENTS } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { ordersApi, type OrdersParams } from '../api/orders.api';
import { getBoliviaDayBounds, toBoliviaDateString } from '../utils/timezone';
import { useSocket, useSocketEvent } from '../context/socket.context';
import { queryKeys } from '../lib/query-keys';

const PAGE_SIZE        = 50;
const FALLBACK_POLL_MS = 30_000;

type OrdersPage = { data: OrderDto[]; total: number };
type OrdersInfinite = InfiniteData<OrdersPage, number>;

/**
 * Operational orders list for OrdersPage (Operación tab).
 *
 * Real-time strategy:
 *  - WebSocket events (`order.created`, `order.updated`) update the cache directly.
 *  - Polling every 30s only when the socket is disconnected (fallback).
 *  - On reconnection, refetches immediately (every page currently loaded) to recover events missed.
 *
 * The `setOrders` setter is preserved for backward compatibility with OrdersPage's optimistic
 * updates. It accepts an updater operating on the flat array and redistributes the result back
 * into the existing page structure (so subsequent `loadMore()` calls keep working).
 */
export function useOrders(date: string, statusFilter: string, branchId: string | null) {
  const queryClient     = useQueryClient();
  const { connected }   = useSocket();
  const wasConnectedRef = useRef<boolean | null>(null);

  const qk = useMemo(
    () => queryKeys.orders({ date, statusFilter, branchId }),
    [date, statusFilter, branchId],
  );

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

  const {
    data,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery<OrdersPage, Error, OrdersInfinite, ReturnType<typeof queryKeys.orders>, number>({
    queryKey:         qk,
    queryFn:          ({ pageParam }) => ordersApi.getAll(buildParams(pageParam)),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.data.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
    enabled:          !!branchId,
    refetchInterval:  connected ? false : FALLBACK_POLL_MS,
  });

  // Catch-up on reconnection — fetch all currently-loaded pages to recover events missed
  useEffect(() => {
    if (wasConnectedRef.current === false && connected) {
      refetch();
    }
    wasConnectedRef.current = connected;
  }, [connected, refetch]);

  // Flattened view of all loaded pages
  const orders = useMemo<OrderDto[]>(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data],
  );
  const total = data?.pages[0]?.total ?? 0;

  /**
   * Apply an updater over the flat orders array and redistribute the result back into the
   * existing page structure. Each original page keeps (up to) its original size; if the
   * updater removed items, trailing pages shrink first.
   *
   * Used by OrdersPage to apply optimistic updates after status changes / payments / edits.
   */
  const setOrders = useCallback<Dispatch<SetStateAction<OrderDto[]>>>((value) => {
    queryClient.setQueryData<OrdersInfinite>(qk, (old) => {
      if (!old) return old;
      const flat = old.pages.flatMap((p) => p.data);
      const next = typeof value === 'function'
        ? (value as (prev: OrderDto[]) => OrderDto[])(flat)
        : value;

      // Adjust total by the same delta to keep `hasMore` consistent
      const oldTotal = old.pages[0]?.total ?? 0;
      const newTotal = Math.max(0, oldTotal - (flat.length - next.length));

      // Redistribute respecting original page sizes; trailing items overflow the last page
      const newPages: OrdersPage[] = [];
      let cursor = 0;
      for (const oldPage of old.pages) {
        const slice = next.slice(cursor, cursor + oldPage.data.length);
        newPages.push({ data: slice, total: newTotal });
        cursor += oldPage.data.length;
      }
      if (cursor < next.length) {
        const last = newPages[newPages.length - 1];
        if (last) {
          last.data = [...last.data, ...next.slice(cursor)];
        } else {
          newPages.push({ data: next.slice(cursor), total: newTotal });
        }
      }

      return { pages: newPages, pageParams: old.pageParams };
    });
  }, [queryClient, qk]);

  // ── Socket handlers ────────────────────────────────────────────────────────
  const handleOrderCreated = useCallback((order: OrderDto) => {
    if (order.branchId !== branchId) return;
    const d = toBoliviaDateString(new Date(order.createdAt));
    if (d !== date) return;
    if (statusFilter && order.status !== statusFilter) return;

    queryClient.setQueryData<OrdersInfinite>(qk, (old) => {
      if (!old || old.pages.length === 0) return old;
      const newTotal = (old.pages[0]?.total ?? 0) + 1;
      const newPages = old.pages.map((p, i) =>
        i === 0
          ? { data: [order, ...p.data], total: newTotal }
          : { ...p, total: newTotal },
      );
      return { pages: newPages, pageParams: old.pageParams };
    });
  }, [branchId, date, statusFilter, queryClient, qk]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOrderUpdated = useCallback((order: OrderDto) => {
    queryClient.setQueryData<OrdersInfinite>(qk, (old) => {
      if (!old) return old;
      let removed = 0;
      const newPages = old.pages.map((page) => {
        const updated = page.data.map((o) => o.id === order.id ? order : o);
        const filtered = !statusFilter
          ? updated
          : updated.filter((o) => {
              const keep = o.status === statusFilter;
              if (!keep) removed += 1;
              return keep;
            });
        return { ...page, data: filtered };
      });
      const newTotal = Math.max(0, (old.pages[0]?.total ?? 0) - removed);
      newPages.forEach((p) => { p.total = newTotal; });
      return { pages: newPages, pageParams: old.pageParams };
    });
  }, [statusFilter, queryClient, qk]); // eslint-disable-line react-hooks/exhaustive-deps

  useSocketEvent<OrderDto>(SOCKET_EVENTS.ORDER_CREATED, handleOrderCreated);
  useSocketEvent<OrderDto>(SOCKET_EVENTS.ORDER_UPDATED, handleOrderUpdated);

  // ── Public actions (preserve exact signatures from the previous implementation) ─────
  // React Query's refetch/fetchNextPage resolve with a result (they don't throw); inspect
  // `isError` to preserve the original toast behavior on user-driven actions.
  const fetchOrders = useCallback(async () => {
    const result = await refetch();
    if (result.isError) toast.error('Error al cargar pedidos');
  }, [refetch]);

  const loadMore = useCallback(async () => {
    const result = await fetchNextPage();
    if (result.isError) toast.error('Error al cargar más pedidos');
  }, [fetchNextPage]);

  return {
    orders,
    setOrders,
    total,
    loading:     isPending && !!branchId,
    loadingMore: isFetchingNextPage,
    hasMore:     hasNextPage,
    fetchOrders,
    loadMore,
  };
}
