import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { UserRole } from '@pos/shared';
import type { ExpenseDto } from '@pos/shared';
import { expensesApi } from '../api/expenses.api';
import { reportsApi } from '../api/reports.api';
import { useExpenses } from '../hooks/useExpenses';
import { useAuth } from '../context/auth.context';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { Icon } from '../components/ui/Icon';
import type { IconName } from '../components/ui/Icon';
import { PageShell } from '../components/ui/PageShell';
import { ExpenseFormModal } from '../components/expenses/ExpenseFormModal';
import { handleApiError } from '../utils/api-error';
import { today } from '../utils/date';
import { getBoliviaDayBounds, toBoliviaDateString } from '../utils/timezone';

type Period = 'today' | 'week' | 'month' | 'custom';

function getRange(period: Period, customFrom: string, customTo: string): { from: string; to: string } {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const todayStr = fmt(d);
  if (period === 'today') return { from: todayStr, to: todayStr };
  if (period === 'week') {
    const day = d.getDay() || 7;
    const mon = new Date(d); mon.setDate(d.getDate() - day + 1);
    return { from: fmt(mon), to: todayStr };
  }
  if (period === 'month') {
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return { from: fmt(first), to: fmt(last) };
  }
  return { from: customFrom, to: customTo };
}

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today',  label: 'Hoy' },
  { key: 'week',   label: 'Esta semana' },
  { key: 'month',  label: 'Este mes' },
  { key: 'custom', label: 'Rango' },
];

/** Derives a display label for an expense — category of first item, or legacy category. */
function expenseCategoryLabel(expense: ExpenseDto): string {
  if (expense.items.length > 0) {
    const firstName = expense.items[0].categoryName;
    if (firstName) return firstName;
  }
  const LEGACY: Record<string, string> = {
    SUPPLIES: 'Insumos', WAGES: 'Personal', UTILITIES: 'Servicios',
    TRANSPORT: 'Transporte', MAINTENANCE: 'Mantenimiento', OTHER: 'Otro',
  };
  return LEGACY[expense.category] ?? expense.category;
}

const CAT_COLORS = [
  { bg: 'bg-sky-500/12',   text: 'text-sky-600',    border: 'border-sky-500/25'    },
  { bg: 'bg-amber-500/12', text: 'text-amber-600',  border: 'border-amber-500/25'   },
  { bg: 'bg-violet-500/12', text: 'text-violet-600', border: 'border-violet-500/25'  },
  { bg: 'bg-emerald-500/12', text: 'text-emerald-600', border: 'border-emerald-500/25' },
  { bg: 'bg-rose-500/12',   text: 'text-rose-600',   border: 'border-rose-500/25'   },
  { bg: 'bg-cyan-500/12',   text: 'text-cyan-600',   border: 'border-cyan-500/25'   },
  { bg: 'bg-orange-500/12', text: 'text-orange-600', border: 'border-orange-500/25' },
];

function categoryColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return CAT_COLORS[h % CAT_COLORS.length];
}

