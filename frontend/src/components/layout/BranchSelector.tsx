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

/** `currentBranchId === null` significa "ver todas las sucursales juntas". */
const ALL_BRANCHES_LABEL = 'Todas las sucursales';

interface BranchSelectorProps {
  branches: BranchDto[];
  currentBranch: BranchDto | null;
  currentBranchId: string | null;
  isOpen: boolean;
  canSelect: boolean;
  onToggle: () => void;
  onSelect: (branchId: string | null) => void;
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
      : ALL_BRANCHES_LABEL;

  return (
    <>
      <button
        onClick={() => canSelect && onToggle()}
        className={[
          'w-full flex items-center justify-between gap-1.5 px-3 py-2',
          'rounded-control bg-surface-3 border border-line',
          'text-xs text-soft transition-colors',
          canSelect
            ? 'hover:bg-surface-card-hover hover:text-main cursor-pointer'
            : 'cursor-default',
        ].join(' ')}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon name="map-pin" size={12} strokeWidth={2} className="shrink-0 text-muted" />
          <span className="truncate">{label}</span>
        </div>
        {canSelect && (
          <Icon
            name="chevron-down"
            size={12}
            strokeWidth={2}
            className={`shrink-0 text-muted transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {isOpen && canSelect && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 rounded-card z-50 overflow-hidden animate-slide-down border border-line shadow-floating bg-surface-card"
        >
          <button
            onClick={() => onSelect(null)}
            className={[
              'w-full text-left px-3 py-2.5 text-xs hover:bg-surface-2 transition-colors',
              'flex items-center gap-2 border-b border-line',
              currentBranchId === null ? 'text-primary-500 font-semibold' : 'text-soft',
            ].join(' ')}
          >
            {currentBranchId === null
              ? <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
              : <Icon name="building" size={12} strokeWidth={2} className="shrink-0 text-muted" />}
            {ALL_BRANCHES_LABEL}
          </button>

          {branches.map((b) => (
            <button
              key={b.id}
              onClick={() => onSelect(b.id)}
              className={[
                'w-full text-left px-3 py-2.5 text-xs hover:bg-surface-2 transition-colors',
                'flex items-center gap-2',
                b.id === currentBranchId ? 'text-primary-500 font-semibold' : 'text-soft',
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
