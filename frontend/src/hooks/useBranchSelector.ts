/**
 * useBranchSelector — Lógica compartida para el selector de sucursal.
 *
 * Responsabilidades:
 * - Carga y filtra sucursales activas (solo para OWNER)
 * - Auto-selecciona cuando hay exactamente una sucursal
 * - Expone estado de apertura del dropdown
 * - Provee función `select` que aplica la selección y cierra el dropdown
 *
 * No gestiona el clearCart; esa lógica es de AppLayout
 * (depende del ciclo de vida del layout, no del selector).
 */

import { useState, useEffect } from 'react';
import { branchesApi } from '../api/branches.api';
import { useAuth } from '../context/auth.context';
import type { BranchDto } from '@pos/shared';

export interface UseBranchSelectorReturn {
  branches: BranchDto[];
  currentBranch: BranchDto | null;
  currentBranchId: string | null;
  isOpen: boolean;
  canSelect: boolean;
  toggle: () => void;
  select: (branchId: string) => void;
  close: () => void;
}

export function useBranchSelector(): UseBranchSelectorReturn {
  const { user, currentBranchId, setCurrentBranch } = useAuth();
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [isOpen, setIsOpen]     = useState(false);

  useEffect(() => {
    if (user?.role !== 'OWNER') return;
    branchesApi.getAll().then((data) => {
      if (!Array.isArray(data)) return;
      const active = data.filter((b) => b.isActive);
      setBranches(active);
      const currentIsValid = active.some((b) => b.id === currentBranchId);
      if (active.length === 1 && !currentIsValid) {
        setCurrentBranch(active[0].id);
      }
    }).catch(() => {});
  }, [user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentBranch = branches.find((b) => b.id === currentBranchId) ?? null;
  const canSelect     = branches.length > 1;

  const toggle = () => setIsOpen((o) => !o);
  const close  = () => setIsOpen(false);

  const select = (branchId: string) => {
    setCurrentBranch(branchId);
    setIsOpen(false);
  };

  return { branches, currentBranch, currentBranchId, isOpen, canSelect, toggle, select, close };
}
