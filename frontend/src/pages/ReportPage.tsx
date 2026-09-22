import { useState } from 'react';
import { SaasPlan } from '@pos/shared';
import { useSettingsStore } from '../store/settings.store';
import { useReportFilters, type Period } from '../hooks/useReportFilters';
import { useReportSummary, useTopProductsReport, useTopCustomersReport } from '../hooks/useReportData';
import { useSalesTrends, useTopCategoriesReport, useCashReport, useBranchComparison } from '../hooks/useAdvancedReportData';
import { reportsApi } from '../api/reports.api';
import { expensesApi } from '../api/expenses.api';
import { PageShell } from '../components/ui/PageShell';
import { Icon } from '../components/ui/Icon';
import type { IconName } from '../components/ui/Icon';
import { Spinner } from '../components/ui/Spinner';
import { SummaryTab } from '../components/report/tabs/SummaryTab';
import { SalesTab } from '../components/report/tabs/SalesTab';
import { ProductsTab } from '../components/report/tabs/ProductsTab';
import { CustomersTab } from '../components/report/tabs/CustomersTab';
import { ExpensesTab } from '../components/report/tabs/ExpensesTab';
import { CashTab } from '../components/report/tabs/CashTab';
import { downloadExcel } from '../utils/excel';
import { handleApiError } from '../utils/api-error';
import { useAuth } from '../context/auth.context';

type TabKey = 'resumen' | 'ventas' | 'productos' | 'clientes' | 'gastos' | 'caja';

const TABS: { key: TabKey; label: string; icon: IconName }[] = [
  { key: 'resumen',   label: 'Resumen',   icon: 'chart'   },
  { key: 'ventas',    label: 'Ventas',    icon: 'dollar'  },
  { key: 'gastos',    label: 'Gastos',    icon: 'receipt' },
  { key: 'caja',      label: 'Caja',      icon: 'cash'    },
  { key: 'productos', label: 'Productos', icon: 'package' },
  { key: 'clientes',  label: 'Clientes',  icon: 'users'   },
];

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today',  label: 'Hoy'         },
  { key: 'week',   label: 'Esta semana' },
  { key: 'month',  label: 'Este mes'    },
  { key: 'custom', label: 'Rango'       },
];

