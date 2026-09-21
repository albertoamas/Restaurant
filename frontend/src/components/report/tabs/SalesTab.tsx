import type { DailyReportDto, DailySeriesItemDto, DayHourDataDto } from '@pos/shared';
import { Card } from '../../ui/Card';
import { Spinner } from '../../ui/Spinner';
import { Icon } from '../../ui/Icon';
import { SalesAreaChart } from '../charts/SalesAreaChart';
import { HeatMapChart } from '../charts/HeatMapChart';

function delta(current: number, prev: number | null | undefined): number | null {
  if (!prev || prev === 0) return null;
  return ((current - prev) / prev) * 100;
}

interface KpiCardProps {
  label: string;
  value: string;
  /** Valor absoluto del período anterior, como contexto. */
  prevValue?: string;
  pct: number | null;
  accent: string;
  bg: string;
  iconName: string;
}

function KpiCard({ label, value, prevValue, pct, accent, bg, iconName }: KpiCardProps) {
  const isUp      = pct !== null && pct >= 0;
  const hasChange = pct !== null;

  return (
    <div
      className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-[var(--border-subtle)] p-4 shadow-card-lg"
      style={{ background: 'var(--color-surface-card)' }}
    >
      <div className={`absolute -right-5 -top-5 h-24 w-24 rounded-full opacity-20 blur-2xl ${bg}`} />
      <div className="relative flex items-center justify-between">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm [&_svg]:h-[18px] [&_svg]:w-[18px] ${bg} ${accent}`}>
          <Icon name={iconName as Parameters<typeof Icon>[0]['name']} size={18} />
        </div>
        {hasChange && (
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${
            isUp
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
              : 'border-red-500/20 bg-red-500/10 text-red-500'
          }`}>
            {isUp ? '↑' : '↓'} {Math.abs(pct!).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="relative">
        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
        <p className="font-heading text-xl font-black leading-tight text-gray-900">{value}</p>
        {hasChange && (
          <p className="mt-0.5 text-[10px] text-gray-500">
            vs período anterior
            {prevValue && <span className="ml-1 text-gray-400">({prevValue})</span>}
          </p>
        )}
      </div>
    </div>
  );
}

interface Props {
  report: DailyReportDto | null;
  prevReport: DailyReportDto | null;
  dailySeries: DailySeriesItemDto[];
  byDayHour: DayHourDataDto[];
  isMultiDay: boolean;
  isLoading: boolean;
}

/** Cómo evolucionaron las ventas: comparación, tendencia diaria y horarios. */
export function SalesTab({ report, prevReport, dailySeries, byDayHour, isMultiDay, isLoading }: Props) {
  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  const salesDelta  = delta(report?.totalSales    ?? 0, prevReport?.totalSales);
  const ordersDelta = delta(report?.orderCount    ?? 0, prevReport?.orderCount);
  const ticketDelta = delta(report?.averageTicket ?? 0, prevReport?.averageTicket);

  const prevSales  = prevReport?.totalSales    != null ? `Bs ${prevReport.totalSales.toFixed(0)}`    : undefined;
  const prevOrders = prevReport?.orderCount    != null ? String(prevReport.orderCount)               : undefined;
  const prevTicket = prevReport?.averageTicket != null ? `Bs ${prevReport.averageTicket.toFixed(2)}` : undefined;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

      {isMultiDay && dailySeries.length >= 2 && (
        <Card variant="panel">
          <h3 className="mb-0.5 font-heading text-sm font-bold text-gray-700">Evolución de Ventas</h3>
          <p className="mb-4 text-[11px] text-gray-400">
            Ventas (Bs) día a día · línea punteada = pedidos (escala propia)
          </p>
          <SalesAreaChart data={dailySeries} />
        </Card>
      )}

      <Card variant="panel">
        <h3 className="mb-0.5 font-heading text-sm font-bold text-gray-700">Mapa de Calor — Hora × Día</h3>
        <p className="mb-4 text-[11px] text-gray-400">
          Intensidad de ventas por franja horaria y día de semana · pasa el cursor para el detalle
        </p>
        {byDayHour.length > 0 ? (
          <HeatMapChart data={byDayHour} />
        ) : (
          <div className="flex h-24 items-center justify-center text-gray-400">
            <p className="text-xs">Sin datos en este período</p>
          </div>
        )}
      </Card>
    </div>
  );
}