export function ExpensesPage() {
  const { currentBranchId, user } = useAuth();
  const [period, setPeriod] = useState<Period>('month');
  const [customFrom, setCustomFrom] = useState(today);
  const [customTo, setCustomTo] = useState(today);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseDto | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [totalSales, setTotalSales] = useState<number | null>(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [view, setView] = useState<'activity' | 'calendar'>('activity');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { from, to } = getRange(period, customFrom, customTo);
  const rangeLabel = from === to ? from : `${from} → ${to}`;
  const branchParam = user?.role === UserRole.OWNER ? (currentBranchId ?? undefined) : undefined;

  const { start: utcFrom } = getBoliviaDayBounds(from);
  const { end:   utcTo   } = getBoliviaDayBounds(to);

  const { expenses, summary, loading, reload } = useExpenses(utcFrom, utcTo, branchParam);

  useEffect(() => {
    setSalesLoading(true);
    reportsApi
      .getByRange(utcFrom, utcTo, branchParam)
      .then((r) => setTotalSales(r.totalSales))
      .catch(() => setTotalSales(null))
      .finally(() => setSalesLoading(false));
  }, [utcFrom, utcTo, currentBranchId]);

  const handleDelete = async (id: string) => {
    try {
      await expensesApi.void(id);
      toast.success('Gasto anulado. El registro se conserva en el historial.');
      reload();
    } catch (err) {
      handleApiError(err, 'Error al eliminar');
    }
  };

  const periodResult = totalSales !== null ? totalSales - summary.total : null;
  const expenseRatio = totalSales && totalSales > 0 ? (summary.total / totalSales) * 100 : null;
  const activeClass   = 'bg-primary-600 text-white border border-primary-600 shadow-[0_2px_8px_oklch(0.45_0.16_235/0.22)]';
  const inactiveClass = 'bg-[var(--color-surface-2)] border border-[var(--border-subtle)] text-gray-500 hover:border-primary-500/40 hover:text-primary-400';

  const summaryCategories = Object.entries(summary.byCategory)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  const filteredExpenses = useMemo(() => expenses.filter((expense) => {
    const matchesCategory = !selectedCategory || expense.items.some((item) =>
      (item.categoryName ?? expenseCategoryLabel(expense)) === selectedCategory,
    );
    const matchesDay = !selectedDay || toBoliviaDateString(new Date(expense.expenseDate)) === selectedDay;
    return matchesCategory && matchesDay;
  }), [expenses, selectedCategory, selectedDay]);

  const dateInputCls = [
    'border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm bg-[var(--color-surface-card)] text-gray-700',
    'focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500/50 transition-[border-color,box-shadow]',
  ].join(' ');

  return (
    <PageShell>
      <div className="relative overflow-hidden rounded-[28px] border border-stone-200 bg-[#1d2a24] p-5 text-white shadow-[0_18px_50px_rgba(27,42,34,0.18)] sm:p-7 mb-5">
        <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full border-[34px] border-amber-400/10" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300">Control operativo</p>
            <h2 className="font-heading text-2xl sm:text-3xl font-black tracking-tight">Gastos, sin perder el hilo</h2>
            <p className="text-sm text-white/60 mt-1">Registra el día real, revisa patrones y mantén cada comprobante localizable.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-semibold text-white/80">
              {rangeLabel}
            </span>
            <Button size="sm" onClick={() => setShowModal(true)}>+ Agregar gasto</Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-4">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  period === p.key ? 'border-amber-300 bg-amber-300 text-stone-900' : 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
          {period === 'custom' && (
            <>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className={`${dateInputCls} !border-white/15 !bg-white/10 !text-white`} />
              <span className="text-gray-400 text-sm shrink-0">→</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className={`${dateInputCls} !border-white/15 !bg-white/10 !text-white`} />
            </>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 mb-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border-subtle)] shadow-card-md p-4 flex flex-col gap-2" style={{ background: 'var(--color-surface-card)' }}>
          <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
            <Icon name="minus" size={16} />
          </div>
          <p className="text-xs font-medium text-gray-400">Total Gastos</p>
          <p className="font-heading font-black text-lg text-red-600 leading-tight">
            Bs {summary.total.toFixed(2)}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] shadow-card-md p-4 flex flex-col gap-2" style={{ background: 'var(--color-surface-card)' }}>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <Icon name="dollar" size={16} />
          </div>
          <p className="text-xs font-medium text-gray-400">Ventas</p>
          <p className="font-heading font-black text-lg text-emerald-600 leading-tight">
            {salesLoading ? '…' : totalSales !== null ? `Bs ${totalSales.toFixed(2)}` : '—'}
          </p>
        </div>

        <div className={`rounded-2xl border shadow-[0_1px_4px_oklch(0.13_0.012_260/0.07)] p-4 flex flex-col gap-2 ${
          periodResult !== null && periodResult >= 0
            ? 'bg-emerald-50 border-emerald-200'
            : periodResult !== null
            ? 'bg-red-50 border-red-200'
            : 'bg-[var(--color-surface-2)] border-[var(--border-subtle)]'
        }`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            periodResult !== null && periodResult >= 0 ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-500'
          }`}>
            <Icon name="chart" size={16} />
          </div>
          <p className="text-xs font-medium text-gray-500">Ventas menos gastos</p>
          <p className={`font-heading font-black text-lg leading-tight ${
            periodResult !== null && periodResult >= 0 ? 'text-emerald-700' : 'text-red-600'
          }`}>
            {periodResult !== null ? `Bs ${periodResult.toFixed(2)}` : '—'}
          </p>
          <p className="text-[10px] text-gray-400">{expenseRatio !== null ? `${expenseRatio.toFixed(1)}% de las ventas` : `${summary.transactionCount} movimientos`}</p>
        </div>
      </div>

      {/* Category filter chips */}
      {summaryCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
              selectedCategory === '' ? activeClass : inactiveClass
            }`}
          >
            Todas
          </button>
          {summaryCategories.map(([cat, total]) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                selectedCategory === cat ? activeClass : inactiveClass
              }`}
            >
              {cat}
              <span className={`ml-1.5 text-[11px] ${selectedCategory === cat ? 'opacity-80' : 'text-gray-400'}`}>
                Bs {total.toFixed(2)}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface-2)] p-1">
          <ViewButton active={view === 'activity'} onClick={() => setView('activity')} icon="receipt" label="Movimientos" />
          <ViewButton active={view === 'calendar'} onClick={() => setView('calendar')} icon="table" label="Calendario" />
        </div>
        {selectedDay && (
          <button onClick={() => setSelectedDay(null)} className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700">
            <Icon name="x" size={13} /> Ver todo el período
          </button>
        )}
      </div>

      {view === 'calendar' && (
        <ExpenseCalendar
          from={from}
          to={to}
          byDay={summary.byDay}
          selectedDay={selectedDay}
          onSelect={(day) => { setSelectedDay(day === selectedDay ? null : day); setView('activity'); }}
        />
      )}

      {/* Expense list */}
      {view === 'activity' && (loading ? (
        <div className="space-y-3">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Icon name="receipt" size={40} strokeWidth={1.5} className="mb-3 opacity-40" />
          <p className="text-sm font-semibold text-gray-500">Sin gastos registrados</p>
          <p className="text-xs mt-1">Agrega el primer gasto del período</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border-subtle)] shadow-card-md overflow-hidden" style={{ background: 'var(--color-surface-card)' }}>
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[90px_1fr_100px_60px] gap-4 px-5 py-2.5 bg-[var(--color-surface-2)] border-b border-[var(--border-subtle)]">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Fecha</span>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Detalle</span>
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-right">Total</span>
            <span />
          </div>
          {filteredExpenses.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              isDeleting={deletingId === expense.id}
              onEdit={() => { setEditingExpense(expense); setShowModal(true); }}
              onDelete={() => { handleDelete(expense.id); setDeletingId(null); }}
              onConfirmDelete={() => setDeletingId(expense.id)}
              onCancelDelete={() => setDeletingId(null)}
            />
          ))}
        </div>
      ))}

      <ExpenseFormModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingExpense(null); }}
        onSaved={reload}
        expense={editingExpense ?? undefined}
      />
    </PageShell>
  );
}

function ViewButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: IconName; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}
    >
      <Icon name={icon} size={14} /> {label}
    </button>
  );
}

function ExpenseCalendar({
  from, to, byDay, selectedDay, onSelect,
}: {
  from: string;
  to: string;
  byDay: Record<string, number>;
  selectedDay: string | null;
  onSelect: (day: string) => void;
}) {
  const days: string[] = [];
  const cursor = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  while (cursor <= end && days.length < 62) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, '0');
    const day = String(cursor.getDate()).padStart(2, '0');
    days.push(`${year}-${month}-${day}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  const max = Math.max(1, ...Object.values(byDay));
  const firstOffset = (new Date(`${days[0] ?? from}T12:00:00`).getDay() + 6) % 7;

  return (
    <section className="mb-5 overflow-hidden rounded-[24px] border border-stone-200 bg-[#fbfaf6] shadow-card-md">
      <div className="flex flex-col justify-between gap-2 border-b border-stone-200 px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-heading text-lg font-black text-stone-900">Pulso diario</h3>
          <p className="text-xs text-stone-500">La intensidad muestra dónde se concentra el gasto. Selecciona un día para ver sus movimientos.</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
          Menor <span className="h-2.5 w-16 rounded-full bg-gradient-to-r from-amber-100 via-amber-300 to-orange-600" /> Mayor
        </div>
      </div>
      <div className="overflow-x-auto p-4 sm:p-5">
        <div className="min-w-[620px]">
          <div className="mb-2 grid grid-cols-7 gap-2">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((label) => (
              <div key={label} className="px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">{label}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstOffset }).map((_, index) => <div key={`blank-${index}`} />)}
            {days.map((day) => {
              const amount = byDay[day] ?? 0;
              const intensity = amount / max;
              const dayNumber = Number(day.slice(-2));
              const active = day === selectedDay;
              const background = amount === 0
                ? 'rgba(255,255,255,0.8)'
                : `color-mix(in oklab, #f59e0b ${Math.round(20 + intensity * 62)}%, #fff7ed)`;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => amount > 0 && onSelect(day)}
                  disabled={amount === 0}
                  style={{ background }}
                  className={`min-h-20 rounded-2xl border p-2.5 text-left transition ${active ? 'border-stone-900 ring-2 ring-stone-900/10' : 'border-stone-200/80'} ${amount > 0 ? 'hover:-translate-y-0.5 hover:shadow-md' : 'cursor-default opacity-55'}`}
                >
                  <span className="text-xs font-black text-stone-700">{dayNumber}</span>
                  <span className={`mt-4 block text-xs font-black tabular-nums ${intensity > 0.55 ? 'text-stone-900' : 'text-stone-600'}`}>
                    {amount > 0 ? `Bs ${amount.toFixed(0)}` : '—'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function ExpenseRow({
  expense, isDeleting, onEdit, onDelete, onConfirmDelete, onCancelDelete,
}: {
  expense: ExpenseDto;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  const date       = new Date(expense.expenseDate);
  const dateStr    = date.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' });
  const timeStr    = date.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
  const hasItems   = expense.items.length > 0;
  const legacyLabel = expenseCategoryLabel(expense);
  const legacyCol  = categoryColor(legacyLabel);

  return (
    <div className={`group grid grid-cols-[70px_minmax(0,1fr)_auto] gap-3 px-4 py-4 border-t border-[var(--border-subtle)] transition-colors sm:grid-cols-[90px_1fr_100px_60px] sm:gap-4 sm:px-5
      ${isDeleting ? 'bg-red-50/40' : 'hover:bg-[var(--color-surface-2)]'}`}
    >
      {/* Date */}
      <div className="flex flex-col pt-0.5">
        <span className="text-sm font-semibold text-gray-800 leading-tight">{dateStr}</span>
        <span className="text-xs text-gray-400 mt-0.5">{timeStr}</span>
      </div>

      {/* Detail */}
      <div className="min-w-0">
        {hasItems ? (
          <div className="space-y-2">
            {expense.items.map((item) => {
              const catName = item.categoryName ?? legacyLabel;
              const col = categoryColor(catName);
              const qty = Number(item.quantity);
              const isMultiple = qty !== 1;
              return (
                <div key={item.id} className="flex items-center gap-2 min-w-0">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border shrink-0 ${col.bg} ${col.text} ${col.border}`}>
                    {catName}
                  </span>
                  <span className="text-sm font-medium text-gray-800 flex-1 min-w-0 truncate">{item.name}</span>
                  {isMultiple && (
                    <span className="text-xs text-gray-400 shrink-0 tabular-nums">
                      {qty % 1 === 0 ? qty : qty.toFixed(3)}{item.unit ? ` ${item.unit}` : ''} × Bs {item.unitPrice.toFixed(2)}
                    </span>
                  )}
                  <span className={`text-xs font-bold shrink-0 tabular-nums ${col.text}`}>
                    Bs {item.totalPrice.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border shrink-0 ${legacyCol.bg} ${legacyCol.text} ${legacyCol.border}`}>
              {legacyLabel}
            </span>
            {expense.description && <span className="text-sm text-gray-700 truncate">{expense.description}</span>}
          </div>
        )}

        {hasItems && expense.description && (
          <div className="flex items-center gap-1.5 mt-2">
            <Icon name="chat" size={12} className="text-gray-300 shrink-0" />
            <p className="text-xs text-gray-400 italic">{expense.description}</p>
          </div>
        )}
        {(expense.supplierName || expense.documentNumber) && (
          <p className="mt-2 text-[11px] font-medium text-gray-400">
            {[expense.supplierName, expense.documentNumber ? `Comp. ${expense.documentNumber}` : null].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {/* Total */}
      <div className="hidden items-start justify-end pt-0.5 sm:flex">
        <span className="font-heading font-bold text-sm text-gray-900 tabular-nums whitespace-nowrap leading-tight">
          Bs {expense.amount.toFixed(2)}
        </span>
      </div>

      {/* Actions */}
      {isDeleting ? (
        <div className="flex items-center justify-end gap-1 pt-0.5">
          <button onClick={onDelete} title="Confirmar anulación"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white bg-red-500 hover:bg-red-600 transition-colors">
            <Icon name="check" size={14} strokeWidth={2.5} />
          </button>
          <button onClick={onCancelDelete}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <Icon name="x" size={14} strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-end gap-0.5 pt-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-primary-600 hover:bg-primary-50 transition-colors">
            <Icon name="edit" size={16} />
          </button>
          <button onClick={onConfirmDelete} title="Anular gasto"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
            <Icon name="trash" size={16} />
          </button>
          </div>
        )}
    </div>
  );
}
