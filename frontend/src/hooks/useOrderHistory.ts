import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { OrderDto, OrderStatus } from '@pos/shared';
import { ordersApi } from '../api/orders.api';
import { getBoliviaDayBounds } from '../utils/timezone';
import { queryKeys } from '../lib/query-keys';

const PAGE_SIZE = 50;

type HistoryPage = { data: OrderDto[]; total: number };

/**
 * Historial de pedidos por páginas: "Cargar más" trae la siguiente. Antes se pedían 100 de una
 * vez y el resto no se podía ver ("refina la búsqueda").
 */
export function useOrderHistory(params: {
  fromDate: string;
  toDate:   string;
  q:        string;
  status:   string;
  branchId: string | null;
}) {
  const { fromDate, toDate, q, status, branchId } = params;
  const { start: utcFrom } = getBoliviaDayBounds(fromDate);
  const { end:   utcTo   } = getBoliviaDayBounds(toDate);

  const { data, isPending, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: queryKeys.orderHistory({ from: utcFrom, to: utcTo, q, status, branchId }),
    queryFn:  ({ pageParam }): Promise<HistoryPage> => ordersApi.getAll({
      from:     utcFrom,
      to:       utcTo,
      q:        q || undefined,
      status:   (status as OrderStatus) || undefined,
      branchId: branchId ?? undefined,
      limit:    PAGE_SIZE,
      page:     pageParam,
    }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((n, p) => n + p.data.length, 0);
      return loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
    // Sin `enabled`: `branchId === null` es el consolidado del dueño, no
    // "todavía no eligió" — el backend omite el filtro de sucursal.
    staleTime: 30_000,
  });

  const orders = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

  const loadMore = async () => {
    const result = await fetchNextPage();
    if (result.isError) toast.error('Error al cargar más pedidos');
  };

  return {
    orders,
    total:       data?.pages[0]?.total ?? 0,
    loading:     isPending,
    loadingMore: isFetchingNextPage,
    hasMore:     hasNextPage,
    loadMore,
  };
}
