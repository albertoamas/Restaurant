import { OrderType } from '@pos/shared';
import type { DailyReportDto, ExpenseSummaryDto } from '@pos/shared';
import { orderTypeLabels } from '../../../utils/order';
import { BreakdownRow, ChartCard, Kpi, bs, share } from '../index';
import { NetProfitDonut } from '../charts/NetProfitDonut';

interface Props {
  report: DailyReportDto | null;
  expenseSummary: ExpenseSummaryDto | null;
}

/** Mismo color por método que en el resto del reporte (y en el POS). */
const METHOD_COLOR = { cash: 'bg-emerald-500', qr: 'bg-primary-500', transfer: 'bg-purple-500' };
const TYPE_COLOR: Record<OrderType, string> = {
  [OrderType.DINE_IN]:  'bg-primary-500',
  [OrderType.TAKEOUT]:  'bg-amber-500',
  [OrderType.DELIVERY]: 'bg-purple-500',
};

/**
 * Panorama del período: las cifras clave arriba, y debajo el resultado, cómo se cobró y qué
 * tipo de pedido fue. La comparativa entre sucursales vive en su propia pestaña.
 */
export function SummaryTab({ report, expenseSummary }: Props) {
  if (!report) return null;

  const hasExpenses = expenseSummary !== null;
  const expenses    = expenseSummary?.total ?? 0;
  const net         = report.totalSales - expenses;
  const margin      = share(net, report.totalSales);
  const p           = report.paymentBreakdown;
  const types: { type: OrderType; count: number }[] = [
    { type: OrderType.DINE_IN,  count: report.ordersByType.dineIn },
    { type: OrderType.TAKEOUT,  count: report.ordersByType.takeout },
    { type: OrderType.DELIVERY, count: report.ordersByType.delivery },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Ventas" value={bs(report.totalSales)} />
        <Kpi label="Gastos" value={hasExpenses ? bs(expenses) : '-'} />
        <Kpi
          label="Ganancia neta"
          value={`${net < 0 ? '-' : ''}${bs(Math.abs(net))}`}
          tone={net < 0 ? 'negative' : 'positive'}
          sub={report.totalSales > 0 ? `Margen de ${margin.toFixed(1)}%` : undefined}
        />
        <Kpi label="Pedidos" value={String(report.orderCount)} sub={`Ticket promedio ${bs(report.averageTicket)}`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 items-start">
        {hasExpenses && (
          <ChartCard title="Resultado del período" description="Cuánto de lo vendido queda después de los gastos.">
            <NetProfitDonut sales={report.totalSales} expenses={expenses} />
            <dl className="mt-4 space-y-2 text-body">
              <div className="flex justify-between gap-3">
                <dt className="text-soft">Ventas</dt>
                <dd className="text-main tabular-nums">{bs(report.totalSales)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-soft">Gastos</dt>
                <dd className="text-main tabular-nums">-{bs(expenses)}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-line pt-2">
                <dt className="font-semibold text-main">Ganancia neta</dt>
                <dd className={`font-bold tabular-nums ${net < 0 ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                  {net < 0 ? '-' : ''}{bs(Math.abs(net))}
                </dd>
              </div>
            </dl>
          </ChartCard>
        )}

        <ChartCard title="Cómo se cobró" description={`Total cobrado: ${bs(report.totalSales)}`}>
          <ul className="space-y-4">
            <BreakdownRow label="Efectivo"      value={bs(p.cash)}     pct={share(p.cash, report.totalSales)}     color={METHOD_COLOR.cash} />
            <BreakdownRow label="QR"            value={bs(p.qr)}       pct={share(p.qr, report.totalSales)}       color={METHOD_COLOR.qr} />
            <BreakdownRow label="Transferencia" value={bs(p.transfer)} pct={share(p.transfer, report.totalSales)} color={METHOD_COLOR.transfer} />
          </ul>
          {p.cortesia > 0 && (
            <p className="mt-4 rounded-control bg-surface-2 border border-line px-3 py-2 text-label text-soft">
              Cortesías por <span className="font-semibold text-main tabular-nums">{bs(p.cortesia)}</span>: no suman a lo cobrado.
            </p>
          )}
        </ChartCard>

        <ChartCard title="Tipo de pedido" description={`${report.orderCount} ${report.orderCount === 1 ? 'pedido' : 'pedidos'} cobrados`}>
          <ul className="space-y-4">
            {types.map((t) => (
              <BreakdownRow
                key={t.type}
                label={orderTypeLabels[t.type]}
                value={String(t.count)}
                pct={share(t.count, report.orderCount)}
                color={TYPE_COLOR[t.type]}
              />
            ))}
          </ul>
        </ChartCard>
      </div>
    </div>
  );
}
