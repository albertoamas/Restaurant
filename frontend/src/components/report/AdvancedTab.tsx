import type {
  CashierReportDto,
  CashSessionReportItemDto,
  DailyReportDto,
  DailySeriesItemDto,
  DayHourDataDto,
  TopCategoryDto,
} from '@pos/shared';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { Icon } from '../ui/Icon';
import { SalesAreaChart } from './charts/SalesAreaChart';
import { HeatMapChart } from './charts/HeatMapChart';
import { CategoryBarChart } from './charts/CategoryBarChart';
import { CashierRankingTable } from './charts/CashierRankingTable';

/* ── helpers ─────────────────────────────────────────────────────────────── */

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-BO', {
    timeZone: 'America/La_Paz', hour: '2-digit', minute: '2-digit',
  });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-BO', {
    timeZone: 'America/La_Paz', day: '2-digit', month: 'short',
  });
}

function delta(current: number, prev: number | null | undefined): number | null {
  if (!prev || prev === 0) return null;
  return ((current - prev) / prev) * 100;
}

/* ── KPI card with period-over-period variation ───────────────────────────── */

interface KpiCardProps {
  label:      string;
  value:      string;
  prevValue?: string;   // absolute value of the previous period shown as context
  pct:        number | null;
  accent:     string;
  bg:         string;
  iconName:   string;
}

