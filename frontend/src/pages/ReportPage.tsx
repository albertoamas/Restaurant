import { useState, useMemo, useEffect } from 'react';
import { SaasPlan } from '@pos/shared';
import { useSettingsStore } from '../store/settings.store';
import { useReportFilters, type Period } from '../hooks/useReportFilters';
import { useReportSummary, useTopProductsReport, useTopCustomersReport, useExpenseItemsReport } from '../hooks/useReportData';
import { useSalesTrends, useTopCategoriesReport, useCashReport, useBranchComparison } from '../hooks/useAdvancedReportData';
import { reportsApi } from '../api/reports.api';
import { expensesApi } from '../api/expenses.api';
import { PageShell } from '../components/ui/PageShell';
import { Icon } from '../components/ui/Icon';
import type { IconName } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Input, Select } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Skeleton } from '../components/ui/Skeleton';
import { TabBar } from '../components/ui/TabBar';
import { SummaryTab } from '../components/report/tabs/SummaryTab';
import { SalesTab } from '../components/report/tabs/SalesTab';
import { ProductsTab } from '../components/report/tabs/ProductsTab';
import { CustomersTab } from '../components/report/tabs/CustomersTab';
import { ExpensesTab } from '../components/report/tabs/ExpensesTab';
import { CashTab } from '../components/report/tabs/CashTab';
import { BranchesTab } from '../components/report/tabs/BranchesTab';
import { useBranches, useBranchNames } from '../hooks/useBranches';
import { downloadExcel } from '../utils/excel';
import { printReportDocument } from '../utils/report-print';
import { buildPrintTables } from '../components/report/print-tables';
import { eachDay } from '../utils/date';
import { handleApiError } from '../utils/api-error';
import { useAuth } from '../context/auth.context';

type TabKey = 'resumen' | 'ventas' | 'sucursales' | 'productos' | 'clientes' | 'gastos' | 'caja';

/**
 * `advanced` marca las pestañas que el plan vende aparte (ver
 * plan.advancedReports). Solo se marcan las que el backend hace cumplir de
 * verdad con `@RequiresModule('advancedReportsEnabled')`: Gastos no entra
 * porque se alimenta de `/expenses/summary`, que el módulo de gastos deja
 * abierto y la pantalla /expenses ya muestra.
 *
 * `multiBranch` marca la pestaña que solo aparece con más de una sucursal. No
 * depende del plan: cualquier negocio con varios locales tiene que poder
 * compararlos, y un plan de una sola sucursal nunca llega a mostrarla.
 */
const TABS: { key: TabKey; label: string; icon: IconName; advanced?: boolean; multiBranch?: boolean }[] = [
  { key: 'resumen',    label: 'Resumen',    icon: 'chart'    },
  { key: 'ventas',     label: 'Ventas',     icon: 'dollar'   },
  { key: 'sucursales', label: 'Sucursales', icon: 'building', multiBranch: true },
  { key: 'gastos',     label: 'Gastos',     icon: 'receipt'  },
  { key: 'caja',      label: 'Caja',      icon: 'cash',    advanced: true },
  { key: 'productos', label: 'Productos', icon: 'package', advanced: true },
  { key: 'clientes',  label: 'Clientes',  icon: 'users',   advanced: true },
];

const PERIODS: { value: Period; label: string }[] = [
  { value: 'today',  label: 'Hoy' },
  { value: 'week',   label: 'Esta semana' },
  { value: 'month',  label: 'Este mes' },
  { value: 'custom', label: 'Rango' },
];

