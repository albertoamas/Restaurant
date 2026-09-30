import type { DailyReportDto, ExpenseSummaryDto } from '@pos/shared';
import { EmptyState } from '../../ui/EmptyState';
import { Skeleton } from '../../ui/Skeleton';
import { ExpenseTrendChart } from '../charts/ExpenseTrendChart';
import { BreakdownRow, ChartCard, Kpi, bs, share } from '../index';
import { legacyExpenseLabel } from '../../../utils/expense-labels';

interface Props {
  report: DailyReportDto | null;
  expenseSummary: ExpenseSummaryDto | null;
  loading: boolean;
  isMultiDay: boolean;
  /** Días del período (hora Bolivia): el gráfico diario muestra también los días sin gastos. */
  days: string[];
}

/** En qué se fue el dinero: total del período, gasto por día y desglose por categoría. */
export function ExpensesTab({ report, expenseSummary, loading, isMultiDay, days }: Props) {
  if (loading) {
    return <div className="grid gap-4 lg:grid-cols-2"><Skeleton variant="card" /><Skeleton variant="card" /></div>;
  }

  const total = expenseSummary?.total ?? 0;
  if (total === 0) {
    return <EmptyState icon="receipt" title="Sin gastos en este período" description="Los gastos se registran en la pantalla Gastos." />;
  }

  const sales   = report?.totalSales ?? 0;
  const entries = (Object.entries(expenseSummary!.byCategory) as [string, number][])
    .filter(([, amount]) => amount > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="max-sm:col-span-2"><Kpi label="Total gastado" value={bs(total)} /></div>
        <Kpi label="Movimientos" value={String(expenseSummary!.transactionCount)} />
        <Kpi label="Sobre las ventas" value={sales > 0 ? `${share(total, sales).toFixed(1)}%` : '-'} sub="Cuánto de lo vendido se fue en gastos" />
      </div>

      {isMultiDay && days.length >= 2 && (
        <ChartCard title="Gastos por día" description="En bolivianos (Bs). Los días sin gastos quedan en cero.">
          <ExpenseTrendChart byDay={expenseSummary!.byDay} days={days} />
        </ChartCard>
      )}

      <ChartCard title="Gastos por categoría" description={`Total: ${bs(total)}`}>
        <ul className="space-y-4">
          {entries.map(([cat, amount]) => (
            <BreakdownRow key={cat} label={legacyExpenseLabel(cat)} value={bs(amount)} pct={share(amount, total)} color="bg-rose-500" />
          ))}
        </ul>
      </ChartCard>
    </div>
  );
}
