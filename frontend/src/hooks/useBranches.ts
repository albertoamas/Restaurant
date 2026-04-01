import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { branchesApi } from '../api/branches.api';
import type { BranchDto } from '@pos/shared';

export function useBranches() {
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    branchesApi
      .getAll()
      .then((data) => setBranches(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Error al cargar sucursales'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return { branches, setBranches, loading, reload: load };
}
