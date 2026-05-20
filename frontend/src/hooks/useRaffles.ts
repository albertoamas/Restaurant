import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { RaffleDto } from '@pos/shared';
import { SOCKET_EVENTS } from '@pos/shared';
import { rafflesApi } from '../api/raffles.api';
import { useSocketEvent } from '../context/socket.context';
import { queryKeys } from '../lib/query-keys';

export function useRaffles() {
  const queryClient = useQueryClient();

  const { data: raffles = [] as RaffleDto[], isPending: loading, refetch } = useQuery({
    queryKey: queryKeys.raffles,
    queryFn:  () => rafflesApi.getAll(),
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.raffles });
  }, [queryClient]);

  useSocketEvent(SOCKET_EVENTS.RAFFLE_CREATED, invalidate);
  useSocketEvent(SOCKET_EVENTS.RAFFLE_UPDATED, invalidate);
  useSocketEvent(SOCKET_EVENTS.RAFFLE_DELETED, invalidate);

  return { raffles, loading, reload: refetch };
}
