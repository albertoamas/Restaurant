/**
 * BranchSelector — UI del selector de sucursal (tema oscuro, sidebar/drawer).
 *
 * El padre debe envolver este componente en un `relative` para que el dropdown
 * se posicione correctamente. Ejemplo:
 *
 *   <div className="relative">
 *     <BranchSelector {...branchSelectorProps} />
 *   </div>
 *
 * La lógica de datos viene de `useBranchSelector()`.
 */

import { Icon } from '../ui/Icon';
import type { BranchDto } from '@pos/shared';

interface BranchSelectorProps {
  branches: BranchDto[];
  currentBranch: BranchDto | null;
  currentBranchId: string | null;
  isOpen: boolean;
  canSelect: boolean;
  onToggle: () => void;
  onSelect: (branchId: string) => void;
}

export function BranchSelector({
  branches,
  currentBranch,
  currentBranchId,
  isOpen,
  canSelect,
  onToggle,
  onSelect,
}: BranchSelectorProps) {
  const label = currentBranch
    ? currentBranch.name
    : branches.length === 0
      ? 'Sin sucursales'
      : 'Seleccionar sucursal';

  return (
    <>
      <button
        onClick={() => canSelect && onToggle()}
        className={[
          'w-full flex items-center justify-between gap-1.5 px-3 py-2',
          'rounded-xl bg-[var(--color-surface-3)] border border-[var(--border-subtle)]',
          'text-xs text-[var(--color-text-soft)] transition-colors',
          canSelect
            ? 'hover:bg-[var(--color-surface-card-hover)] hover:text-[var(--color-text-main)] cursor-pointer'
            : 'cursor-default',
        ].join(' ')}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon name="map-pin" size={12} strokeWidth={2} className="shrink-0 text-[var(--color-text-muted)]" />
          <span className="truncate">{label}</span>
        </div>
        {canSelect && (
          <Icon
            name="chevron-down"
            size={12}
            strokeWidth={2}
            className={`shrink-0 text-[var(--color-text-muted)] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {isOpen && canSelect && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 rounded-xl z-50 overflow-hidden animate-slide-down border border-[var(--border-subtle)] shadow-card-xl bg-[var(--color-surface-card)]"
        >
          {branches.map((b) => (
            <button
              key={b.id}
              onClick={() => onSelect(b.id)}
              className={[
                'w-full text-left px-3 py-2.5 text-xs hover:bg-[var(--color-surface-2)] transition-colors',
                'flex items-center gap-2',
                b.id === currentBranchId ? 'text-primary-500 font-semibold' : 'text-[var(--color-text-soft)]',
              ].join(' ')}
            >
              {b.id === currentBranchId && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
              )}
              {b.name}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
