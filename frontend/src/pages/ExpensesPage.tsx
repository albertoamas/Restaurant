import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { UserRole } from '@pos/shared';
import type { ExpenseDto } from '@pos/shared';
import { expensesApi } from '../api/expenses.api';
import { useExpenses } from '../hooks/useExpenses';
import { useAuth } from '../context/auth.context';
import { Skeleton } from '../components/ui/Skeleton';
import { Icon } from '../components/ui/Icon';
import { PageShell } from '../components/ui/PageShell';
import { ExpenseEditModal } from '../components/expenses/ExpenseEditModal';
import { ExpenseConceptsModal } from '../components/expenses/ExpenseConceptsModal';
import { QuickExpensePanel } from '../components/expenses/QuickExpensePanel';
import { ExpenseBrowser } from '../components/expenses/ExpenseBrowser';
import { ExpenseCalendar } from '../components/expenses/ExpenseCalendar';
import { ExpenseList } from '../components/expenses/ExpenseList';
import { expenseCategoryLabel } from '../utils/expense-labels';
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
    const last  = new Date(d.getFullYear(), d.getMonth() + 1, 0);
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

const DATE_INPUT =
  'rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface-card)] px-3 py-1.5 text-sm text-gray-700 ' +
  'outline-none transition-[border-color,box-shadow] focus:border-primary-500 focus:ring-[3px] focus:ring-primary-500/20';

export function ExpensesPage() {
  const { currentBranchId, user } = useAuth();
  const [period, setPeriod]         = useState<Period>('month');
  const [customFrom, setCustomFrom] = useState(today);
  const [customTo, setCustomTo]     = useState(today);
  const [showConcepts, setConcepts] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseDto | null>(null);
  const [deletingId, setDeletingId]         = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [view, setView]                     = useState<'activity' | 'calendar'>('activity');
  const [selectedDay, setSelectedDay]       = useState<string | null>(null);

  const { from, to } = getRange(period, customFrom, customTo);
  const branchParam = user?.role === UserRole.OWNER ? (currentBranchId ?? undefined) : undefined;

  const { start: utcFrom } = getBoliviaDayBounds(from);
  const { end:   utcTo   } = getBoliviaDayBounds(to);

  const { expenses, summary, loading, reload } = useExpenses(utcFrom, utcTo, branchParam);

  const handleDelete = async (id: string) => {
    try {
      await expensesApi.void(id);
      toast.success('Gasto anulado. El registro se conserva en el historial.');
      setDeletingId(null);
      reload();
    } catch (err) {
      handleApiError(err, 'Error al anular el gasto');
    }
  };

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

  return (
    <PageShell>
      {/* Cabecera */}
      <div className="mb-5 rounded-2xl border border-[var(--border-subtle)] shadow-card-xl" style={{ background: 'var(--color-surface-card)' }}>
        <div className="px-4 py-4 sm:px-5">
          <div>
            <h1 className="font-heading text-xl font-black text-gray-900 sm:text-2xl">Gastos</h1>
            <p className="mt-0.5 text-xs text-gray-500">
              {summary.transactionCount} movimiento{summary.transactionCount !== 1 ? 's' : ''}
              {' · '}
              {from === to ? from : `${from} → ${to}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-t border-[var(--border-subtle)] px-4 py-3 sm:px-5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                period === p.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-[var(--color-surface-2)] text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
          {period === 'custom' && (
            <>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className={DATE_INPUT} />
              <span className="shrink-0 text-sm text-gray-400">→</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className={DATE_INPUT} />
            </>
          )}
        </div>
      </div>

      {/* Registro rápido */}
      <QuickExpensePanel onRegistered={reload} onManage={() => setConcepts(true)} />

      {/* Filtro, vista y contenido — todo en una sola tarjeta */}
      <ExpenseBrowser
        categories={summaryCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        view={view}
        onChangeView={setView}
        selectedDay={selectedDay}
        onClearDay={() => setSelectedDay(null)}
      >
        {view === 'calendar' ? (
          <ExpenseCalendar
            from={from}
            to={to}
            byDay={summary.byDay}
            selectedDay={selectedDay}
            onSelect={(day) => { setSelectedDay(day === selectedDay ? null : day); setView('activity'); }}
          />
        ) : loading ? (
          <div className="space-y-3 p-4 sm:p-5">
            <Skeleton variant="card" />
            <Skeleton variant="card" />
            <Skeleton variant="card" />
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
            <Icon name="receipt" size={36} strokeWidth={1.5} className="mb-3 text-gray-300" />
            <p className="text-sm font-bold text-gray-600">Sin gastos en este período</p>
            <p className="mt-1 text-xs text-gray-400">Registra el primero desde el panel de arriba.</p>
          </div>
        ) : (
          <ExpenseList
            expenses={filteredExpenses}
            deletingId={deletingId}
            onEdit={setEditingExpense}
            onConfirmDelete={setDeletingId}
            onCancelDelete={() => setDeletingId(null)}
            onDelete={handleDelete}
          />
        )}
      </ExpenseBrowser>

      <ExpenseEditModal
        expense={editingExpense}
        onClose={() => setEditingExpense(null)}
        onSaved={reload}
      />

      <ExpenseConceptsModal isOpen={showConcepts} onClose={() => setConcepts(false)} />
    </PageShell>
  );
}
