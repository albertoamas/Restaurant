import type { DailyReportDto, ExpenseSummaryDto } from '@pos/shared';
import { ExpenseCategory } from '@pos/shared';
import { Card } from '../../ui/Card';
import { Spinner } from '../../ui/Spinner';
import { Icon } from '../../ui/Icon';

/** Gastos viejos guardaban la clave del enum; los nuevos, el nombre de la categoría. */
const LEGACY_LABELS: Partial<Record<ExpenseCategory, string>> = {
  [ExpenseCategory.SUPPLIES]:    'Insumos',
  [ExpenseCategory.WAGES]:       'Personal',
  [ExpenseCategory.UTILITIES]:   'Servicios',
  [ExpenseCategory.TRANSPORT]:   'Transporte',
  [ExpenseCategory.MAINTENANCE]: 'Mantenimiento',
  [ExpenseCategory.OTHER]:       'Otro',
};

interface Props {
  report: DailyReportDto | null;
  expenseSummary: ExpenseSummaryDto | null;
  loading: boolean;
}

/** En qué se fue la plata: total del período y desglose por categoría. */
export function ExpensesTab({ report, expenseSummary, loading }: Props) {
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard label="Total gastado" value={`Bs ${total.toFixed(2)}`} tone="negative" />
        <MetricCard
          label="Movimientos"
          value={String(expenseSummary!.transactionCount)}
        />
        <MetricCard
          label="Peso sobre ventas"
          value={ratio !== null ? `${ratio.toFixed(1)}%` : '—'}
          hint={ratio !== null ? `de Bs ${sales.toFixed(2)} vendidos` : 'Sin ventas en el período'}
        />
      </div>

      <Card variant="panel">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-sm font-bold text-gray-700">Gastos por Categoría</h3>
          <span className="font-heading text-sm font-bold text-red-500">Bs {total.toFixed(2)}</span>
        </div>
        <div className="space-y-3">
          {entries.map(([cat, amount]) => (
            <div key={cat}>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="font-medium text-gray-600">
                  {LEGACY_LABELS[cat as ExpenseCategory] ?? cat}
                </span>
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

function MetricCard({
  label, value, hint, tone = 'neutral',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'neutral' | 'negative';
}) {
  return (
    <div
      className="rounded-2xl border border-[var(--border-subtle)] p-4 shadow-card-md"
      style={{ background: 'var(--color-surface-card)' }}
    >
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
      <p className={`font-heading text-xl font-black leading-tight tabular-nums ${
        tone === 'negative' ? 'text-red-600' : 'text-gray-900'
      }`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-[10px] text-gray-400">{hint}</p>}
    </div>
  );
}
