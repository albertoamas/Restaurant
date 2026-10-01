import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { CustomerStatsDto } from '@pos/shared';
import { useCustomers, type CustomerSortBy, type CustomerSortDir } from '../hooks/useCustomers';
import { useReportFilters, type Period } from '../hooks/useReportFilters';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { customersApi } from '../api/customers.api';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { Input, Select } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { PageShell } from '../components/ui/PageShell';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Skeleton } from '../components/ui/Skeleton';
import { CustomerSheet } from '../components/customers/CustomerSheet';
import { CustomerFormModal } from '../components/customers/CustomerFormModal';
import { formatBoliviaDateShort } from '../utils/date';
import { handleApiError } from '../utils/api-error';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'all',    label: 'Histórico' },
  { value: 'today',  label: 'Hoy' },
  { value: 'week',   label: 'Esta semana' },
  { value: 'month',  label: 'Este mes' },
  { value: 'custom', label: 'Rango' },
];

/** Opciones de "Ordenar por": en celular no hay encabezados de tabla que tocar. */
const SORTS: { value: string; label: string; by: CustomerSortBy; dir: CustomerSortDir }[] = [
  { value: 'name-asc',           label: 'Nombre (A a Z)',        by: 'name',          dir: 'asc'  },
  { value: 'totalSpent-desc',    label: 'Los que más gastaron',  by: 'totalSpent',    dir: 'desc' },
  { value: 'purchaseCount-desc', label: 'Los que más compraron', by: 'purchaseCount', dir: 'desc' },
];

const bs = (n: number) => `Bs ${n.toFixed(2)}`;
const lastPurchase = (c: CustomerStatsDto) => (c.lastOrderAt ? formatBoliviaDateShort(c.lastOrderAt) : '-');

function SortHeader({ label, by, sortBy, sortDir, onSort, align = 'left' }: {
  label: string; by: CustomerSortBy; sortBy: CustomerSortBy; sortDir: CustomerSortDir;
  onSort: (by: CustomerSortBy) => void; align?: 'left' | 'right';
}) {
  const active = sortBy === by;
  return (
    <th scope="col" aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'} className={`px-3 py-2.5 font-medium ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button
        type="button"
        onClick={() => onSort(by)}
        className={`inline-flex items-center gap-1 rounded-control transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 ${active ? 'text-main' : 'text-soft hover:text-main'}`}
      >
        {label}
        {active && <Icon name={sortDir === 'asc' ? 'chevron-up' : 'chevron-down'} size={14} />}
      </button>
    </th>
  );
}

