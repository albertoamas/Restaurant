import type { DailyReportDto, ExpenseSummaryDto } from '@pos/shared';
import { Card } from '../../ui/Card';
import { Spinner } from '../../ui/Spinner';
import { Icon } from '../../ui/Icon';
import { ExpenseTrendChart } from '../charts/ExpenseTrendChart';
import { StatCard } from '../index';
import { legacyExpenseLabel } from '../../../utils/expense-labels';

interface Props {
  report: DailyReportDto | null;
  expenseSummary: ExpenseSummaryDto | null;
  loading: boolean;
  isMultiDay: boolean;
}

/** En qué se fue la plata: total del período, tendencia diaria y desglose por categoría. */
export function ExpensesTab({ report, expenseSummary, loading, isMultiDay }: Props) {
  if (loading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  const total = expenseSummary?.total ?? 0;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Icon name="receipt" size={40} strokeWidth={1.5} className="mb-3 opacity-40" />
        <p className="text-sm font-semibold text-gray-500">Sin gastos en este período</p>
        <p className="mt-1 text-xs">Regístralos desde la pestaña Gastos</p>
      </div>
    );
  }

  const sales     = report?.totalSales ?? 0;
  const ratio     = sales > 0 ? (total / sales) * 100 : null;
  const entries   = (Object.entries(expenseSummary!.byCategory) as [string, number][])
    .filter(([, amount]) => amount > 0)
    .sort(([, a], [, b]) => b - a);
  const byDayEntries = Object.keys(expenseSummary!.byDay).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Total gastado"
          value={`Bs ${total.toFixed(2)}`}
          icon={<Icon name="minus" size={20} />}
          accent="text-red-400" bg="bg-red-500/10"
          valueClassName="text-red-600"
        />
        <StatCard
          label="Movimientos"
          value={String(expenseSummary!.transactionCount)}
          icon={<Icon name="receipt" size={20} />}
          accent="text-violet-400" bg="bg-violet-500/10"
        />
        <StatCard
          label="Peso sobre ventas"
          value={ratio !== null ? `${ratio.toFixed(1)}%` : '—'}
          icon={<Icon name="chart" size={20} />}
          accent="text-sky-400" bg="bg-sky-500/10"
        />
      </div>

      {isMultiDay && byDayEntries >= 2 && (
        <Card variant="panel">
          <h3 className="mb-0.5 font-heading text-sm font-bold text-gray-700">Evolución de Gastos</h3>
          <p className="mb-4 text-[11px] text-gray-400">Gasto (Bs) día a día en el período</p>
          <ExpenseTrendChart byDay={expenseSummary!.byDay} />
        </Card>
      )}

      <Card variant="panel">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-sm font-bold text-gray-700">Gastos por Categoría</h3>
          <span className="font-heading text-sm font-bold text-red-500">Bs {total.toFixed(2)}</span>
        </div>
        <div className="space-y-3">
          {entries.map(([cat, amount]) => (
            <div key={cat}>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="font-medium text-gray-600">{legacyExpenseLabel(cat)}</span>
                <span className="font-heading font-bold text-gray-900">Bs {amount.toFixed(2)}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-3)]">
                <div
                  className="h-full rounded-full bg-red-400 transition-[width] duration-700"
                  style={{ width: `${(amount / total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
