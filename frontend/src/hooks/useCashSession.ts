import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { CashSessionDto } from '@pos/shared';
import { SOCKET_EVENTS } from '@pos/shared';
import { cashSessionApi } from '../api/cash-session.api';
import { useSocket, useSocketEvent } from '../context/socket.context';
import { queryKeys } from '../lib/query-keys';

const FALLBACK_POLL_MS = 30_000;

export function useCashSession(branchId: string | null) {
  const queryClient     = useQueryClient();
  const { connected }   = useSocket();
  const wasConnectedRef = useRef<boolean | null>(null);

  const { data, isPending: loading, refetch } = useQuery({
    queryKey: branchId ? queryKeys.cashSession(branchId) : ['cashSession', null],
    queryFn:  () =>
      Promise.all([
        cashSessionApi.getCurrent(branchId!).catch(() => null),
        cashSessionApi.getHistory(branchId!).catch(() => [] as CashSessionDto[]),
      ]).then(([current, history]) => ({ current, history: history ?? [] })),
    enabled:         !!branchId,
    staleTime:       0,
    // Adaptive polling — only when socket is down (WebSocket is the primary channel)
    refetchInterval: connected ? false : FALLBACK_POLL_MS,
  });

  const invalidate = useCallback(() => {
    if (branchId) queryClient.invalidateQueries({ queryKey: queryKeys.cashSession(branchId) });
  }, [queryClient, branchId]);

  useSocketEvent(SOCKET_EVENTS.CASH_OPENED, invalidate);
  useSocketEvent(SOCKET_EVENTS.CASH_CLOSED, invalidate);

  // Catch-up on reconnection — refetch to recover events missed while offline
  useEffect(() => {
    if (wasConnectedRef.current === false && connected) {
      refetch();
    }
    wasConnectedRef.current = connected;
  }, [connected, refetch]);

  return {
    session: data?.current  ?? null,
    history: data?.history  ?? [],
    loading,
    reload: refetch,
  };
}
