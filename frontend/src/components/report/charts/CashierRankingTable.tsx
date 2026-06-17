import type { CashierReportDto } from '@pos/shared';

interface Props {
  data: CashierReportDto[];
}

const RANK_STYLES = [
  'bg-amber-500/12 text-amber-500 border border-amber-500/20',
  'bg-gray-400/10 text-gray-400 border border-gray-400/15',
  'bg-orange-900/15 text-orange-600 border border-orange-700/20',
];

export function CashierRankingTable({ data }: Props) {
  const sorted   = [...data].sort((a, b) => b.totalSales - a.totalSales);
  const maxSales = sorted[0]?.totalSales || 1;

  return (
    <div className="space-y-2">
      {sorted.map((c, i) => {
        const pct       = (c.totalSales / maxSales) * 100;
        const avgTicket = c.orderCount > 0 ? c.totalSales / c.orderCount : 0;
        const isLeader  = i === 0;

        return (
          <div
            key={c.userName}
            className="relative overflow-hidden rounded-xl border border-[var(--border-subtle)] p-3 transition-colors hover:border-[var(--border-strong)]"
          >
            {/* Progress bar — fills behind the content */}
            <div
              className="absolute inset-y-0 left-0 rounded-xl transition-all duration-700 ease-out"
              style={{
                width:      `${pct}%`,
                background: isLeader
                  ? 'rgba(249,115,22,0.08)'
                  : 'rgba(255,255,255,0.025)',
              }}
            />

            <div className="relative flex items-center gap-3">
              {/* Rank badge */}
              <div
                className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                  RANK_STYLES[i] ?? 'bg-[var(--color-surface-2)] text-gray-500 border border-[var(--border-subtle)]'
                }`}
              >
                {i + 1}
              </div>

              {/* Name + subtitle */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-700 truncate leading-tight">
                  {c.userName}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {c.orderCount} pedidos
                  {c.orderCount > 0 && (
                    <> · ticket prom. <span className="text-gray-500 font-medium">Bs {avgTicket.toFixed(2)}</span></>
                  )}
                </p>
              </div>

              {/* Sales amount */}
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold leading-tight ${isLeader ? 'text-orange-500' : 'text-gray-700'}`}>
                  Bs {c.totalSales.toFixed(2)}
                </p>
                {isLeader ? (
                  <p className="text-[10px] text-amber-500/70 font-semibold mt-0.5">Líder</p>
                ) : (
                  <p className="text-[10px] text-gray-400 mt-0.5">{pct.toFixed(0)}% del líder</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
