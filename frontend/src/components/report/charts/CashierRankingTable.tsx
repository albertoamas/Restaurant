import type { CashierReportDto } from '@pos/shared';
import { bs, share } from '../index';

interface Props {
  data: CashierReportDto[];
}

/** Cajeros ordenados por lo que vendieron, con la barra relativa al primero. */
export function CashierRankingTable({ data }: Props) {
  const sorted   = [...data].sort((a, b) => b.totalSales - a.totalSales);
  const maxSales = sorted[0]?.totalSales || 1;

  return (
    <ol className="space-y-4">
      {sorted.map((c, i) => {
        const pct       = share(c.totalSales, maxSales);
        const avgTicket = c.orderCount > 0 ? c.totalSales / c.orderCount : 0;
        return (
          <li key={c.userName}>
            <div className="flex items-center gap-3">
              <span className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-label font-bold ${
                i === 0 ? 'bg-primary-500/15 text-primary-700 dark:text-primary-400' : 'bg-surface-2 text-soft border border-line'
              }`}>
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-body font-semibold text-main truncate">{c.userName}</p>
                <p className="text-caption text-muted">
                  {c.orderCount} {c.orderCount === 1 ? 'pedido' : 'pedidos'}
                  {c.orderCount > 0 && `, ticket promedio ${bs(avgTicket)}`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-body font-semibold text-main tabular-nums">{bs(c.totalSales)}</p>
                <p className="text-caption text-muted">{i === 0 ? 'El que más vendió' : `${pct.toFixed(0)}% del primero`}</p>
              </div>
            </div>
            <div className="mt-2 ml-10 h-2 rounded-full bg-surface-3 overflow-hidden">
              <div className={`h-full rounded-full ${i === 0 ? 'bg-primary-500' : 'bg-line-strong'}`} style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
