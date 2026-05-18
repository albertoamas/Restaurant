import { useQuery } from '@tanstack/react-query';
import type { PlanDto } from '@pos/shared';
import { plansApi } from '../api/plans.api';
import { queryKeys } from '../lib/query-keys';

export function usePlans() {
  const { data: plans = [] as PlanDto[], isPending: loading, isError: error } = useQuery({
    queryKey: queryKeys.plans,
    queryFn:  () => plansApi.getAll(),
    staleTime: 5 * 60_000,
  });
  return { plans, loading, error };
}
