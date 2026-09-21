import type { DailyReportDto, DailySeriesItemDto, DayHourDataDto } from '@pos/shared';
import { Card } from '../../ui/Card';
import { Spinner } from '../../ui/Spinner';
import { Icon } from '../../ui/Icon';
import { StatCard } from '../index';
import { SalesAreaChart } from '../charts/SalesAreaChart';
import { OrdersAreaChart } from '../charts/OrdersAreaChart';
import { HeatMapChart } from '../charts/HeatMapChart';

interface Props {
  report: DailyReportDto | null;
  dailySeries: DailySeriesItemDto[];
  byDayHour: DayHourDataDto[];
  isMultiDay: boolean;
  isLoading: boolean;
}

/** Cómo evolucionaron las ventas: totales, tendencia diaria y horarios. */
export function SalesTab({ report, dailySeries, byDayHour, isMultiDay, isLoading }: Props) {
  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Ventas"
          value={`Bs ${(report?.totalSales ?? 0).toFixed(0)}`}
          icon={<Icon name="dollar" size={20} />}
          accent="text-emerald-400" bg="bg-emerald-500/10"
        />
        <StatCard
          label="Pedidos"
          value={String(report?.orderCount ?? 0)}
          icon={<Icon name="orders" size={20} />}
          accent="text-primary-400" bg="bg-primary-500/10"
        />
        <StatCard
          label="Ticket Prom."
          value={`Bs ${(report?.averageTicket ?? 0).toFixed(2)}`}
          icon={<Icon name="receipt" size={20} />}
          accent="text-violet-400" bg="bg-violet-500/10"
        />
      </div>

      {isMultiDay && dailySeries.length >= 2 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card variant="panel">
            <h3 className="mb-0.5 font-heading text-sm font-bold text-gray-700">Evolución de Ventas</h3>
            <p className="mb-4 text-[11px] text-gray-400">Ventas (Bs) día a día</p>
            <SalesAreaChart data={dailySeries} />
          </Card>
          <Card variant="panel">
            <h3 className="mb-0.5 font-heading text-sm font-bold text-gray-700">Evolución de Pedidos</h3>
            <p className="mb-4 text-[11px] text-gray-400">Cantidad de pedidos día a día</p>
            <OrdersAreaChart data={dailySeries} />
          </Card>
        </div>
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
