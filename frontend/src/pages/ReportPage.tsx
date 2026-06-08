import { useState } from 'react';
import { SaasPlan } from '@pos/shared';
import { useSettingsStore } from '../store/settings.store';
import { useReportFilters, type Period } from '../hooks/useReportFilters';
import { useReportData } from '../hooks/useReportData';
import { useAdvancedReportData } from '../hooks/useAdvancedReportData';
import { PageShell } from '../components/ui/PageShell';
import { Icon } from '../components/ui/Icon';
import { ReportTab } from '../components/report/ReportTab';
import { AdvancedTab } from '../components/report/AdvancedTab';
import { downloadExcel } from '../utils/excel';
import { useAuth } from '../context/auth.context';

type TabKey = 'reportes' | 'avanzados';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'reportes',  label: 'Reportes'  },
  { key: 'avanzados', label: 'Avanzados' },
];

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today',  label: 'Hoy'          },
  { key: 'week',   label: 'Esta semana'  },
  { key: 'month',  label: 'Este mes'     },
  { key: 'custom', label: 'Rango'        },
];

export function ReportPage() {
  const { user } = useAuth();
  const plan      = useSettingsStore((s) => s.plan);
  const canExport = plan !== SaasPlan.BASICO;

  const [activeTab, setActiveTab] = useState<TabKey>('reportes');

  const filters = useReportFilters();
  const { period, setPeriod, customFrom, setCustomFrom, customTo, setCustomTo,
          rangeLabel, isMultiDay, utcFrom, utcTo, branchParam,
          selectedCategory, setSelectedCategory, from, to,
          prevUtcFrom, prevUtcTo } = filters;

  const reportData   = useReportData(utcFrom, utcTo, branchParam, selectedCategory);
  const advancedData = useAdvancedReportData(
    utcFrom, utcTo, branchParam, isMultiDay, activeTab === 'avanzados',
    prevUtcFrom, prevUtcTo,
  );

  const handleExportExcel = () => {
    if (!reportData.report) return;
    const filename = from === to ? `reporte_${from}.xlsx` : `reporte_${from}_${to}.xlsx`;
    downloadExcel(rangeLabel, reportData.report, reportData.topProducts, reportData.topCustomers, reportData.expenseSummary, filename);
  };

  const pActive   = 'bg-primary-600 text-white border border-primary-600 shadow-[0_2px_8px_oklch(0.45_0.16_235/0.22)]';
  const pInactive = 'bg-white/5 border border-white/10 text-gray-500 hover:border-primary-500/40 hover:text-primary-400';

  return (
    <PageShell>
      {/* Print-only header */}
      <div className="hidden print:block mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">{user?.tenantName ?? 'Reporte de Ventas'}</h1>
        <p className="text-sm text-gray-600 mt-0.5">Reporte · {rangeLabel}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Generado el {new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── Header card ──────────────────────────────────────────────── */}
      <div data-print-hide className="rounded-2xl border border-white/8 shadow-[0_10px_30px_oklch(0.06_0.010_38/0.6)] p-4 sm:p-5 mb-5" style={{ background: 'var(--color-surface-card)' }}>

        {/* Title + export */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="font-heading text-xl sm:text-2xl font-black text-gray-900">Reporte y Rendimiento</h2>
            <p className="text-xs text-gray-500 mt-0.5">Vista consolidada de ventas, gastos y desempeño por periodo.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-100/60 border border-primary-500/25 text-primary-400">
              {rangeLabel}
            </span>
            {activeTab === 'reportes' && (
              canExport ? (
                <>
                  <button onClick={handleExportExcel} disabled={!reportData.report || reportData.loading} title="Exportar a Excel"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-gray-600 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-500/8 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed">
                    <Icon name="download" size={14} />Excel
                  </button>
                  <button onClick={() => window.print()} disabled={!reportData.report || reportData.loading} title="Imprimir / PDF"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-gray-600 hover:border-primary-400 hover:text-primary-700 hover:bg-primary-500/8 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed">
                    <Icon name="print" size={14} />PDF
                  </button>
                </>
              ) : (
                <div className="relative group">
                  <button disabled className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-400 cursor-not-allowed">
                    <Icon name="lock" size={14} />Exportar
                  </button>
                  <div className="absolute right-0 top-full mt-1.5 z-10 hidden group-hover:block w-48 rounded-xl border border-white/10 shadow-lg px-3 py-2.5 text-xs text-gray-500 leading-snug" style={{ background: 'var(--color-surface-card)' }}>
                    Disponible en plan <span className="font-semibold text-primary-600">PRO</span> o <span className="font-semibold text-primary-600">NEGOCIO</span>.
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 p-1 rounded-xl bg-white/5 border border-white/8 w-fit">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                activeTab === t.key
                  ? 'bg-primary-600 text-white shadow-[0_1px_6px_oklch(0.45_0.16_235/0.30)]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Period selector */}
        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map((p) => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${period === p.key ? pActive : pInactive}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom range */}
      {period === 'custom' && (
        <div data-print-hide className="flex items-center gap-2 mb-4 rounded-2xl border border-white/8 p-3" style={{ background: 'var(--color-surface-card)' }}>
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
            className="border border-white/10 rounded-xl px-3 py-2 text-sm bg-[var(--color-surface-card)] text-gray-700 [color-scheme:dark] focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500/50 transition-[border-color,box-shadow]" />
          <span className="text-gray-400 text-sm">→</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
            className="border border-white/10 rounded-xl px-3 py-2 text-sm bg-[var(--color-surface-card)] text-gray-700 [color-scheme:dark] focus:outline-none focus:ring-[3px] focus:ring-primary-500/20 focus:border-primary-500/50 transition-[border-color,box-shadow]" />
        </div>
      )}

      {/* Tab content */}
      {activeTab === 'reportes' ? (
        <ReportTab
          {...reportData}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      ) : (
        <AdvancedTab
          report={reportData.report}
          prevReport={advancedData.prevReport}
          dailySeries={advancedData.dailySeries}
          byCashier={advancedData.byCashier}
          topCategories={advancedData.topCategories}
          byHour={advancedData.byHour}
          byDayHour={advancedData.byDayHour}
          cashSessions={advancedData.cashSessions}
          isMultiDay={isMultiDay}
          isLoading={advancedData.isLoading}
        />
      )}
    </PageShell>
  );
}
