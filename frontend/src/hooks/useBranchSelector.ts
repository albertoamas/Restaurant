/**
 * useBranchSelector — Lógica compartida para el selector de sucursal.
 *
 * Responsabilidades:
 * - Filtra las sucursales activas de `useBranches` (solo para OWNER)
 * - Auto-selecciona cuando hay exactamente una sucursal
 * - Permite la vista consolidada (`null` = todas las sucursales)
 * - Expone estado de apertura del dropdown
 * - Provee función `select` que aplica la selección y cierra el dropdown
 *
 * No gestiona el clearCart; esa lógica es de AppLayout
 * (depende del ciclo de vida del layout, no del selector).
 */

import { useState, useEffect, useMemo } from 'react';
import { useBranches } from './useBranches';
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
  const isOwner = user?.role === 'OWNER';
  // Misma consulta que la pantalla de Sucursales: crear o desactivar una se ve aquí sin recargar.
  const { branches: all, loading } = useBranches(isOwner);
  const branches = useMemo(() => all.filter((b) => b.isActive), [all]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOwner || loading) return;
    const currentIsValid = branches.some((b) => b.id === currentBranchId);
    const pinned         = localStorage.getItem(BRANCH_PINNED_KEY) === '1';

    if (branches.length === 1) {
      // Con una sola sucursal no hay nada que elegir: se fija sola.
      if (!currentIsValid) setCurrentBranch(branches[0].id);
    } else if (!pinned) {
      // La sucursal guardada venía de la auto-selección de cuando había una
      // sola. Con varias, el consolidado es el default correcto.
      if (currentBranchId !== null) setCurrentBranch(null);
    } else if (currentBranchId !== null && !currentIsValid) {
      // Eligió una sucursal que ya no existe o fue desactivada.
      setCurrentBranch(null);
    }
  }, [isOwner, loading, branches]); // eslint-disable-line react-hooks/exhaustive-deps

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
