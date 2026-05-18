import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { CashSessionDto } from '@pos/shared';
import { cashSessionApi } from '../api/cash-session.api';
import { useSocketEvent } from '../context/socket.context';
import { queryKeys } from '../lib/query-keys';

export function useCashSession(branchId: string | null) {
  const queryClient = useQueryClient();

  const { data, isPending: loading, refetch } = useQuery({
    queryKey: branchId ? queryKeys.cashSession(branchId) : ['cashSession', null],
    queryFn:  () =>
      Promise.all([
        cashSessionApi.getCurrent(branchId!).catch(() => null),
        cashSessionApi.getHistory(branchId!).catch(() => [] as CashSessionDto[]),
      ]).then(([current, history]) => ({ current, history: history ?? [] })),
    enabled:         !!branchId,
    staleTime:       0,
    refetchInterval: 30_000,
  });

  const invalidate = useCallback(() => {
    if (branchId) queryClient.invalidateQueries({ queryKey: queryKeys.cashSession(branchId) });
  }, [queryClient, branchId]);

  useSocketEvent('cash.opened', invalidate);
  useSocketEvent('cash.closed', invalidate);

  return {
    session: data?.current  ?? null,
    history: data?.history  ?? [],
    loading,
    reload: refetch,
  };
}
