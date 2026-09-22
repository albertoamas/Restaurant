/**
 * useBranchSelector — Lógica compartida para el selector de sucursal.
 *
 * Responsabilidades:
 * - Carga y filtra sucursales activas (solo para OWNER)
 * - Auto-selecciona cuando hay exactamente una sucursal
 * - Permite la vista consolidada (`null` = todas las sucursales)
 * - Expone estado de apertura del dropdown
 * - Provee función `select` que aplica la selección y cierra el dropdown
 *
 * No gestiona el clearCart; esa lógica es de AppLayout
 * (depende del ciclo de vida del layout, no del selector).
 */

import { useState, useEffect } from 'react';
import { branchesApi } from '../api/branches.api';
import { useAuth, BRANCH_PINNED_KEY } from '../context/auth.context';
import type { BranchDto } from '@pos/shared';

export interface UseBranchSelectorReturn {
  branches: BranchDto[];
  currentBranch: BranchDto | null;
  currentBranchId: string | null;
  isOpen: boolean;
  canSelect: boolean;
  toggle: () => void;
  /** `null` selecciona la vista consolidada de todas las sucursales. */
  select: (branchId: string | null) => void;
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
      const pinned         = localStorage.getItem(BRANCH_PINNED_KEY) === '1';

      if (active.length === 1) {
        // Con una sola sucursal no hay nada que elegir: se fija sola.
        if (!currentIsValid) setCurrentBranch(active[0].id);
      } else if (!pinned) {
        // La sucursal guardada venía de la auto-selección de cuando había una
        // sola. Con varias, el consolidado es el default correcto.
        if (currentBranchId !== null) setCurrentBranch(null);
      } else if (currentBranchId !== null && !currentIsValid) {
        // Eligió una sucursal que ya no existe o fue desactivada.
        setCurrentBranch(null);
      }
    }).catch(() => {});
  }, [user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentBranch = branches.find((b) => b.id === currentBranchId) ?? null;
  const canSelect     = branches.length > 1;

  const toggle = () => setIsOpen((o) => !o);
  const close  = () => setIsOpen(false);

  const select = (branchId: string | null) => {
    // A partir de acá la elección es del dueño y se respeta entre sesiones.
    localStorage.setItem(BRANCH_PINNED_KEY, '1');
    setCurrentBranch(branchId);
    setIsOpen(false);
  };

  return { branches, currentBranch, currentBranchId, isOpen, canSelect, toggle, select, close };
}
