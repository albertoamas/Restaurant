import type { DailyReportDto, DailySeriesItemDto, DayHourDataDto } from '@pos/shared';
import { EmptyState } from '../../ui/EmptyState';
import { Skeleton } from '../../ui/Skeleton';
import { ChartCard, Kpi, bs } from '../index';
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
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="max-sm:col-span-2"><Kpi label="Ventas" value={bs(report?.totalSales ?? 0)} /></div>
        <Kpi label="Pedidos" value={String(report?.orderCount ?? 0)} />
        <Kpi label="Ticket promedio" value={bs(report?.averageTicket ?? 0)} />
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2"><Skeleton variant="card" /><Skeleton variant="card" /></div>
      ) : (
        <>
          {isMultiDay && dailySeries.length >= 2 && (
            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title="Ventas por día" description="En bolivianos (Bs).">
                <SalesAreaChart data={dailySeries} />
              </ChartCard>
              <ChartCard title="Pedidos por día" description="Cantidad de pedidos cobrados.">
                <OrdersAreaChart data={dailySeries} />
              </ChartCard>
            </div>
          )}

          <ChartCard
            title="Horas con más ventas"
            description="Cada casilla es una hora de un día de la semana: más intenso, más ventas. Toca o pasa el cursor para ver el detalle."
          >
            {byDayHour.length > 0 ? (
              <HeatMapChart data={byDayHour} />
            ) : (
              <EmptyState compact icon="clock" title="Sin ventas en este período" />
            )}
          </ChartCard>
        </>
      )}
    </div>
  );
}
