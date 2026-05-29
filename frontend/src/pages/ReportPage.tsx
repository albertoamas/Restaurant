import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { DailyReportDto, TopCustomerDto, TopProductDto, CategoryDto, ExpenseSummaryDto } from '@pos/shared';
import { UserRole, ExpenseCategory, SaasPlan } from '@pos/shared';
import { reportsApi } from '../api/reports.api';
import { expensesApi } from '../api/expenses.api';
import { categoriesApi } from '../api/categories.api';
import { useAuth } from '../context/auth.context';
import { useSettingsStore } from '../store/settings.store';
import { queryKeys } from '../lib/query-keys';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { Icon } from '../components/ui/Icon';
import { PageShell } from '../components/ui/PageShell';
import { StatCard, PaymentBar, TypeRow, TopProductRow, TopCustomerRow } from '../components/report';
import { today } from '../utils/date';
import { getBoliviaDayBounds } from '../utils/timezone';
import { downloadExcel } from '../utils/excel';

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

export function ReportPage() {
  const { currentBranchId, user } = useAuth();
  const plan = useSettingsStore((s) => s.plan);
  const canExport = plan !== SaasPlan.BASICO;

  const [period, setPeriod] = useState<Period>('today');
  const [customFrom, setCustomFrom] = useState(today);
  const [customTo, setCustomTo] = useState(today);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const { from, to } = getRange(period, customFrom, customTo);
  const rangeLabel = from === to ? from : `${from} → ${to}`;

  // Límites exactos del día en Bolivia (UTC-4), independiente del timezone del dispositivo
  const { start: utcFrom } = getBoliviaDayBounds(from);
  const { end:   utcTo   } = getBoliviaDayBounds(to);
  const branchParam = user?.role === UserRole.OWNER ? (currentBranchId ?? undefined) : undefined;

  const { data: categories = [] as CategoryDto[] } = useQuery({
    queryKey: queryKeys.categories,
    queryFn:  () => categoriesApi.getAll(),
    staleTime: 5 * 60_000,
  });

  const { data: report = null, isPending: loading } = useQuery<DailyReportDto | null>({
    queryKey: queryKeys.reportRange(utcFrom, utcTo, branchParam),
    queryFn:  () => reportsApi.getByRange(utcFrom, utcTo, branchParam),
    staleTime: 0,
  });

  const { data: expenseSummary = null } = useQuery<ExpenseSummaryDto | null>({
    queryKey: queryKeys.reportExpenseSummary(utcFrom, utcTo, branchParam),
    queryFn:  () => expensesApi.getSummary(utcFrom, utcTo, branchParam).catch(() => null),
    staleTime: 0,
  });

  const { data: topProducts = [] as TopProductDto[], isPending: topLoading } = useQuery({
    queryKey: queryKeys.reportTopProducts(utcFrom, utcTo, branchParam, selectedCategory || undefined),
    queryFn:  () => reportsApi.getTopProducts(utcFrom, utcTo, branchParam, selectedCategory || undefined),
    staleTime: 0,
  });

  const { data: topCustomers = [] as TopCustomerDto[], isPending: custLoading } = useQuery({
    queryKey: queryKeys.reportTopCustomers(utcFrom, utcTo, branchParam),
    queryFn:  () => reportsApi.getTopCustomers(utcFrom, utcTo, branchParam),
    staleTime: 0,
  });

  const EXPENSE_LABELS: Partial<Record<ExpenseCategory, string>> = {
    [ExpenseCategory.SUPPLIES]:    'Insumos',
    [ExpenseCategory.WAGES]:       'Personal',
    [ExpenseCategory.UTILITIES]:   'Servicios',
    [ExpenseCategory.TRANSPORT]:   'Transporte',
    [ExpenseCategory.MAINTENANCE]: 'Mantenimiento',
    [ExpenseCategory.OTHER]:       'Otro',
  };

  const handleExportExcel = () => {
    if (!report) return;
    const filename = from === to
      ? `reporte_${from}.xlsx`
      : `reporte_${from}_${to}.xlsx`;
    downloadExcel(rangeLabel, report, topProducts, topCustomers, expenseSummary, filename);
  };

  const handlePrint = () => window.print();

  const activeClass = 'bg-primary-600 text-white border border-primary-600 shadow-[0_2px_8px_oklch(0.45_0.16_235/0.22)]';
  const inactiveClass = 'bg-white border border-gray-200 text-gray-600 hover:border-primary-400 hover:text-primary-800';

  const maxQty = topProducts[0]?.totalQuantity ?? 1;

  return (
    <PageShell>
      {/* Print-only header — hidden on screen */}
      <div className="hidden print:block mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">{user?.tenantName ?? 'Reporte de Ventas'}</h1>
        <p className="text-sm text-gray-600 mt-0.5">Reporte de Ventas · {rangeLabel}</p>
        <p className="text-xs text-gray-400 mt-0.5">Generado el {new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Header + Period selector */}
      <div data-print-hide className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_10px_30px_oklch(0.13_0.012_260/0.10)] p-4 sm:p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="font-heading text-xl sm:text-2xl font-black text-gray-900">Reporte y Rendimiento</h2>
            <p className="text-xs text-gray-500 mt-0.5">Vista consolidada de ventas, gastos y desempeño por periodo.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
              {rangeLabel}
            </span>
            {canExport ? (
              <>
                <button
                  onClick={handleExportExcel}
                  disabled={!report || loading}
                  title="Exportar a Excel"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_1px_3px_oklch(0.13_0.012_260/0.07)]"
                >
                  <Icon name="download" size={14} />
                  Excel
                </button>
                <button
                  onClick={handlePrint}
                  disabled={!report || loading}
                  title="Imprimir / Guardar como PDF"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_1px_3px_oklch(0.13_0.012_260/0.07)]"
                >
                  <Icon name="print" size={14} />
                  PDF
                </button>
              </>
            ) : (
              <div className="relative group">
                <button
                  disabled
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-400 cursor-not-allowed"
                >
                  <Icon name="lock" size={14} />
                  Exportar
                </button>
                <div className="absolute right-0 top-full mt-1.5 z-10 hidden group-hover:block w-48 rounded-xl border border-gray-200 bg-white shadow-lg px-3 py-2.5 text-xs text-gray-500 leading-snug">
                  Disponible en plan <span className="font-semibold text-primary-600">PRO</span> o <span className="font-semibold text-primary-600">NEGOCIO</span>.
                </div>
              </div>
            )}
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

      {/* Custom range inputs */}
      {period === 'custom' && (
        <div data-print-hide className="flex items-center gap-2 mb-4 rounded-2xl border border-white/70 bg-white/75 p-3 shadow-[0_6px_20px_oklch(0.13_0.012_260/0.06)]">
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

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !report || (report.orderCount === 0 && report.paymentBreakdown.cortesia === 0 && !(expenseSummary && expenseSummary.total > 0)) ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Icon name="chart" size={40} strokeWidth={1.5} className="mb-3 opacity-40" />
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
              icon={<Icon name="dollar" size={24} />}
              accent="text-emerald-400" bg="bg-emerald-500/10"
            />
            <StatCard
              label="Pedidos"
              value={String(report.orderCount)}
              icon={<Icon name="orders" size={24} />}
              accent="text-primary-400" bg="bg-primary-500/10"
            />
            <StatCard
              label="Ticket Promedio"
              value={`Bs ${report.averageTicket.toFixed(2)}`}
              icon={<Icon name="receipt" size={24} />}
              accent="text-violet-400" bg="bg-violet-500/10"
            />
            <StatCard
              label="Gastos Totales"
              value={expenseSummary ? `Bs ${expenseSummary.total.toFixed(2)}` : 'Bs 0.00'}
              icon={<Icon name="minus" size={24} />}
              accent="text-red-400" bg="bg-red-500/10"
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
                {report.paymentBreakdown.cortesia > 0 && (
                  <PaymentBar label="Cortesía" amount={report.paymentBreakdown.cortesia} total={report.totalSales + report.paymentBreakdown.cortesia} color="bg-amber-400" />
                )}
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
          <Card variant="default">
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <h3 className="text-sm font-bold text-gray-700 font-heading">Productos Más Vendidos</h3>
              {categories.length > 0 && (
                <select
                  data-print-hide
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
                <Icon name="package" size={32} strokeWidth={1.5} className="mb-2 opacity-40" />
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

          {/* Top customers */}
          <Card variant="default" className="mt-4">
            <h3 className="text-sm font-bold text-gray-700 mb-4 font-heading">Clientes Más Frecuentes</h3>

            {custLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : topCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Icon name="users" size={32} strokeWidth={1.5} className="mb-2 opacity-40" />
                <p className="text-xs font-medium text-gray-500">Sin clientes registrados en este período</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topCustomers.map((customer, index) => (
                  <TopCustomerRow
                    key={customer.customerId}
                    rank={index + 1}
                    customer={customer}
                    maxSpent={topCustomers[0].totalSpent}
                  />
                ))}
              </div>
            )}
          </Card>

          {/* Expense breakdown by category */}
          {expenseSummary !== null && expenseSummary.total > 0 && (
            <Card variant="panel" className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-700 font-heading">Gastos por Categoría</h3>
                <span className="font-heading font-bold text-sm text-red-500">Bs {expenseSummary.total.toFixed(2)}</span>
              </div>
              <div className="space-y-3">
                {(Object.entries(expenseSummary.byCategory) as [string, number][])
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, amount]) => (
                    <div key={cat}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-gray-600 font-medium">{EXPENSE_LABELS[cat as ExpenseCategory] ?? cat}</span>
                        <span className="font-heading font-bold text-gray-900">Bs {amount.toFixed(2)}</span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-red-400 transition-[width] duration-700"
                          style={{ width: `${(amount / expenseSummary.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {/* Net Profit */}
          {expenseSummary !== null && (
            <Card variant="panel" className="mt-4">
              {(() => {
                const netProfit = report.totalSales - expenseSummary.total;
                const isPositive = netProfit >= 0;
                const marginPct = report.totalSales > 0 ? (netProfit / report.totalSales) * 100 : 0;
                const profitPct = report.totalSales > 0 ? Math.min(100, Math.max(0, (netProfit / report.totalSales) * 100)) : 0;
                const expensePct = report.totalSales > 0 ? Math.min(100, (expenseSummary.total / report.totalSales) * 100) : 0;
                return (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Ganancia Neta</p>
                        <p className={`font-heading font-black text-3xl leading-none ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                          {!isPositive && <span className="text-xl mr-0.5">−</span>}Bs {Math.abs(netProfit).toFixed(2)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        isPositive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {isPositive ? '↑' : '↓'} {Math.abs(marginPct).toFixed(1)}% margen
                      </span>
                    </div>

                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex mb-5">
                      <div className="h-full bg-emerald-500 transition-[width] duration-700" style={{ width: `${profitPct}%` }} />
                      <div className="h-full bg-red-400 transition-[width] duration-700" style={{ width: `${expensePct}%` }} />
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Ingresos</span>
                        <span className="font-heading font-bold text-gray-900">Bs {report.totalSales.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Gastos operativos</span>
                        <span className="font-heading font-bold text-red-500">− Bs {expenseSummary.total.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm pt-2.5 border-t border-gray-100">
                        <span className="font-semibold text-gray-700">Resultado neto</span>
                        <span className={`font-heading font-black ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                          {!isPositive && '− '}Bs {Math.abs(netProfit).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </Card>
          )}
        </>
      )}
    </PageShell>
  );
}
