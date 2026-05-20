import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { CustomerStatsDto } from '@pos/shared';
import { SOCKET_EVENTS } from '@pos/shared';
import { customersApi } from '../api/customers.api';
import { useSocketEvent } from '../context/socket.context';
import { queryKeys } from '../lib/query-keys';

const PAGE_SIZE = 50;

type SortBy  = 'name' | 'totalSpent' | 'purchaseCount';
type SortDir = 'asc' | 'desc';

export function useCustomers(initialQ = '') {
  const queryClient = useQueryClient();

  const [q, setQState]           = useState(initialQ);
  const [page, setPageState]     = useState(1);
  const [sortBy, setSortByState] = useState<SortBy>('name');
  const [sortDir, setSortDirState] = useState<SortDir>('asc');

  const params = { q, page, sortBy, sortDir };

  const { data, isPending: loading, refetch } = useQuery({
    queryKey: queryKeys.customers(params),
    queryFn:  () =>
      customersApi.getAll({ q: q || undefined, page, limit: PAGE_SIZE, sortBy, sortDir })
        .then((r): { data: CustomerStatsDto[]; total: number } => r),
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['customers'] });
  }, [queryClient]);

  useSocketEvent(SOCKET_EVENTS.CUSTOMER_CREATED, invalidate);
  useSocketEvent(SOCKET_EVENTS.CUSTOMER_UPDATED, invalidate);

  function setQ(value: string)    { setQState(value);    setPageState(1); }
  function setPage(pg: number)    { setPageState(pg); }
  function setSort(col: SortBy)   {
    if (col === sortBy) {
      setSortDirState((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortByState(col);
      setSortDirState('asc');
    }
    setPageState(1);
  }

  const total      = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return {
    customers: data?.data ?? [],
    loading,
    total,
    q,       setQ,
    page,    totalPages, setPage,
    sortBy,  sortDir,    setSort,
    reload:  refetch,
  };
}
