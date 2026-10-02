import { useMemo, useState } from 'react';
import type { ExpenseDto } from '@pos/shared';
import { useExpenseMovements, useExpenseSummary } from '../../hooks/useExpenses';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Icon } from '../ui/Icon';
import { Input, Select } from '../ui/Input';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Skeleton } from '../ui/Skeleton';
import { Kpi, share } from '../report';
import { bs } from '../../utils/money';
import { chipClass } from '../ui/filter-chip';
import { CALENDAR_MAX_DAYS, ExpenseCalendar } from './ExpenseCalendar';
import { ExpenseList } from './ExpenseList';
import { eachDay, formatDayRange, mondayOf, today } from '../../utils/date';
import { getBoliviaDayBounds } from '../../utils/timezone';

type Period = 'today' | 'week' | 'month' | 'custom';
type View = 'list' | 'calendar';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'today',  label: 'Hoy' },
  { value: 'week',   label: 'Esta semana' },
  { value: 'month',  label: 'Este mes' },
  { value: 'custom', label: 'Rango' },
];

function lastDayOfMonth(day: string): string {
  const [y, m] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

/** Días del período en hora de Bolivia (no la del dispositivo). "Este mes" es el mes completo. */
function getRange(period: Period, customFrom: string, customTo: string) {
  const t = today();
  if (period === 'today') return { from: t, to: t };
  if (period === 'week')  return { from: mondayOf(t), to: t };
  if (period === 'month') return { from: `${t.slice(0, 7)}-01`, to: lastDayOfMonth(t) };
  return { from: customFrom, to: customTo };
}


/**
 * Revisar los gastos de un período: cifras del período completo, filtros que se aplican en el
 * servidor y la lista por día, de a 30 movimientos.
 */
export function ExpenseMovements({ branchId, onOpen }: { branchId?: string; onOpen: (e: ExpenseDto) => void }) {
  const [period, setPeriod]         = useState<Period>('month');
  const [customFrom, setCustomFrom] = useState(today);
  const [customTo, setCustomTo]     = useState(today);
  const [category, setCategory]     = useState('');
  const [search, setSearch]         = useState('');
  const [view, setView]             = useState<View>('list');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const q = useDebouncedValue(search.trim());

  const { from, to } = getRange(period, customFrom, customTo);
  const { start: utcFrom } = getBoliviaDayBounds(from);
  const { end:   utcTo   } = getBoliviaDayBounds(to);
  const { summary, loading: summaryLoading } = useExpenseSummary(utcFrom, utcTo, branchId);

  // Un día elegido en el calendario acota la lista a ese día.
  const listFrom = selectedDay ? getBoliviaDayBounds(selectedDay).start : utcFrom;
  const listTo   = selectedDay ? getBoliviaDayBounds(selectedDay).end   : utcTo;
  const { expenses, total, loading, loadingMore, hasMore, loadMore } =
    useExpenseMovements({ from: listFrom, to: listTo, branchId, category, q });

  const categories = useMemo(
    () => Object.entries(summary.byCategory).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]),
    [summary.byCategory],
  );
  const top = categories[0];
  const dayCount = from && to ? eachDay(from, to).length : 0;
  const filtered = category !== '' || q !== '' || selectedDay !== null;

  const changePeriod = (p: Period) => { setPeriod(p); setSelectedDay(null); };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
        <SegmentedControl label="Período" wrap value={period} onChange={changePeriod} options={PERIODS} />
        {period === 'custom' && (
          <div className="grid grid-cols-2 gap-3 sm:w-80">
            <Input type="date" label="Desde" value={customFrom} max={customTo} onChange={(e) => { setCustomFrom(e.target.value); setSelectedDay(null); }} />
            <Input type="date" label="Hasta" value={customTo} min={customFrom} onChange={(e) => { setCustomTo(e.target.value); setSelectedDay(null); }} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="max-sm:col-span-2">
          <Kpi label="Total gastado" value={summaryLoading ? '-' : bs(summary.total)} sub={formatDayRange(from, to)} />
        </div>
        <Kpi label="Movimientos" value={summaryLoading ? '-' : String(summary.transactionCount)} />
        <Kpi
          label="Categoría con más gasto"
          value={top ? top[0] : '-'}
          sub={top ? `${bs(top[1])}, ${Math.round(share(top[1], summary.total))}% del total` : undefined}
        />
      </div>

      <section className="overflow-hidden rounded-card border border-line bg-surface-card shadow-raised">
        <div className="space-y-3 px-4 pt-4 sm:px-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1">
              <Input
                aria-label="Buscar gastos"
                placeholder="Buscar gasto, proveedor o nota"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftAddon={<Icon name="search" size={18} />}
              />
            </div>
            {/* Celular y tablet: las categorías en un desplegable (en fila se cortaban). */}
            <div className="lg:hidden sm:w-64">
              <Select aria-label="Categoría" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Todas las categorías ({bs(summary.total)})</option>
                {categories.map(([cat, amount]) => <option key={cat} value={cat}>{cat} ({bs(amount)})</option>)}
              </Select>
            </div>
            <SegmentedControl
              label="Vista de gastos"
              value={view}
              onChange={setView}
              options={[{ value: 'list', label: 'Lista' }, { value: 'calendar', label: 'Calendario' }]}
            />
          </div>

          {categories.length > 0 && (
            <div role="group" aria-label="Filtrar por categoría" className="hidden lg:flex flex-wrap gap-2">
              <button type="button" aria-pressed={category === ''} className={chipClass(category === '')} onClick={() => setCategory('')}>
                Todas
              </button>
              {categories.map(([cat, amount]) => (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={category === cat}
                  className={chipClass(category === cat)}
                  onClick={() => setCategory(category === cat ? '' : cat)}
                >
                  {cat}
                  <span className={`tabular-nums ${category === cat ? 'text-white/80' : 'text-muted'}`}>{bs(amount)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedDay && (
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-line bg-surface-2 px-4 py-2 sm:px-5">
            <p className="text-label text-main">Solo el {formatDayRange(selectedDay, selectedDay)}</p>
            <Button variant="ghost" size="sm" onClick={() => setSelectedDay(null)}>
              <Icon name="x" size={14} />
              Ver todo el período
            </Button>
          </div>
        )}

        <div className="mt-3 border-t border-line">
          {view === 'calendar' ? (
            dayCount > CALENDAR_MAX_DAYS ? (
              <EmptyState compact icon="table" title="Período muy largo para el calendario" description="Elige hasta 2 meses para ver el calendario. La lista muestra cualquier período." />
            ) : (
              <ExpenseCalendar
                from={from}
                to={to}
                byDay={summary.byDay}
                selectedDay={selectedDay}
                onSelect={(day) => { setSelectedDay(day === selectedDay ? null : day); setView('list'); }}
              />
            )
          ) : loading ? (
            <div className="space-y-3 p-4 sm:p-5"><Skeleton variant="card" /><Skeleton variant="card" /></div>
          ) : expenses.length === 0 ? (
            <EmptyState
              compact
              icon="receipt"
              title={filtered ? 'Ningún gasto con estos filtros' : 'Sin gastos en este período'}
              description={filtered ? 'Prueba con otra categoría, otra búsqueda o todo el período.' : 'Los gastos se registran en la pestaña Registrar.'}
            />
          ) : (
            <>
              <ExpenseList expenses={expenses} onOpen={onOpen} grouped byDay={category || q ? undefined : summary.byDay} />
              <div className="flex flex-col items-center gap-2 border-t border-line px-4 py-4">
                <p className="text-label text-soft">Mostrando {expenses.length} de {total}</p>
                {hasMore && (
                  <Button variant="secondary" onClick={loadMore} loading={loadingMore}>
                    Cargar más ({total - expenses.length} restantes)
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
