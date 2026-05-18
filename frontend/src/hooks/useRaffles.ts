import { useQuery } from '@tanstack/react-query';
import type { RaffleDto } from '@pos/shared';
import { rafflesApi } from '../api/raffles.api';
import { queryKeys } from '../lib/query-keys';

export function useRaffles() {
  const { data: raffles = [] as RaffleDto[], isPending: loading, refetch } = useQuery({
    queryKey: queryKeys.raffles,
    queryFn:  () => rafflesApi.getAll(),
  });
  return { raffles, loading, reload: refetch };
}
