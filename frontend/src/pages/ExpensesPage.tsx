import { useState, useEffect } from 'react';
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
import { PageShell } from '../components/ui/PageShell';
import { ExpenseFormModal } from '../components/expenses/ExpenseFormModal';
import { handleApiError } from '../utils/api-error';
import { today } from '../utils/date';
import { getBoliviaDayBounds } from '../utils/timezone';

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
    return { from: fmt(first), to: todayStr };
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
  { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200'    },
  { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'   },
  { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200'  },
  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200'    },
  { bg: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-cyan-200'    },
  { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200'  },
];

function categoryColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return CAT_COLORS[h % CAT_COLORS.length];
}

export function ExpensesPage() {
  const { currentBranchId, user } = useAuth();
  const [period, setPeriod] = useState<Period>('today');
  const [customFrom, setCustomFrom] = useState(today);
  const [customTo, setCustomTo] = useState(today);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseDto | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [totalSales, setTotalSales] = useState<number | null>(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

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
      await expensesApi.delete(id);
      toast.success('Gasto eliminado');
      reload();
    } catch (err) {
      handleApiError(err, 'Error al eliminar');
    }
  };

  const netProfit = totalSales !== null ? totalSales - summary.total : null;
  const activeClass   = 'bg-primary-600 text-white border border-primary-600 shadow-[0_2px_8px_oklch(0.45_0.16_235/0.22)]';
  const inactiveClass = 'bg-white/5 border border-white/10 text-gray-500 hover:border-primary-500/40 hover:text-primary-400';

  const summaryCategories = Object.entries(summary.byCategory)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  const filteredExpenses = selectedCategory
    ? expenses.filter((e) => expenseCategoryLabel(e) === selectedCategory)
    : expenses;

  return (
    <PageShell>
      {/* Period selector */}
      <div className="rounded-2xl border border-white/8 shadow-[0_10px_30px_oklch(0.06_0.010_38/0.6)] p-4 sm:p-5 mb-4" style={{ background: 'var(--color-surface-card)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-heading text-xl sm:text-2xl font-black text-gray-900">Gastos Operativos</h2>
            <p className="text-xs text-gray-500 mt-0.5">Control por categoría, período y rentabilidad neta.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-100/60 border border-primary-500/25 text-primary-400">
              {rangeLabel}
            </span>
            <Button size="sm" onClick={() => setShowModal(true)}>+ Agregar gasto</Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                period === p.key ? activeClass : inactiveClass
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom range */}
      {period === 'custom' && (
        <div className="flex items-center gap-2 mb-4">
          <input
            type="date" value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="border border-white/10 rounded-xl px-3 py-2 text-sm bg-[var(--color-surface-card)] text-gray-700 [color-scheme:dark]
              focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500/50 transition-[border-color,box-shadow]"
          />
          <span className="text-gray-400 text-sm">→</span>
          <input
            type="date" value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="border border-white/10 rounded-xl px-3 py-2 text-sm bg-[var(--color-surface-card)] text-gray-700 [color-scheme:dark]
              focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500/50 transition-[border-color,box-shadow]"
          />
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-2xl border border-white/8 shadow-[0_8px_24px_oklch(0.06_0.010_38/0.4)] p-4 flex flex-col gap-2" style={{ background: 'var(--color-surface-card)' }}>
          <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
            <Icon name="minus" size={16} />
          </div>
          <p className="text-xs font-medium text-gray-400">Total Gastos</p>
          <p className="font-heading font-black text-lg text-red-600 leading-tight">
            Bs {summary.total.toFixed(2)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/8 shadow-[0_8px_24px_oklch(0.06_0.010_38/0.4)] p-4 flex flex-col gap-2" style={{ background: 'var(--color-surface-card)' }}>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <Icon name="dollar" size={16} />
          </div>
          <p className="text-xs font-medium text-gray-400">Ventas</p>
          <p className="font-heading font-black text-lg text-emerald-600 leading-tight">
            {salesLoading ? '…' : totalSales !== null ? `Bs ${totalSales.toFixed(2)}` : '—'}
          </p>
        </div>

        <div className={`rounded-2xl border shadow-[0_1px_4px_oklch(0.13_0.012_260/0.07)] p-4 flex flex-col gap-2 ${
          netProfit !== null && netProfit >= 0
            ? 'bg-emerald-50 border-emerald-200'
            : netProfit !== null
            ? 'bg-red-50 border-red-200'
            : 'bg-white/5 border-white/8'
        }`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            netProfit !== null && netProfit >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'
          }`}>
            <Icon name="chart" size={16} />
          </div>
          <p className="text-xs font-medium text-gray-500">Ganancia Neta</p>
          <p className={`font-heading font-black text-lg leading-tight ${
            netProfit !== null && netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
          }`}>
            {netProfit !== null ? `Bs ${netProfit.toFixed(2)}` : '—'}
          </p>
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

      {/* Expense list */}
      {loading ? (
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
        <div className="rounded-2xl border border-white/8 shadow-[0_4px_16px_oklch(0.06_0.010_38/0.4)] overflow-hidden" style={{ background: 'var(--color-surface-card)' }}>
          {/* Table header */}
          <div className="grid grid-cols-[90px_1fr_100px_60px] gap-4 px-5 py-2.5 bg-white/3 border-b border-white/8">
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
      )}

      <ExpenseFormModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingExpense(null); }}
        onSaved={reload}
        expense={editingExpense ?? undefined}
      />
    </PageShell>
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
  const date       = new Date(expense.createdAt);
  const dateStr    = date.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' });
  const timeStr    = date.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
  const hasItems   = expense.items.length > 0;
  const legacyLabel = expenseCategoryLabel(expense);
  const legacyCol  = categoryColor(legacyLabel);

  return (
    <div className={`group grid grid-cols-[90px_1fr_100px_60px] gap-4 px-5 py-4 border-t border-white/8 transition-colors
      ${isDeleting ? 'bg-red-50/40' : 'hover:bg-gray-50/50'}`}
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
                      {qty % 1 === 0 ? qty : qty.toFixed(3)} × Bs {item.unitPrice.toFixed(2)}
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
      </div>

      {/* Total */}
      <div className="flex items-start justify-end pt-0.5">
        <span className="font-heading font-bold text-sm text-gray-900 tabular-nums whitespace-nowrap leading-tight">
          Bs {expense.amount.toFixed(2)}
        </span>
      </div>

      {/* Actions */}
      {isDeleting ? (
        <div className="flex items-center justify-end gap-1 pt-0.5">
          <button onClick={onDelete}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white bg-red-500 hover:bg-red-600 transition-colors">
            <Icon name="check" size={14} strokeWidth={2.5} />
          </button>
          <button onClick={onCancelDelete}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <Icon name="x" size={14} strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-end gap-0.5 pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-primary-600 hover:bg-primary-50 transition-colors">
            <Icon name="edit" size={16} />
          </button>
          <button onClick={onConfirmDelete}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
            <Icon name="trash" size={16} />
          </button>
          </div>
        )}
    </div>
  );
}
