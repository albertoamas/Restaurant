import { useMemo } from 'react';
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

/**
 * Resuelve `branchId` → nombre de sucursal para las vistas consolidadas.
 * Devuelve `null` si la sucursal ya no existe, para que la UI pueda omitir
 * la etiqueta en lugar de mostrar un uuid.
 */
export function useBranchNames() {
  const { branches } = useBranches();
  const byId = useMemo(
    () => new Map(branches.map((b) => [b.id, b.name])),
    [branches],
  );
  return useMemo(
    () => ({ branchName: (id: string | null | undefined) => (id ? byId.get(id) ?? null : null) }),
    [byId],
  );
}