export function ReportPage() {
  const { user, currentBranchId } = useAuth();
  const { branchName } = useBranchNames();
  const plan      = useSettingsStore((s) => s.plan);
  const canExport = plan !== SaasPlan.BASICO;

  const advancedReports = useSettingsStore((s) => s.advancedReportsEnabled);
  // Todas las sucursales, activas o no: una ya dada de baja puede tener ventas
  // en el período, y además fijan el color de cada una en los gráficos.
  const { branches } = useBranches();
  const hasManyBranches = branches.length > 1;
  const visibleTabs = useMemo(
    () => TABS.filter((t) =>
      (!t.advanced || advancedReports) && (!t.multiBranch || hasManyBranches)),
    [advancedReports, hasManyBranches],
  );

  const [activeTab, setActiveTab] = useState<TabKey>('resumen');
  const [exporting, setExporting] = useState(false);

  // Si el plan deja de incluir la pestaña abierta (downgrade o revocación en
  // caliente vía socket), se vuelve a Resumen en vez de quedar en una vista
  // cuyos endpoints ahora responden 403.
  useEffect(() => {
    if (!visibleTabs.some((t) => t.key === activeTab)) setActiveTab('resumen');
  }, [visibleTabs, activeTab]);

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
  const compare   = useBranchComparison(fromUtc, toUtc, isMultiDay, activeTab === 'sucursales');
  const expenseItems = useExpenseItemsReport(fromUtc, toUtc, branchParam, activeTab === 'gastos');
  const rangeDays = useMemo(() => eachDay(from, to), [from, to]);

  /**
   * El Excel incluye todas las secciones, así que pide los datos en el momento
   * en vez de depender de qué pestañas se hayan abierto. Las hojas de
   * productos y clientes salen de endpoints que exigen `advancedReports`: sin
   * ese módulo se exporta lo demás en vez de fallar el archivo entero.
   */
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const [fullReport, topProducts, topCustomers, expenses] = await Promise.all([
        reportsApi.getByRange(fromUtc, toUtc, branchParam),
        advancedReports ? reportsApi.getTopProducts(fromUtc, toUtc, branchParam)  : Promise.resolve([]),
        advancedReports ? reportsApi.getTopCustomers(fromUtc, toUtc, branchParam) : Promise.resolve([]),
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

  const activeLabel = TABS.find((t) => t.key === activeTab)?.label ?? '';
  const noSales = !loading && report !== null && report.orderCount === 0 && report.paymentBreakdown.cortesia === 0;
  const scope = currentBranchId ? `Sucursal ${branchName(currentBranchId) ?? 'elegida'}` : 'Todas las sucursales';

  /** Imprime la sección abierta en A4, con las cifras que ya están cargadas en pantalla. */
  const handlePrint = () => {
    printReportDocument(
      {
        businessName: user?.tenantName ?? '',
        section: activeLabel,
        period: rangeLabel,
        // La comparativa entre sucursales siempre cubre todas.
        scope: activeTab === 'sucursales' ? 'Todas las sucursales' : scope,
      },
      buildPrintTables(activeTab, {
        report,
        expenseSummary,
        dailySeries:  trends.dailySeries,
        byBranch:     compare.byBranch,
        byCashier:    cash.byCashier,
        cashSessions: cash.cashSessions,
        topProducts:  products.topProducts,
        topCustomers: customers.topCustomers,
      }),
    );
  };

  return (
    <PageShell>
      <div data-print-hide>
        <PageHeader
          title="Reportes"
          description={`${rangeLabel}. ${scope}.`}
          actions={canExport ? (
            <>
              <Button variant="secondary" onClick={handleExportExcel} loading={exporting} disabled={loading}>
                {!exporting && <Icon name="download" size={18} />}
                Excel
              </Button>
              <Button variant="secondary" onClick={handlePrint} disabled={loading}>
                <Icon name="print" size={18} />
                Imprimir
              </Button>
            </>
          ) : (
            // Visible sin pasar el mouse: en una tablet un tooltip no se ve nunca.
            <span className="inline-flex items-center gap-1.5 text-label text-soft">
              <Icon name="lock" size={16} />
              Exportar e imprimir: planes PRO y NEGOCIO
            </span>
          )}
        >
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
            <SegmentedControl label="Período" wrap value={period} onChange={setPeriod} options={PERIODS} />
            {period === 'custom' && (
              <div className="grid grid-cols-2 gap-3 sm:w-80">
                <Input type="date" label="Desde" value={customFrom} max={customTo} onChange={(e) => setCustomFrom(e.target.value)} />
                <Input type="date" label="Hasta" value={customTo} min={customFrom} onChange={(e) => setCustomTo(e.target.value)} />
              </div>
            )}
          </div>
        </PageHeader>

        {/* Siete secciones: en celular, un desplegable las muestra todas; desde tablet, pestañas. */}
        <div className="mb-5">
          <div className="md:hidden">
            <Select aria-label="Sección del reporte" value={activeTab} onChange={(e) => setActiveTab(e.target.value as TabKey)}>
              {visibleTabs.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </Select>
          </div>
          <div className="hidden md:block">
            <TabBar
              label="Secciones del reporte"
              panelId="report-panel"
              value={activeTab}
              onChange={setActiveTab}
              items={visibleTabs.map((t) => ({ value: t.key, label: t.label, icon: t.icon }))}
            />
          </div>
        </div>
      </div>

      {/* Contenido de la pestaña */}
      <div id="report-panel" role="tabpanel" aria-label={activeLabel}>
      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2"><Skeleton variant="card" /><Skeleton variant="card" /></div>
      ) : noSales && !['resumen', 'gastos', 'caja', 'sucursales'].includes(activeTab) ? (
        // `sucursales` queda fuera: `noSales` mira la sucursal elegida en el
        // menú, y esa pestaña compara todas; tiene su propio estado vacío.
        <EmptyState icon="chart" title="Sin ventas en este período" description="Elige otro período para ver esta sección." />
      ) : activeTab === 'resumen' ? (
        <SummaryTab report={report} expenseSummary={expenseSummary} />
      ) : activeTab === 'sucursales' ? (
        <BranchesTab
          byBranch={compare.byBranch}
          dailyByBranch={compare.dailyByBranch}
          branches={branches}
          days={rangeDays}
          isMultiDay={isMultiDay}
          loading={compare.loading}
        />
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
        <ExpensesTab report={report} expenseSummary={expenseSummary} loading={expenseLoading} isMultiDay={isMultiDay} days={rangeDays} rangeLabel={rangeLabel} items={expenseItems.items} itemsLoading={expenseItems.loading} />
      ) : (
        <CashTab byCashier={cash.byCashier} cashSessions={cash.cashSessions} loading={cash.loading} />
      )}
      </div>
    </PageShell>
  );
}