export function CustomersPage() {
  // Clientes arranca en "Histórico": antes se forzaba después del primer render y los datos se pedían dos veces.
  const filters = useReportFilters('all');
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search.trim(), 350);

  const { customers, loading, setQ, reload, total, page, totalPages, setPage, sortBy, sortDir, setSort, setSortTo } = useCustomers(
    '',
    filters.period === 'all' ? undefined : filters.utcFrom,
    filters.period === 'all' ? undefined : filters.utcTo,
  );
  useEffect(() => { setQ(q); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const [selected, setSelected] = useState<CustomerStatsDto | null>(null);
  const [form, setForm]         = useState<{ open: boolean; customer: CustomerStatsDto | null }>({ open: false, customer: null });
  const [deleting, setDeleting] = useState<CustomerStatsDto | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const periodLabel = filters.period === 'all' ? 'En todo el historial' : `Del período: ${filters.rangeLabel}`;
  const sortValue = SORTS.find((s) => s.by === sortBy && s.dir === sortDir)?.value ?? '';

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await customersApi.delete(deleting.id);
      toast.success(`${deleting.name} eliminado de tus clientes`);
      setDeleting(null);
      reload();
    } catch (err) {
      handleApiError(err, 'Error al eliminar el cliente');
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Clientes"
        description="Lo gastado y las compras de cada cliente son del período elegido."
        actions={
          <Button onClick={() => setForm({ open: true, customer: null })}>
            <Icon name="plus" size={18} />
            Nuevo cliente
          </Button>
        }
      >
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
          <SegmentedControl label="Período" wrap value={filters.period} onChange={filters.setPeriod} options={PERIODS} />
          {filters.period === 'custom' && (
            <div className="grid grid-cols-2 gap-3 sm:w-80">
              <Input type="date" label="Desde" value={filters.customFrom} max={filters.customTo} onChange={(e) => filters.setCustomFrom(e.target.value)} />
              <Input type="date" label="Hasta" value={filters.customTo} min={filters.customFrom} onChange={(e) => filters.setCustomTo(e.target.value)} />
            </div>
          )}
        </div>
      </PageHeader>

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            aria-label="Buscar cliente"
            placeholder="Buscar por nombre o teléfono"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftAddon={<Icon name="search" size={18} />}
          />
        </div>
        <div className="sm:w-64">
          <Select
            aria-label="Ordenar por"
            value={sortValue}
            onChange={(e) => { const s = SORTS.find((x) => x.value === e.target.value); if (s) setSortTo(s.by, s.dir); }}
          >
            {!sortValue && <option value="">Orden personalizado</option>}
            {SORTS.map((s) => <option key={s.value} value={s.value}>Ordenar: {s.label}</option>)}
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3"><Skeleton variant="card" /><Skeleton variant="card" /></div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon="users"
          title={q ? `Ningún cliente con "${q}"` : 'Todavía no tienes clientes'}
          description={q ? 'Prueba con otro nombre o teléfono.' : 'Los clientes se crean aquí o al cobrar en el punto de venta.'}
          action={!q ? <Button onClick={() => setForm({ open: true, customer: null })}>Crear el primero</Button> : undefined}
        />
      ) : (
        <section className="overflow-hidden rounded-card border border-line bg-surface-card shadow-raised">
          {/* Celular: una fila por cliente, se toca para ver su ficha. */}
          <ul className="md:hidden divide-y divide-line">
            {customers.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => setSelected(c)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2 focus-visible:outline-none focus-visible:bg-surface-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="min-w-0 truncate text-body font-semibold text-main">{c.name}</p>
                      <p className="shrink-0 text-body font-bold text-main tabular-nums">{bs(c.totalSpent)}</p>
                    </div>
                    <p className="mt-0.5 text-caption text-muted">
                      {[c.phone, `${c.purchaseCount} ${c.purchaseCount === 1 ? 'compra' : 'compras'}`, c.lastOrderAt ? `Última compra ${lastPurchase(c)}` : null].filter(Boolean).join('. ')}
                    </p>
                  </div>
                  <Icon name="chevron-right" size={16} className="shrink-0 text-muted" />
                </button>
              </li>
            ))}
          </ul>

          {/* Tablet y escritorio: tabla ordenable; la fila entera abre la ficha. */}
          <table className="hidden md:table w-full text-body">
            <thead className="border-b border-line bg-surface-2 text-label">
              <tr>
                <SortHeader label="Cliente" by="name" sortBy={sortBy} sortDir={sortDir} onSort={setSort} />
                <SortHeader label="Gastado" by="totalSpent" sortBy={sortBy} sortDir={sortDir} onSort={setSort} align="right" />
                <SortHeader label="Compras" by="purchaseCount" sortBy={sortBy} sortDir={sortDir} onSort={setSort} align="right" />
                <th scope="col" className="px-3 py-2.5 text-right font-medium text-soft">Última compra</th>
                <th scope="col" className="w-10"><span className="sr-only">Ver ficha</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {customers.map((c) => (
                <tr key={c.id} onClick={() => setSelected(c)} className="cursor-pointer transition-colors hover:bg-surface-2">
                  <td className="px-3 py-3">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setSelected(c); }} className="text-left font-semibold text-main hover:underline focus-visible:outline-none focus-visible:underline">
                      {c.name}
                    </button>
                    <p className="text-caption text-muted">{c.phone ?? c.email ?? '-'}</p>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-main tabular-nums">{bs(c.totalSpent)}</td>
                  <td className="px-3 py-3 text-right text-main tabular-nums">{c.purchaseCount}</td>
                  <td className="px-3 py-3 text-right text-soft">{lastPurchase(c)}</td>
                  <td className="pr-3 text-right"><Icon name="chevron-right" size={16} className="inline text-muted" /></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-line px-4 py-3">
            <p className="text-label text-soft">
              {totalPages > 1 ? `Página ${page} de ${totalPages}. ` : ''}{total === 1 ? '1 cliente' : `${total} clientes`}
            </p>
            {totalPages > 1 && (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                  <Icon name="chevron-left" size={16} />
                  Anterior
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                  Siguiente
                  <Icon name="chevron-right" size={16} />
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {selected && (
        <CustomerSheet
          customer={selected}
          periodLabel={periodLabel}
          onClose={() => setSelected(null)}
          onEdit={() => { setForm({ open: true, customer: selected }); setSelected(null); }}
          onDelete={() => { setDeleting(selected); setSelected(null); }}
        />
      )}

      {form.open && (
        <CustomerFormModal customer={form.customer} onClose={() => setForm({ open: false, customer: null })} onSaved={reload} />
      )}

      <ConfirmModal
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={deleteBusy}
        variant="danger"
        title={deleting ? `Eliminar a ${deleting.name}` : 'Eliminar cliente'}
        message="Sus pedidos se conservan en los reportes, pero ya no quedan a su nombre. Esta acción no se puede deshacer."
        confirmLabel="Eliminar cliente"
        cancelLabel="Volver"
      />
    </PageShell>
  );
}
