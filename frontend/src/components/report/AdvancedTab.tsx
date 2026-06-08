import type {
  CashierReportDto,
  CashSessionReportItemDto,
  DailyReportDto,
  DailySeriesItemDto,
  DayHourDataDto,
  HourlyDataDto,
  TopCategoryDto,
} from '@pos/shared';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { Icon } from '../ui/Icon';
import { SalesAreaChart } from './charts/SalesAreaChart';
import { DonutChart, type DonutSlice } from './charts/DonutChart';
import { HourlyBarChart } from './charts/HourlyBarChart';
import { HeatMapChart } from './charts/HeatMapChart';
import { AvgTicketChart } from './charts/AvgTicketChart';
import { CategoryBarChart } from './charts/CategoryBarChart';
import { CashierBarChart } from './charts/CashierBarChart';
import { C } from './charts/chartColors';

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
  label:    string;
  value:    string;
  pct:      number | null;
  accent:   string;
  bg:       string;
  iconName: string;
}

function KpiCard({ label, value, pct, accent, bg, iconName }: KpiCardProps) {
  const isUp      = pct !== null && pct >= 0;
  const hasChange = pct !== null;

  return (
    <div
      className="relative rounded-2xl border border-white/8 shadow-[0_8px_28px_oklch(0.06_0.010_38/0.6)] p-4 flex flex-col gap-3 overflow-hidden"
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
          <p className="text-[10px] text-gray-500 mt-0.5">vs período anterior</p>
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
  byHour:        HourlyDataDto[];
  byDayHour:     DayHourDataDto[];
  cashSessions:  CashSessionReportItemDto[];
  isMultiDay:    boolean;
  isLoading:     boolean;
}

export function AdvancedTab({
  report, prevReport,
  dailySeries, byCashier, topCategories, byHour, byDayHour,
  cashSessions, isMultiDay, isLoading,
}: Props) {
  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  /* donut slices */
  const paymentSlices: DonutSlice[] = report ? [
    { name: 'Efectivo',      value: report.paymentBreakdown.cash,     color: C.emerald },
    { name: 'QR',            value: report.paymentBreakdown.qr,       color: C.primary },
    { name: 'Transferencia', value: report.paymentBreakdown.transfer, color: C.violet  },
    { name: 'Cortesía',      value: report.paymentBreakdown.cortesia, color: C.amber   },
  ] : [];

  const typeSlices: DonutSlice[] = report ? [
    { name: 'Local',       value: report.ordersByType.dineIn,   color: C.primary },
    { name: 'Para Llevar', value: report.ordersByType.takeout,  color: C.amber   },
    { name: 'Delivery',    value: report.ordersByType.delivery, color: C.violet  },
  ] : [];

  /* KPI deltas */
  const salesDelta  = delta(report?.totalSales  ?? 0, prevReport?.totalSales);
  const ordersDelta = delta(report?.orderCount  ?? 0, prevReport?.orderCount);
  const ticketDelta = delta(report?.averageTicket ?? 0, prevReport?.averageTicket);

  /* avg ticket for reference line in AvgTicketChart */
  const prevAvgTicket = prevReport?.averageTicket;

  return (
    <div className="space-y-4">

      {/* ── Row 0: KPIs con variación ──────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          label="Ventas"
          value={`Bs ${(report?.totalSales ?? 0).toFixed(0)}`}
          pct={salesDelta}
          accent="text-emerald-400" bg="bg-emerald-500/10" iconName="dollar"
        />
        <KpiCard
          label="Pedidos"
          value={String(report?.orderCount ?? 0)}
          pct={ordersDelta}
          accent="text-primary-400" bg="bg-primary-500/10" iconName="orders"
        />
        <KpiCard
          label="Ticket Prom."
          value={`Bs ${(report?.averageTicket ?? 0).toFixed(2)}`}
          pct={ticketDelta}
          accent="text-violet-400" bg="bg-violet-500/10" iconName="receipt"
        />
      </div>

      {/* ── Row 1: Evolución diaria (multi-día) ────────────────────────── */}
      {isMultiDay ? (
        dailySeries.length >= 2 ? (
          <Card variant="panel">
            <h3 className="text-sm font-bold text-gray-700 mb-0.5 font-heading">Evolución de Ventas</h3>
            <p className="text-[11px] text-gray-400 mb-4">Ventas (Bs) y pedidos día a día</p>
            <SalesAreaChart data={dailySeries} />
          </Card>
        ) : null
      ) : null}

      {/* ── Row 2: Ticket promedio en el tiempo (multi-día) ────────────── */}
      {isMultiDay && dailySeries.length >= 2 && (
        <Card variant="panel">
          <h3 className="text-sm font-bold text-gray-700 mb-0.5 font-heading">Ticket Promedio Diario</h3>
          <p className="text-[11px] text-gray-400 mb-4">
            Evolución del valor promedio por pedido · línea punteada = período anterior
          </p>
          <AvgTicketChart data={dailySeries} prevAvgTicket={prevAvgTicket} />
        </Card>
      )}

      {/* ── Row 3: Donuts ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card variant="panel">
          <h3 className="text-sm font-bold text-gray-700 mb-0.5 font-heading">Métodos de Pago</h3>
          <p className="text-[11px] text-gray-400 mb-3">Distribución del total facturado</p>
          <DonutChart
            data={paymentSlices}
            total={report?.totalSales ?? 0}
            label="Total"
            formatter={(v) => `Bs ${Number(v).toFixed(2)}`}
          />
        </Card>
        <Card variant="panel">
          <h3 className="text-sm font-bold text-gray-700 mb-0.5 font-heading">Tipo de Pedido</h3>
          <p className="text-[11px] text-gray-400 mb-3">Distribución por canal de venta</p>
          <DonutChart
            data={typeSlices}
            total={report?.orderCount ?? 0}
            label="Pedidos"
            formatter={(v, name) => `${name}: ${v}`}
          />
        </Card>
      </div>

      {/* ── Row 4: Mapa de calor Hora × Día ────────────────────────────── */}
      <Card variant="panel">
        <h3 className="text-sm font-bold text-gray-700 mb-0.5 font-heading">Mapa de Calor — Hora × Día</h3>
        <p className="text-[11px] text-gray-400 mb-4">
          Intensidad de ventas por franja horaria y día de semana · pasa el cursor para ver el detalle
        </p>
        {byDayHour.length > 0 ? (
          <HeatMapChart data={byDayHour} />
        ) : (
          <div className="flex items-center justify-center h-24 text-gray-400">
            <p className="text-xs">Sin datos en este período</p>
          </div>
        )}
      </Card>

      {/* ── Row 5: Ventas por hora (bar) ───────────────────────────────── */}
      <Card variant="panel">
        <h3 className="text-sm font-bold text-gray-700 mb-0.5 font-heading">Ventas por Hora</h3>
        <p className="text-[11px] text-gray-400 mb-4">
          Total acumulado por franja horaria en el período seleccionado
        </p>
        {byHour.length > 0 ? (
          <HourlyBarChart data={byHour} />
        ) : (
          <div className="flex items-center justify-center h-24 text-gray-400">
            <p className="text-xs">Sin datos en este período</p>
          </div>
        )}
      </Card>

      {/* ── Row 6: Categorías + Cajeros ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

        <Card variant="panel">
          <h3 className="text-sm font-bold text-gray-700 mb-0.5 font-heading">Rendimiento por Cajero</h3>
          <p className="text-[11px] text-gray-400 mb-4">Ventas totales y pedidos atendidos</p>
          {byCashier.length > 0 ? (
            <CashierBarChart data={byCashier} />
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Icon name="users" size={28} strokeWidth={1.5} className="mb-2 opacity-40" />
              <p className="text-xs">Sin datos para este período</p>
            </div>
          )}
        </Card>
      </div>

      {/* ── Row 7: Arqueos de caja ─────────────────────────────────────── */}
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
                <tr className="border-b border-white/8">
                  <th className="text-left font-semibold text-gray-400 pb-2 pr-3 pl-1">Sucursal</th>
                  <th className="text-left font-semibold text-gray-400 pb-2 pr-3">Apertura</th>
                  <th className="text-left font-semibold text-gray-400 pb-2 pr-3">Cierre</th>
                  <th className="text-right font-semibold text-gray-400 pb-2 pr-3">Inicial</th>
                  <th className="text-right font-semibold text-gray-400 pb-2 pr-3">Esperado</th>
                  <th className="text-right font-semibold text-gray-400 pb-2 pr-3">Real</th>
                  <th className="text-right font-semibold text-gray-400 pb-2 pr-1">Diferencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {cashSessions.map((s) => {
                  const diff = s.difference;
                  const diffColor =
                    diff == null ? 'text-gray-400' :
                    diff > 0    ? 'text-emerald-500' :
                    diff < 0    ? 'text-red-500'     : 'text-gray-500';
                  return (
                    <tr key={s.id} className="hover:bg-white/3 transition-colors">
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
