import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ExpenseCategory, UserRole } from '@pos/shared';
import { expensesApi } from '../api/expenses.api';
import { reportsApi } from '../api/reports.api';
import { useExpenses } from '../hooks/useExpenses';
import { useAuth } from '../context/auth.context';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Card } from '../components/ui/Card';
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

const CATEGORY_META: Record<ExpenseCategory, { label: string; icon: string; color: string; bg: string }> = {
  [ExpenseCategory.SUPPLIES]:    { label: 'Insumos',       icon: '🧂', color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200' },
  [ExpenseCategory.WAGES]:       { label: 'Personal',      icon: '👤', color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
  [ExpenseCategory.UTILITIES]:   { label: 'Servicios',     icon: '💡', color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200' },
  [ExpenseCategory.TRANSPORT]:   { label: 'Transporte',    icon: '🚗', color: 'text-cyan-700',   bg: 'bg-cyan-50 border-cyan-200' },
  [ExpenseCategory.MAINTENANCE]: { label: 'Mantenimiento', icon: '🔧', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  [ExpenseCategory.OTHER]:       { label: 'Otro',          icon: '📋', color: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200' },
};

export function ExpensesPage() {
  const { currentBranchId, user } = useAuth();
  const [period, setPeriod] = useState<Period>('today');
  const [customFrom, setCustomFrom] = useState(today);
  const [customTo, setCustomTo] = useState(today);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | ''>('');
  const [totalSales, setTotalSales] = useState<number | null>(null);
  const [salesLoading, setSalesLoading] = useState(false);

  const { from, to } = getRange(period, customFrom, customTo);
  const branchParam = user?.role === UserRole.OWNER ? (currentBranchId ?? undefined) : undefined;

  // Límites exactos del día en Bolivia (UTC-4), independiente del timezone del dispositivo
  const { start: utcFrom } = getBoliviaDayBounds(from);
  const { end:   utcTo   } = getBoliviaDayBounds(to);

  const { expenses, summary, loading, reload } = useExpenses(utcFrom, utcTo, branchParam);

  // Load sales total for net profit calculation
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
  const activeClass = 'bg-primary-600 text-white border border-primary-600 shadow-[0_2px_8px_oklch(0.45_0.16_235/0.22)]';
  const inactiveClass = 'bg-white border border-gray-200 text-gray-600 hover:border-primary-400 hover:text-primary-800';

  const filteredExpenses = selectedCategory
    ? expenses.filter((e) => e.category === selectedCategory)
    : expenses;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto animate-slide">
      {/* Period selector */}
      <div className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_10px_30px_oklch(0.13_0.012_260/0.10)] p-4 sm:p-5 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-heading text-xl sm:text-2xl font-black text-gray-900">Gastos Operativos</h2>
            <p className="text-xs text-gray-500 mt-0.5">Control por categoría, período y rentabilidad neta.</p>
          </div>
          <Button size="sm" onClick={() => setShowModal(true)}>+ Agregar gasto</Button>
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
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white
              focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500 transition-[border-color,box-shadow]"
          />
          <span className="text-gray-400 text-sm">→</span>
          <input
            type="date" value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white
              focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500 transition-[border-color,box-shadow]"
          />
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {/* Total gastos */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/70 shadow-[0_8px_24px_oklch(0.13_0.012_260/0.10)] p-4 flex flex-col gap-2">
          <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center [&_svg]:w-4 [&_svg]:h-4 text-red-500">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </div>
          <p className="text-xs font-medium text-gray-400">Total Gastos</p>
          <p className="font-heading font-black text-lg text-red-600 leading-tight">
            Bs {summary.total.toFixed(2)}
          </p>
        </div>

        {/* Ventas */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/70 shadow-[0_8px_24px_oklch(0.13_0.012_260/0.10)] p-4 flex flex-col gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center [&_svg]:w-4 [&_svg]:h-4 text-emerald-500">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xs font-medium text-gray-400">Ventas</p>
          <p className="font-heading font-black text-lg text-emerald-600 leading-tight">
            {salesLoading ? '…' : totalSales !== null ? `Bs ${totalSales.toFixed(2)}` : '—'}
          </p>
        </div>

        {/* Ganancia neta */}
        <div className={`rounded-2xl border shadow-[0_1px_4px_oklch(0.13_0.012_260/0.07)] p-4 flex flex-col gap-2 ${
          netProfit !== null && netProfit >= 0
            ? 'bg-emerald-50 border-emerald-200'
            : netProfit !== null
            ? 'bg-red-50 border-red-200'
            : 'bg-white border-gray-100'
        }`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center [&_svg]:w-4 [&_svg]:h-4 ${
            netProfit !== null && netProfit >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'
          }`}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
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
      {expenses.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
              selectedCategory === '' ? activeClass : inactiveClass
            }`}
          >
            Todas
          </button>
          {Object.values(ExpenseCategory).filter((cat) => summary.byCategory[cat]).map((cat) => {
            const meta = CATEGORY_META[cat];
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  selectedCategory === cat ? activeClass : inactiveClass
                }`}
              >
                {meta.icon} {meta.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Expense list */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filteredExpenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <svg className="w-10 h-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
          </svg>
          <p className="text-sm font-semibold text-gray-500">Sin gastos registrados</p>
          <p className="text-xs mt-1">Agrega el primer gasto del período</p>
        </div>
      ) : (
        <Card variant="default" padding="none">
          <div className="divide-y divide-gray-50">
            {filteredExpenses.map((expense) => {
              const meta = CATEGORY_META[expense.category];
              return (
                <div key={expense.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors">
                  {/* Category badge */}
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border shrink-0 ${meta.bg} ${meta.color}`}>
                    {meta.icon} {meta.label}
                  </span>

                  {/* Description */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">
                      {expense.description || <span className="text-gray-400 italic">Sin descripción</span>}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {new Date(expense.createdAt).toLocaleString('es-BO', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Amount */}
                  <span className="font-heading font-bold text-sm text-red-600 shrink-0">
                    Bs {Number(expense.amount).toFixed(2)}
                  </span>

                  {/* Delete */}
                  {deletingId === expense.id ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { handleDelete(expense.id); setDeletingId(null); }}
                        className="p-1.5 rounded-lg text-white bg-red-500 hover:bg-red-600 transition-colors"
                        title="Confirmar eliminación"
                        aria-label="Confirmar eliminación del gasto"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        title="Cancelar"
                        aria-label="Cancelar eliminación"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(expense.id)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                      title="Eliminar gasto"
                      aria-label="Eliminar gasto"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <ExpenseFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSaved={reload}
      />
    </div>
  );
}
