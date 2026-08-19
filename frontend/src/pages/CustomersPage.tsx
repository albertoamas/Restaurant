import { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Icon } from '../components/ui/Icon';
import { useCustomers } from '../hooks/useCustomers';
import { useReportFilters } from '../hooks/useReportFilters';
import type { CustomerStatsDto } from '@pos/shared';

import { EditCustomerModal } from '../components/customers/EditCustomerModal';
import { CustomerHistoryModal } from '../components/customers/CustomerHistoryModal';
import { CreateCustomerModal } from '../components/customers/CreateCustomerModal';


// ── Sort header ───────────────────────────────────────────────────────────────

type SortBy = 'name' | 'totalSpent' | 'purchaseCount';
type SortDir = 'asc' | 'desc';

function SortHeader({
  label, col, sortBy, sortDir, onSort, align = 'left',
}: {
  label: string;
  col: SortBy;
  sortBy: SortBy;
  sortDir: SortDir;
  onSort: (col: SortBy) => void;
  align?: 'left' | 'right';
}) {
  const active = sortBy === col;
  return (
    <button
      onClick={() => onSort(col)}
      className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors select-none ${
        active ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'
      } ${align === 'right' ? 'justify-end w-full' : ''}`}
    >
      {label}
      <span className="flex flex-col gap-[1px]">
        <svg className={`w-2.5 h-2.5 ${active && sortDir === 'asc' ? 'text-primary-500' : 'text-gray-300'}`} viewBox="0 0 10 6" fill="currentColor">
          <path d="M5 0L10 6H0z" />
        </svg>
        <svg className={`w-2.5 h-2.5 ${active && sortDir === 'desc' ? 'text-primary-500' : 'text-gray-300'}`} viewBox="0 0 10 6" fill="currentColor">
          <path d="M5 6L0 0h10z" />
        </svg>
      </span>
    </button>
  );
}


// ── Main page ─────────────────────────────────────────────────────────────────

const PERIODS: { key: any; label: string }[] = [
  { key: 'all',    label: 'Histórico'    },
  { key: 'today',  label: 'Hoy'          },
  { key: 'week',   label: 'Esta semana'  },
  { key: 'month',  label: 'Este mes'     },
  { key: 'custom', label: 'Rango'        },
];

export function CustomersPage() {
  const filters = useReportFilters();
  
  // Set default period to 'all' if it's currently 'today' (which is the hook's default)
  useEffect(() => {
    if (filters.period === 'today') {
      filters.setPeriod('all');
    }
  }, []);

  const { customers, loading, q, setQ, reload, total, page, totalPages, setPage, sortBy, sortDir, setSort } = useCustomers(
    '',
    filters.period === 'all' ? undefined : filters.utcFrom,
    filters.period === 'all' ? undefined : filters.utcTo
  );
  
  const [editCustomer, setEditCustomer] = useState<CustomerStatsDto | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<CustomerStatsDto | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(val: string) {
    setSearchInput(val);
    if (searchTimer) clearTimeout(searchTimer);
    const t = setTimeout(() => setQ(val), 350);
    setSearchTimer(t);
  }

  const paginationBtn = 'px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border-subtle)] bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-card-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-gray-600';
  const paginationPage = (active: boolean) =>
    `w-8 h-8 text-xs font-medium rounded-lg border transition-colors ${
      active
        ? 'bg-primary-500 border-primary-500 text-white'
        : 'border-[var(--border-subtle)] bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-card-hover)] text-gray-600'
    }`;

  const pActive   = 'bg-primary-600 text-white border border-primary-600 shadow-[0_2px_8px_oklch(0.45_0.16_235/0.22)]';
  const pInactive = 'bg-[var(--color-surface-2)] border border-[var(--border-subtle)] text-gray-500 hover:border-primary-500/40 hover:text-primary-400';
  const dateInputCls = [
    'border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm bg-[var(--color-surface-card)] text-gray-700',
    'focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500/50 transition-[border-color,box-shadow]',
  ].join(' ');

  return (
    <div className="p-4 lg:p-6 animate-slide">
      {/* Header */}
      <div className="rounded-2xl border border-[var(--border-subtle)] shadow-card-xl p-4 sm:p-5 mb-5" style={{ background: 'var(--color-surface-card)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 font-heading">Clientes</h1>
            <p className="text-xs text-gray-500 mt-0.5">Historial de compras, tickets y fidelización.</p>
          </div>
          <Button variant="primary" onClick={() => setShowCreate(true)}>+ Nuevo cliente</Button>
        </div>
        
        {/* Period selector */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {PERIODS.map((p) => (
            <button key={p.key} onClick={() => filters.setPeriod(p.key)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${filters.period === p.key ? pActive : pInactive}`}>
              {p.label}
            </button>
          ))}
          {filters.period === 'custom' && (
            <div className="flex items-center gap-1.5 ml-2">
              <input type="date" value={filters.customFrom} onChange={(e) => filters.setCustomFrom(e.target.value)} className={dateInputCls} />
              <span className="text-gray-400 text-sm shrink-0">→</span>
              <input type="date" value={filters.customTo} onChange={(e) => filters.setCustomTo(e.target.value)} className={dateInputCls} />
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Icon name="search" size={16} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Buscar por nombre o teléfono..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-[var(--border-subtle)] rounded-xl bg-[var(--color-surface-card)] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-[border-color,box-shadow]"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center mx-auto mb-3">
            <Icon name="users" size={28} strokeWidth={1.5} className="text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            {q ? 'No se encontraron clientes' : 'Sin clientes registrados aún'}
          </p>
          {!q && (
            <button onClick={() => setShowCreate(true)} className="mt-2 text-sm text-primary-500 hover:text-primary-700 underline">
              Crear el primer cliente
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border-subtle)] shadow-card-lg overflow-hidden" style={{ background: 'var(--color-surface-card)' }}>
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-3 px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--color-surface-2)]">
            <SortHeader label="Nombre" col="name" sortBy={sortBy} sortDir={sortDir} onSort={setSort} />
            <SortHeader label="Gastado" col="totalSpent" sortBy={sortBy} sortDir={sortDir} onSort={setSort} align="right" />
            <SortHeader label="Compras" col="purchaseCount" sortBy={sortBy} sortDir={sortDir} onSort={setSort} align="right" />
            <span className="w-[88px] text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] text-center">Acciones</span>
          </div>

          {/* Rows */}
          {customers.map((c) => (
            <div
              key={c.id}
              className="w-full grid grid-cols-[2fr_1fr_1fr_auto] gap-3 px-4 py-3.5 border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors items-center"
            >
              <div className="min-w-0 pr-2">
                <p className="text-sm font-semibold text-[var(--color-text-main)] truncate">{c.name}</p>
                <p className="text-[13px] text-[var(--color-text-soft)] truncate">{c.phone ?? c.email ?? '—'}</p>
              </div>
              <p className="text-[14px] font-medium text-[var(--color-text-soft)] text-right">Bs {c.totalSpent.toFixed(0)}</p>
              <p className="text-[14px] font-bold text-[var(--color-text-main)] text-right">{c.purchaseCount}</p>
              
              <div className="flex items-center justify-end gap-1.5 w-[88px] shrink-0">
                <button
                  onClick={() => setHistoryCustomer(c)}
                  title="Historial de pedidos"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:text-primary-500 hover:bg-primary-500/10 transition-colors border border-transparent hover:border-primary-500/20 bg-[var(--color-surface-3)] hover:shadow-sm"
                >
                  <Icon name="document" size={16} strokeWidth={2} />
                </button>
                <button
                  onClick={() => setEditCustomer(c)}
                  title="Editar cliente"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:text-primary-500 hover:bg-primary-500/10 transition-colors border border-transparent hover:border-primary-500/20 bg-[var(--color-surface-3)] hover:shadow-sm"
                >
                  <Icon name="edit" size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-xs text-gray-500">
            Página {page} de {totalPages} · {total} clientes
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(page - 1)} disabled={page <= 1} className={paginationBtn}>
              ← Anterior
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pg: number;
              if (totalPages <= 7) {
                pg = i + 1;
              } else if (page <= 4) {
                pg = i + 1;
              } else if (page >= totalPages - 3) {
                pg = totalPages - 6 + i;
              } else {
                pg = page - 3 + i;
              }
              return (
                <button key={pg} onClick={() => setPage(pg)} className={paginationPage(pg === page)}>
                  {pg}
                </button>
              );
            })}
            <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className={paginationBtn}>
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {editCustomer && (
        <EditCustomerModal
          customer={editCustomer}
          onClose={() => setEditCustomer(null)}
          onUpdate={() => { reload(); setEditCustomer(null); }}
          onDeleted={() => { reload(); }}
        />
      )}

      {historyCustomer && (
        <CustomerHistoryModal
          customer={historyCustomer}
          onClose={() => setHistoryCustomer(null)}
        />
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateCustomerModal onClose={() => setShowCreate(false)} onCreated={reload} />
      )}
    </div>
  );
}
