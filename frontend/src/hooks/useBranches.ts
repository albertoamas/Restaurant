import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { branchesApi } from '../api/branches.api';
import { useVisibilityRefresh } from './useVisibilityRefresh';
import type { BranchDto } from '@pos/shared';

export function useBranches() {
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    branchesApi
      .getAll()
      .then((data) => setBranches(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Error al cargar sucursales'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Refresh when returning to the tab
  useVisibilityRefresh(load);

  return { branches, setBranches, loading, reload: load };
}
