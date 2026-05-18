import { useQuery } from '@tanstack/react-query';
import type { BranchDto } from '@pos/shared';
import { branchesApi } from '../api/branches.api';
import { queryKeys } from '../lib/query-keys';

export function useBranches() {
  const { data: branches = [] as BranchDto[], isPending: loading, refetch } = useQuery({
    queryKey: queryKeys.branches,
    queryFn:  () => branchesApi.getAll(),
  });
  return { branches, loading, reload: refetch };
}
