import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProductDto } from '@pos/shared';
import { SOCKET_EVENTS } from '@pos/shared';
import { productsApi } from '../api/products.api';
import { useSocketEvent } from '../context/socket.context';
import { queryKeys } from '../lib/query-keys';

export function useProducts(includeInactive = false, pageSize = 500) {
  const queryClient = useQueryClient();

  const [q, setQState]               = useState('');
  const [categoryId, setCategoryIdState] = useState<string | undefined>(undefined);
  const [page, setPageState]         = useState(1);

  const params = { q, categoryId, page, includeInactive, pageSize };

  const { data, isPending: loading, refetch } = useQuery({
    queryKey: queryKeys.products(params),
    queryFn:  () =>
      productsApi.getAll({ includeInactive, q: q || undefined, categoryId, page, limit: pageSize })
        .then((r): { data: ProductDto[]; total: number } => r),
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
  }, [queryClient]);

  useSocketEvent(SOCKET_EVENTS.PRODUCT_CREATED, invalidate);
  useSocketEvent(SOCKET_EVENTS.PRODUCT_UPDATED, invalidate);

  function setQ(value: string) { setQState(value); setPageState(1); }
  function setCategoryId(value: string | undefined) { setCategoryIdState(value); setPageState(1); }
  function setPage(pg: number) { setPageState(pg); }

  const totalPages = Math.ceil((data?.total ?? 0) / pageSize);

  return {
    products:   data?.data ?? [],
    total:      data?.total ?? 0,
    loading,
    reload:     refetch,
    page,
    totalPages,
    setPage,
    q,
    setQ,
    categoryId,
    setCategoryId,
  };
}
