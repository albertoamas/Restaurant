import { useMemo, useState } from 'react';
import type { DailyReportDto, ExpenseItemSummaryDto, ExpenseSummaryDto } from '@pos/shared';
import { EmptyState } from '../../ui/EmptyState';
import { Skeleton } from '../../ui/Skeleton';
import { ExpenseTrendChart } from '../charts/ExpenseTrendChart';
import { ChartCard, Kpi, bs, share } from '../index';
import { ExpenseCategoryRow } from '../ExpenseCategoryRow';
import { ExpenseCategoryModal } from '../ExpenseCategoryModal';
import { groupExpenseItems } from '../../../utils/expense-items-report';
import { legacyExpenseLabel } from '../../../utils/expense-labels';

interface Props {
  report: DailyReportDto | null;
  expenseSummary: ExpenseSummaryDto | null;
  loading: boolean;
  isMultiDay: boolean;
  /** Días del período (hora Bolivia): el gráfico diario muestra también los días sin gastos. */
  days: string[];
  /** Período del reporte, para el subtítulo del detalle de una categoría. */
  rangeLabel: string;
  /** Detalle por ítem: se ve al abrir una categoría. */
  items: ExpenseItemSummaryDto[];
  itemsLoading: boolean;
}

/** En qué se fue el dinero: total del período, gasto por día y desglose por categoría e ítem. */
export function ExpensesTab({ report, expenseSummary, loading, isMultiDay, days, rangeLabel, items, itemsLoading }: Props) {
  const groups = useMemo(() => groupExpenseItems(items), [items]);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

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
  // Si al refrescar la categoría ya no tiene gastos en el período, el detalle se cierra solo.
  const opened = entries.find(([cat]) => cat === openCategory);

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

      <ChartCard title="Gastos por categoría" description={`Total: ${bs(total)}. Toca una categoría para ver en qué se gastó.`}>
        <ul className="space-y-4">
          {entries.map(([cat, amount]) => (
            <ExpenseCategoryRow
              key={cat}
              label={legacyExpenseLabel(cat)}
              amount={amount}
              pct={share(amount, total)}
              onOpen={() => setOpenCategory(cat)}
            />
          ))}
        </ul>
      </ChartCard>

      {opened && (
        <ExpenseCategoryModal
          key={opened[0]}
          label={legacyExpenseLabel(opened[0])}
          period={rangeLabel}
          amount={opened[1]}
          pctOfTotal={share(opened[1], total)}
          group={groups.get(opened[0])}
          loading={itemsLoading}
          onClose={() => setOpenCategory(null)}
        />
      )}
    </div>
  );
}