export function ReportPage() {
  const { user } = useAuth();
  const plan      = useSettingsStore((s) => s.plan);
  const canExport = plan !== SaasPlan.BASICO;

  const [activeTab, setActiveTab] = useState<TabKey>('resumen');
  const [exporting, setExporting] = useState(false);

  const {
    period, setPeriod, customFrom, setCustomFrom, customTo, setCustomTo,
    rangeLabel, isMultiDay, utcFrom, utcTo, branchParam,
    selectedCategory, setSelectedCategory, from, to,
  } = useReportFilters();

  const fromUtc = utcFrom ?? '';
  const toUtc   = utcTo   ?? '';

  // Base siempre activa: la usan Resumen, los KPIs de Ventas y Gastos.
  const { report, expenseSummary, loading, expenseLoading } = useReportSummary(fromUtc, toUtc, branchParam);

  // Cada sección pide lo suyo solo cuando su pestaña está abierta.
  const products  = useTopProductsReport(fromUtc, toUtc, branchParam, selectedCategory, activeTab === 'productos');
  const cats      = useTopCategoriesReport(fromUtc, toUtc, branchParam, activeTab === 'productos');
  const customers = useTopCustomersReport(fromUtc, toUtc, branchParam, activeTab === 'clientes');
  const trends    = useSalesTrends(fromUtc, toUtc, branchParam, isMultiDay, activeTab === 'ventas');
  const cash      = useCashReport(fromUtc, toUtc, branchParam, activeTab === 'caja');
  // Solo en la vista consolidada: con una sucursal fija no hay nada que comparar.
  const branches  = useBranchComparison(fromUtc, toUtc, activeTab === 'resumen' && !branchParam);

  /**
   * El Excel incluye todas las secciones, así que pide los datos en el momento
   * en vez de depender de qué pestañas se hayan abierto.
   */
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const [fullReport, topProducts, topCustomers, expenses] = await Promise.all([
        reportsApi.getByRange(fromUtc, toUtc, branchParam),
        reportsApi.getTopProducts(fromUtc, toUtc, branchParam),
        reportsApi.getTopCustomers(fromUtc, toUtc, branchParam),
        expensesApi.getSummary(fromUtc, toUtc, branchParam).catch(() => null),
      ]);
      const filename = from === to ? `reporte_${from}.xlsx` : `reporte_${from}_${to}.xlsx`;
      downloadExcel(rangeLabel, fullReport, topProducts, topCustomers, expenses, filename);
    } catch (err) {
      handleApiError(err, 'No se pudo exportar el reporte');
    } finally {
      setExporting(false);
    }
  };

  const pActive   = 'bg-primary-600 text-white border border-primary-600 shadow-[0_2px_8px_oklch(0.45_0.16_235/0.22)]';
  const pInactive = 'bg-[var(--color-surface-2)] border border-[var(--border-subtle)] text-gray-500 hover:border-primary-500/40 hover:text-primary-400';

  const dateInputCls = [
    'border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm bg-[var(--color-surface-card)] text-gray-700',
    'focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500/50 transition-[border-color,box-shadow]',
  ].join(' ');

  const activeLabel = TABS.find((t) => t.key === activeTab)?.label ?? '';
  const noSales = !loading && report !== null && report.orderCount === 0 && report.paymentBreakdown.cortesia === 0;

  return (
    <PageShell>
      {/* Encabezado solo para impresión */}
      <div className="mb-6 hidden border-b border-gray-200 pb-4 print:block">
        <h1 className="text-2xl font-bold text-gray-900">{user?.tenantName ?? 'Reporte de Ventas'}</h1>
        <p className="mt-0.5 text-sm text-gray-600">{activeLabel} · {rangeLabel}</p>
        <p className="mt-0.5 text-xs text-gray-400">
          Generado el {new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── Tarjeta de cabecera ──────────────────────────────────────── */}
      <div data-print-hide className="mb-5 rounded-2xl border border-[var(--border-subtle)] shadow-card-xl" style={{ background: 'var(--color-surface-card)' }}>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-heading text-xl font-black text-gray-900 sm:text-2xl">Reporte y Rendimiento</h2>
            <p className="mt-0.5 text-xs text-gray-500">Cada sección en su propia pestaña.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-500/20 bg-primary-500/10 px-2.5 py-1 text-xs font-semibold text-primary-600">
              {rangeLabel}
            </span>
            {canExport ? (
              <>
                <button
                  onClick={handleExportExcel}
                  disabled={exporting || loading}
                  title="Exportar todo el reporte a Excel"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface-2)] px-3 py-1.5 text-xs font-semibold text-gray-600 transition-all hover:border-emerald-400 hover:bg-emerald-500/8 hover:text-emerald-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {exporting ? <Spinner size="sm" /> : <Icon name="download" size={14} />}Excel
                </button>
                <button
                  onClick={() => window.print()}
                  disabled={loading}
                  title={`Imprimir la sección ${activeLabel}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface-2)] px-3 py-1.5 text-xs font-semibold text-gray-600 transition-all hover:border-primary-400 hover:bg-primary-500/8 hover:text-primary-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Icon name="print" size={14} />PDF
                </button>
              </>
            ) : (
              <div className="group relative">
                <button disabled className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface-2)] px-3 py-1.5 text-xs font-semibold text-gray-400">
                  <Icon name="lock" size={14} />Exportar
                </button>
                <div className="absolute right-0 top-full z-10 mt-1.5 hidden w-48 rounded-xl border border-[var(--border-subtle)] px-3 py-2.5 text-xs leading-snug text-gray-500 shadow-lg group-hover:block" style={{ background: 'var(--color-surface-card)' }}>
                  Disponible en plan <span className="font-semibold text-primary-600">PRO</span> o <span className="font-semibold text-primary-600">NEGOCIO</span>.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Período */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-[var(--border-subtle)] px-4 py-3 sm:px-5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-xl px-4 py-1.5 text-xs font-semibold transition-all duration-150 ${period === p.key ? pActive : pInactive}`}
            >
              {p.label}
            </button>
          ))}
          {period === 'custom' && (
            <>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className={dateInputCls} />
              <span className="shrink-0 text-sm text-gray-400">→</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className={dateInputCls} />
            </>
          )}
        </div>

        {/* Sub-pestañas */}
        <div className="flex gap-1 overflow-x-auto border-t border-[var(--border-subtle)] px-4 py-2.5 sm:px-5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${
                activeTab === t.key
                  ? 'bg-primary-600 text-white shadow-[0_2px_6px_oklch(0.60_0.22_42/0.30)]'
                  : 'text-gray-500 hover:bg-[var(--color-surface-2)] hover:text-gray-700'
              }`}
            >
              <Icon name={t.icon} size={14} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido de la pestaña */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : noSales && !['resumen', 'gastos', 'caja'].includes(activeTab) ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Icon name="chart" size={40} strokeWidth={1.5} className="mb-3 opacity-40" />
          <p className="text-sm font-semibold text-gray-500">Sin ventas en este período</p>
          <p className="mt-1 text-xs">Selecciona otro rango de fechas</p>
        </div>
      ) : activeTab === 'resumen' ? (
        <SummaryTab report={report} expenseSummary={expenseSummary} byBranch={branches.byBranch} />
      ) : activeTab === 'ventas' ? (
        <SalesTab
          report={report}
          dailySeries={trends.dailySeries}
          byDayHour={trends.byDayHour}
          isMultiDay={isMultiDay}
          isLoading={trends.loading}
        />
      ) : activeTab === 'productos' ? (
        <ProductsTab
          topProducts={products.topProducts}
          topCategories={cats.topCategories}
          categories={products.categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          loading={products.loading}
          categoriesLoading={cats.loading}
        />
      ) : activeTab === 'clientes' ? (
        <CustomersTab topCustomers={customers.topCustomers} loading={customers.loading} />
      ) : activeTab === 'gastos' ? (
        <ExpensesTab report={report} expenseSummary={expenseSummary} loading={expenseLoading} isMultiDay={isMultiDay} />
      ) : (
        <CashTab byCashier={cash.byCashier} cashSessions={cash.cashSessions} loading={cash.loading} />
      )}
    </PageShell>
  );
}