function KpiCard({ label, value, prevValue, pct, accent, bg, iconName }: KpiCardProps) {
  const isUp      = pct !== null && pct >= 0;
  const hasChange = pct !== null;

  return (
    <div
      className="relative rounded-2xl border border-[var(--border-subtle)] shadow-card-lg p-4 flex flex-col gap-3 overflow-hidden"
      style={{ background: 'var(--color-surface-card)' }}
    >
      <div className={`absolute -top-5 -right-5 w-24 h-24 rounded-full opacity-20 blur-2xl ${bg}`} />
      <div className="relative flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm [&_svg]:w-[18px] [&_svg]:h-[18px] ${bg} ${accent}`}>
          <Icon name={iconName as Parameters<typeof Icon>[0]['name']} size={18} />
        </div>
        {hasChange && (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
            isUp
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              : 'bg-red-500/10 text-red-500 border-red-500/20'
          }`}>
            {isUp ? '↑' : '↓'} {Math.abs(pct!).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="relative">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="font-heading font-black text-xl text-gray-900 leading-tight">{value}</p>
        {hasChange && (
          <p className="text-[10px] text-gray-500 mt-0.5">
            vs período anterior
            {prevValue && <span className="text-gray-400 ml-1">({prevValue})</span>}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── component ───────────────────────────────────────────────────────────── */

interface Props {
  report:        DailyReportDto | null;
  prevReport:    DailyReportDto | null;
  dailySeries:   DailySeriesItemDto[];
  byCashier:     CashierReportDto[];
  topCategories: TopCategoryDto[];
  byDayHour:     DayHourDataDto[];
  cashSessions:  CashSessionReportItemDto[];
  isMultiDay:    boolean;
  isLoading:     boolean;
}

export function AdvancedTab({
  report, prevReport,
  dailySeries, byCashier, topCategories, byDayHour,
  cashSessions, isMultiDay, isLoading,
}: Props) {
  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  /* KPI deltas */
  const salesDelta  = delta(report?.totalSales   ?? 0, prevReport?.totalSales);
  const ordersDelta = delta(report?.orderCount   ?? 0, prevReport?.orderCount);
  const ticketDelta = delta(report?.averageTicket ?? 0, prevReport?.averageTicket);

  /* Previous-period absolute values for context label */
  const prevSales  = prevReport?.totalSales   != null ? `Bs ${prevReport.totalSales.toFixed(0)}`   : undefined;
  const prevOrders = prevReport?.orderCount   != null ? String(prevReport.orderCount)              : undefined;
  const prevTicket = prevReport?.averageTicket != null ? `Bs ${prevReport.averageTicket.toFixed(2)}` : undefined;

  return (
    <div className="space-y-4">

      {/* ── Row 0: KPIs con variación — responsive ─────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard
          label="Ventas"
          value={`Bs ${(report?.totalSales ?? 0).toFixed(0)}`}
          prevValue={prevSales}
          pct={salesDelta}
          accent="text-emerald-400" bg="bg-emerald-500/10" iconName="dollar"
        />
        <KpiCard
          label="Pedidos"
          value={String(report?.orderCount ?? 0)}
          prevValue={prevOrders}
          pct={ordersDelta}
          accent="text-primary-400" bg="bg-primary-500/10" iconName="orders"
        />
        <KpiCard
          label="Ticket Prom."
          value={`Bs ${(report?.averageTicket ?? 0).toFixed(2)}`}
          prevValue={prevTicket}
          pct={ticketDelta}
          accent="text-violet-400" bg="bg-violet-500/10" iconName="receipt"
        />
      </div>

      {/* ── Row 1: Evolución diaria (solo multi-día, ≥2 puntos) ─────────── */}
      {isMultiDay && dailySeries.length >= 2 && (
        <Card variant="panel">
          <h3 className="text-sm font-bold text-gray-700 mb-0.5 font-heading">Evolución de Ventas</h3>
          <p className="text-[11px] text-gray-400 mb-4">
            Ventas (Bs) día a día · línea punteada = pedidos (escala propia)
          </p>
          <SalesAreaChart data={dailySeries} />
        </Card>
      )}

      {/* ── Row 2: Mapa de calor Hora × Día ─────────────────────────────── */}
      <Card variant="panel">
        <h3 className="text-sm font-bold text-gray-700 mb-0.5 font-heading">Mapa de Calor — Hora × Día</h3>
        <p className="text-[11px] text-gray-400 mb-4">
          Intensidad de ventas por franja horaria y día de semana · pasa el cursor para el detalle
        </p>
        {byDayHour.length > 0 ? (
          <HeatMapChart data={byDayHour} />
        ) : (
          <div className="flex items-center justify-center h-24 text-gray-400">
            <p className="text-xs">Sin datos en este período</p>
          </div>
        )}
      </Card>

      {/* ── Row 3: Cajeros + Categorías ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card variant="panel">
          <h3 className="text-sm font-bold text-gray-700 mb-0.5 font-heading">Rendimiento por Cajero</h3>
          <p className="text-[11px] text-gray-400 mb-4">Ranking por ventas · ticket promedio por cajero</p>
          {byCashier.length > 0 ? (
            <CashierRankingTable data={byCashier} />
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Icon name="users" size={28} strokeWidth={1.5} className="mb-2 opacity-40" />
              <p className="text-xs">Sin datos para este período</p>
            </div>
          )}
        </Card>

        <Card variant="panel">
          <h3 className="text-sm font-bold text-gray-700 mb-0.5 font-heading">Categorías Más Vendidas</h3>
          <p className="text-[11px] text-gray-400 mb-4">Toggle entre unidades e ingresos</p>
          {topCategories.length > 0 ? (
            <CategoryBarChart data={topCategories} />
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Icon name="package" size={28} strokeWidth={1.5} className="mb-2 opacity-40" />
              <p className="text-xs">Sin datos para este período</p>
            </div>
          )}
        </Card>
      </div>

      {/* ── Row 4: Arqueos de caja ────────────────────────────────────────── */}
      <Card variant="panel">
        <h3 className="text-sm font-bold text-gray-700 mb-0.5 font-heading">Arqueos de Caja</h3>
        <p className="text-[11px] text-gray-400 mb-4">Historial de sesiones en el período</p>

        {cashSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <Icon name="dollar" size={28} strokeWidth={1.5} className="mb-2 opacity-40" />
            <p className="text-xs">Sin sesiones de caja en este período</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs min-w-[560px]">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="text-left font-semibold text-gray-400 pb-2 pr-3 pl-1">Sucursal</th>
                  <th className="text-left font-semibold text-gray-400 pb-2 pr-3">Apertura</th>
                  <th className="text-left font-semibold text-gray-400 pb-2 pr-3">Cierre</th>
                  <th className="text-right font-semibold text-gray-400 pb-2 pr-3">Inicial</th>
                  <th className="text-right font-semibold text-gray-400 pb-2 pr-3">Esperado</th>
                  <th className="text-right font-semibold text-gray-400 pb-2 pr-3">Real</th>
                  <th className="text-right font-semibold text-gray-400 pb-2 pr-1">Diferencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {cashSessions.map((s) => {
                  const diff = s.difference;
                  const diffColor =
                    diff == null ? 'text-gray-400' :
                    diff > 0    ? 'text-emerald-500' :
                    diff < 0    ? 'text-red-500'     : 'text-gray-500';
                  return (
                    <tr key={s.id} className="hover:bg-[var(--color-surface-2)] transition-colors">
                      <td className="py-2.5 pr-3 pl-1 font-medium text-gray-700">{s.branchName}</td>
                      <td className="py-2.5 pr-3 text-gray-500">
                        {fmtDate(s.openedAt)}{' '}<span className="text-gray-400">{fmtTime(s.openedAt)}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-gray-500">
                        {s.closedAt ? (
                          <>{fmtDate(s.closedAt)}{' '}<span className="text-gray-400">{fmtTime(s.closedAt)}</span></>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Abierta
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono text-gray-600">Bs {s.openingAmount.toFixed(2)}</td>
                      <td className="py-2.5 pr-3 text-right font-mono text-gray-600">{s.expectedAmount != null ? `Bs ${s.expectedAmount.toFixed(2)}` : '—'}</td>
                      <td className="py-2.5 pr-3 text-right font-mono text-gray-600">{s.closingAmount  != null ? `Bs ${s.closingAmount.toFixed(2)}`  : '—'}</td>
                      <td className={`py-2.5 pr-1 text-right font-mono font-bold ${diffColor}`}>
                        {diff != null ? `${diff > 0 ? '+' : ''}Bs ${diff.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
