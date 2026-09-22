import type { BranchReportDto } from '@pos/shared';

interface Props {
  data: BranchReportDto[];
}

/**
 * Comparativa entre sucursales del período. La barra bajo el nombre es la
 * participación de esa sucursal en las ventas totales: deja ver de un vistazo
 * el peso de cada local sin tener que dividir mentalmente.
 */
export function BranchComparisonTable({ data }: Props) {
  const maxSales = Math.max(...data.map((b) => b.totalSales), 0);
  const totals = data.reduce(
    (acc, b) => ({
      totalSales:    acc.totalSales    + b.totalSales,
      totalExpenses: acc.totalExpenses + b.totalExpenses,
      netProfit:     acc.netProfit     + b.netProfit,
      orderCount:    acc.orderCount    + b.orderCount,
    }),
    { totalSales: 0, totalExpenses: 0, netProfit: 0, orderCount: 0 },
  );

  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[520px] text-xs">
        <thead>
          <tr className="border-b border-[var(--border-subtle)]">
            <th className="pb-2 pl-1 pr-3 text-left  font-semibold text-gray-400">Sucursal</th>
            <th className="pb-2 pr-3 text-right font-semibold text-gray-400">Pedidos</th>
            <th className="pb-2 pr-3 text-right font-semibold text-gray-400">Ventas</th>
            <th className="pb-2 pr-3 text-right font-semibold text-gray-400">Gastos</th>
            <th className="pb-2 pr-1 text-right font-semibold text-gray-400">Ganancia</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {data.map((b) => {
            const sharePct = maxSales > 0 ? (b.totalSales / maxSales) * 100 : 0;
            return (
              <tr key={b.branchId}>
                <td className="py-2.5 pl-1 pr-3">
                  <span className="font-medium text-gray-700">{b.branchName}</span>
                  <span className="mt-1.5 block h-1 w-full max-w-[140px] overflow-hidden rounded-full bg-[var(--color-surface-3)]">
                    <span className="block h-full rounded-full bg-primary-500" style={{ width: `${sharePct}%` }} />
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-right font-mono text-gray-600 tabular-nums">{b.orderCount}</td>
                <td className="py-2.5 pr-3 text-right font-mono font-semibold text-gray-700 tabular-nums">
                  Bs {b.totalSales.toFixed(2)}
                </td>
                <td className="py-2.5 pr-3 text-right font-mono text-red-500 tabular-nums">
                  Bs {b.totalExpenses.toFixed(2)}
                </td>
                <td className={`py-2.5 pr-1 text-right font-mono font-bold tabular-nums ${
                  b.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {b.netProfit < 0 && '− '}Bs {Math.abs(b.netProfit).toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-[var(--border-strong)]">
            <td className="pt-2.5 pl-1 pr-3 font-semibold text-gray-700">Total</td>
            <td className="pt-2.5 pr-3 text-right font-mono text-gray-700 tabular-nums">{totals.orderCount}</td>
            <td className="pt-2.5 pr-3 text-right font-mono font-bold text-gray-900 tabular-nums">
              Bs {totals.totalSales.toFixed(2)}
            </td>
            <td className="pt-2.5 pr-3 text-right font-mono font-bold text-red-500 tabular-nums">
              Bs {totals.totalExpenses.toFixed(2)}
            </td>
            <td className={`pt-2.5 pr-1 text-right font-mono font-black tabular-nums ${
              totals.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {totals.netProfit < 0 && '− '}Bs {Math.abs(totals.netProfit).toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
