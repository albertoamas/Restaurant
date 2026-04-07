import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import type { DailyReportDto, TopProductDto, CategoryDto, ExpenseSummaryDto } from '@pos/shared';
import { UserRole, ExpenseCategory } from '@pos/shared';
import { reportsApi } from '../api/reports.api';
import { expensesApi } from '../api/expenses.api';
import { categoriesApi } from '../api/categories.api';
import { useAuth } from '../context/auth.context';
import { useVisibilityRefresh } from '../hooks/useVisibilityRefresh';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { today } from '../utils/date';

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
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Esta semana' },
  { key: 'month', label: 'Este mes' },
  { key: 'custom', label: 'Rango' },
];

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
  bg: string;
}

function StatCard({ label, value, icon, accent, bg }: StatCardProps) {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/70 shadow-[0_8px_24px_oklch(0.13_0.012_260/0.10)] p-4 flex flex-col gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 [&_svg]:w-[18px] [&_svg]:h-[18px] ${bg} ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-400 mb-0.5">{label}</p>
        <p className="font-heading font-black text-xl text-gray-900 leading-tight">{value}</p>
      </div>
    </div>
  );
}

export function ReportPage() {
  const { currentBranchId, user } = useAuth();
  const [period, setPeriod] = useState<Period>('today');
  const [customFrom, setCustomFrom] = useState(today);
  const [customTo, setCustomTo] = useState(today);
  const [report, setReport] = useState<DailyReportDto | null>(null);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [topProducts, setTopProducts] = useState<TopProductDto[]>([]);
  const [topLoading, setTopLoading] = useState(false);

  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummaryDto | null>(null);

  const { from, to } = getRange(period, customFrom, customTo);
  const rangeLabel = from === to ? from : `${from} → ${to}`;

  const utcFrom = new Date(from + 'T00:00:00').toISOString();
  const utcTo   = new Date(to   + 'T23:59:59.999').toISOString();
  const branchParam = user?.role === UserRole.OWNER ? (currentBranchId ?? undefined) : undefined;

  // Load categories once
  useEffect(() => {
    categoriesApi.getAll().then(setCategories).catch(() => {});
  }, []);

  // Load summary report
  useEffect(() => {
    setLoading(true);
    reportsApi
      .getByRange(utcFrom, utcTo, branchParam)
      .then(setReport)
      .catch(() => toast.error('Error al cargar reporte'))
      .finally(() => setLoading(false));
  }, [utcFrom, utcTo, currentBranchId, user?.role]);

  // Load expense summary
  useEffect(() => {
    expensesApi
      .getSummary(utcFrom, utcTo, branchParam)
      .then(setExpenseSummary)
      .catch(() => setExpenseSummary(null));
  }, [utcFrom, utcTo, currentBranchId, user?.role]);

  // Load top products
  useEffect(() => {
    setTopLoading(true);
    reportsApi
      .getTopProducts(utcFrom, utcTo, branchParam, selectedCategory || undefined)
      .then(setTopProducts)
      .catch(() => toast.error('Error al cargar productos'))
      .finally(() => setTopLoading(false));
  }, [utcFrom, utcTo, currentBranchId, user?.role, selectedCategory]);

  // Refresh all report data when returning to the tab
  const reloadAll = useCallback(() => {
    setLoading(true);
    reportsApi.getByRange(utcFrom, utcTo, branchParam).then(setReport).catch(() => {}).finally(() => setLoading(false));
    expensesApi.getSummary(utcFrom, utcTo, branchParam).then(setExpenseSummary).catch(() => {});
    setTopLoading(true);
    reportsApi.getTopProducts(utcFrom, utcTo, branchParam, selectedCategory || undefined).then(setTopProducts).catch(() => {}).finally(() => setTopLoading(false));
  }, [utcFrom, utcTo, currentBranchId, selectedCategory]); // eslint-disable-line react-hooks/exhaustive-deps
  useVisibilityRefresh(reloadAll);

  const activeClass = 'bg-primary-600 text-white border border-primary-600 shadow-[0_2px_8px_oklch(0.45_0.16_235/0.22)]';
  const inactiveClass = 'bg-white border border-gray-200 text-gray-600 hover:border-primary-400 hover:text-primary-800';

  const maxQty = topProducts[0]?.totalQuantity ?? 1;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto animate-slide">
      {/* Header + Period selector */}
      <div className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_10px_30px_oklch(0.13_0.012_260/0.10)] p-4 sm:p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="font-heading text-xl sm:text-2xl font-black text-gray-900">Reporte y Rendimiento</h2>
            <p className="text-xs text-gray-500 mt-0.5">Vista consolidada de ventas, gastos y desempeño por periodo.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200 w-fit">
            {rangeLabel}
          </span>
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

      {/* Custom range inputs */}
      {period === 'custom' && (
        <div className="flex items-center gap-2 mb-4 rounded-2xl border border-white/70 bg-white/75 p-3 shadow-[0_6px_20px_oklch(0.13_0.012_260/0.06)]">
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

        <p className="text-xs text-gray-400 mb-6 font-medium">Comparativa activa: {rangeLabel}</p>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !report || report.orderCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <svg className="w-10 h-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm font-semibold text-gray-500">Sin ventas en este período</p>
          <p className="text-xs mt-1">Selecciona otro rango de fechas</p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard
              label="Ventas Totales"
              value={`Bs ${report.totalSales.toFixed(2)}`}
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              accent="text-emerald-600" bg="bg-emerald-50"
            />
            <StatCard
              label="Pedidos"
              value={String(report.orderCount)}
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
              accent="text-primary-600" bg="bg-primary-50"
            />
            <StatCard
              label="Ticket Promedio"
              value={`Bs ${report.averageTicket.toFixed(2)}`}
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
              accent="text-violet-600" bg="bg-violet-50"
            />
            <StatCard
              label="Delivery"
              value={String(report.ordersByType.delivery)}
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>}
              accent="text-amber-600" bg="bg-amber-50"
            />
          </div>

          {/* Payment & Type breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card variant="panel">
              <h3 className="text-sm font-bold text-gray-700 mb-4 font-heading">Métodos de Pago</h3>
              <div className="space-y-4">
                <PaymentBar label="Efectivo" amount={report.paymentBreakdown.cash} total={report.totalSales} color="bg-emerald-500" />
                <PaymentBar label="QR" amount={report.paymentBreakdown.qr} total={report.totalSales} color="bg-primary-500" />
                <PaymentBar label="Transferencia" amount={report.paymentBreakdown.transfer} total={report.totalSales} color="bg-violet-500" />
              </div>
            </Card>
            <Card variant="panel">
              <h3 className="text-sm font-bold text-gray-700 mb-4 font-heading">Tipo de Pedido</h3>
              <div className="space-y-4">
                <TypeRow label="Local" count={report.ordersByType.dineIn} total={report.orderCount} color="bg-primary-500" />
                <TypeRow label="Para Llevar" count={report.ordersByType.takeout} total={report.orderCount} color="bg-amber-500" />
                <TypeRow label="Delivery" count={report.ordersByType.delivery} total={report.orderCount} color="bg-violet-500" />
              </div>
            </Card>
          </div>

          {/* Top products */}
          <Card variant="elevated">
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <h3 className="text-sm font-bold text-gray-700 font-heading">Productos Más Vendidos</h3>
              {categories.length > 0 && (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 bg-white text-gray-600
                    focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500
                    transition-[border-color,box-shadow] cursor-pointer"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>

            {topLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : topProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <svg className="w-8 h-8 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-xs font-medium text-gray-500">Sin datos para este período</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <TopProductRow
                    key={product.productId}
                    rank={index + 1}
                    product={product}
                    maxQty={maxQty}
                  />
                ))}
              </div>
            )}
          </Card>

          {/* Net Profit section */}
          {expenseSummary !== null && (
            <Card variant="feature" className="mt-4">
              <h3 className="text-sm font-bold text-gray-700 mb-4 font-heading">Ganancia Neta</h3>
              {(() => {
                const netProfit = report.totalSales - expenseSummary.total;
                const isPositive = netProfit >= 0;
                const profitPct = report.totalSales > 0
                  ? Math.min(100, (netProfit / report.totalSales) * 100)
                  : 0;
                const expensePct = report.totalSales > 0
                  ? Math.min(100, (expenseSummary.total / report.totalSales) * 100)
                  : 0;

                const EXPENSE_META: Partial<Record<ExpenseCategory, { label: string }>> = {
                  [ExpenseCategory.SUPPLIES]:    { label: 'Insumos' },
                  [ExpenseCategory.WAGES]:       { label: 'Personal' },
                  [ExpenseCategory.UTILITIES]:   { label: 'Servicios' },
                  [ExpenseCategory.TRANSPORT]:   { label: 'Transporte' },
                  [ExpenseCategory.MAINTENANCE]: { label: 'Mantenimiento' },
                  [ExpenseCategory.OTHER]:       { label: 'Otro' },
                };

                return (
                  <>
                    {/* Main net profit display */}
                    <div className={`rounded-2xl p-4 mb-4 ${isPositive ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-0.5">Ventas — Gastos = Ganancia Neta</p>
                          <p className="text-xs text-gray-400">
                            Bs {report.totalSales.toFixed(2)} — Bs {expenseSummary.total.toFixed(2)}
                          </p>
                        </div>
                        <p className={`font-heading font-black text-2xl leading-tight ${isPositive ? 'text-emerald-700' : 'text-red-600'}`}>
                          Bs {Math.abs(netProfit).toFixed(2)}
                          {!isPositive && <span className="text-sm font-semibold ml-1">pérdida</span>}
                        </p>
                      </div>
                      {/* Stacked bar */}
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex">
                        {isPositive && (
                          <>
                            <div className="h-full bg-emerald-500 rounded-l-full transition-[width] duration-700" style={{ width: `${profitPct}%` }} />
                            <div className="h-full bg-red-400 rounded-r-full transition-[width] duration-700" style={{ width: `${expensePct}%` }} />
                          </>
                        )}
                        {!isPositive && (
                          <div className="h-full bg-red-500 rounded-full w-full" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-500">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Ganancia</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Gastos</span>
                      </div>
                    </div>

                    {/* Expense breakdown by category */}
                    {expenseSummary.total > 0 && (
                      <div className="space-y-3">
                        {(Object.entries(expenseSummary.byCategory) as [ExpenseCategory, number][])
                          .sort(([, a], [, b]) => b - a)
                          .map(([cat, amount]) => (
                            <div key={cat}>
                              <div className="flex justify-between text-sm mb-1.5">
                                <span className="text-gray-600 font-medium">{EXPENSE_META[cat]?.label ?? cat}</span>
                                <span className="font-heading font-bold text-gray-900">Bs {amount.toFixed(2)}</span>
                              </div>
                              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-red-400 transition-[width] duration-700"
                                  style={{ width: `${expenseSummary.total > 0 ? (amount / expenseSummary.total) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function PaymentBar({ label, amount, total, color }: { label: string; amount: number; total: number; color: string }) {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="font-heading font-bold text-gray-900">Bs {amount.toFixed(2)}</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function TypeRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-600 font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-heading font-bold text-sm text-gray-900">{count}</span>
          <span className="text-xs text-gray-400 w-9 text-right tabular-nums">{pct}%</span>
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const RANK_COLORS = [
  'bg-amber-400',
  'bg-gray-300',
  'bg-amber-600',
];

function TopProductRow({ rank, product, maxQty }: { rank: number; product: TopProductDto; maxQty: number }) {
  const pct = maxQty > 0 ? (product.totalQuantity / maxQty) * 100 : 0;
  const isTop3 = rank <= 3;

  return (
    <div className="flex items-center gap-3">
      {/* Rank badge */}
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-black
        ${isTop3
          ? `${RANK_COLORS[rank - 1]} text-white`
          : 'bg-gray-100 text-gray-400'
        }`}
      >
        {rank}
      </div>

      {/* Name + bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1 gap-2">
          <span className="text-sm font-semibold text-gray-800 truncate leading-tight">{product.productName}</span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-heading font-bold text-sm text-gray-900 tabular-nums">
              {product.totalQuantity} uds
            </span>
            <span className="text-xs text-gray-400 tabular-nums w-20 text-right">
              Bs {product.totalRevenue.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width] duration-700 ${
              rank === 1 ? 'bg-primary-500' : rank === 2 ? 'bg-primary-400' : rank === 3 ? 'bg-primary-300' : 'bg-gray-300'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {product.categoryName && (
          <span className="text-[10px] text-gray-400 font-medium mt-0.5 inline-block">{product.categoryName}</span>
        )}
      </div>
    </div>
  );
}
