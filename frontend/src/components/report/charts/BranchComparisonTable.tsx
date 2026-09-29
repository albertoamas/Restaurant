import type { BranchReportDto } from '@pos/shared';

interface Props {
  data: BranchReportDto[];
  /** Color de la serie de cada sucursal, el mismo que usan los gráficos de la pestaña. */
  colorFor: (branchId: string) => string;
}

/**
 * Detalle numérico por sucursal: la vista de tabla de los gráficos de arriba.
 * La muestra de color enlaza cada fila con su serie; la barra y el porcentaje
 * son la participación de la sucursal en las ventas totales del período.
 *
 * Los montos van primero: en el celular la tabla se desplaza horizontalmente,
 * y lo que se ve sin desplazar tiene que ser lo que el dueño viene a mirar.
 */
export function BranchComparisonTable({ data, colorFor }: Props) {
  const totals = data.reduce(
    (acc, b) => ({
      totalSales:    acc.totalSales    + b.totalSales,
      totalExpenses: acc.totalExpenses + b.totalExpenses,
      netProfit:     acc.netProfit     + b.netProfit,
      orderCount:    acc.orderCount    + b.orderCount,
    }),
    { totalSales: 0, totalExpenses: 0, netProfit: 0, orderCount: 0 },
  );
  const totalTicket = totals.orderCount > 0 ? totals.totalSales / totals.orderCount : 0;

  const signed = (n: number) => `${n < 0 ? '− ' : ''}Bs ${Math.abs(n).toFixed(2)}`;
  const profitColor = (n: number) => (n >= 0 ? 'text-emerald-600' : 'text-red-600');

  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[640px] text-xs">
        <thead>
          <tr className="border-b border-line">
            <th className="pb-2 pl-1 pr-3 text-left  font-semibold text-gray-400">Sucursal</th>
            <th className="pb-2 pr-3 text-right font-semibold text-gray-400">Ventas</th>
            <th className="pb-2 pr-3 text-right font-semibold text-gray-400">Gastos</th>
            <th className="pb-2 pr-3 text-right font-semibold text-gray-400">Ganancia</th>
            <th className="pb-2 pr-3 text-right font-semibold text-gray-400">Pedidos</th>
            <th className="pb-2 pr-1 text-right font-semibold text-gray-400">Ticket prom.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {data.map((b) => {
            const sharePct = totals.totalSales > 0 ? (b.totalSales / totals.totalSales) * 100 : 0;
            return (
              <tr key={b.branchId}>
                <td className="py-2.5 pl-1 pr-3">
                  <span className="flex items-center gap-1.5 font-medium text-gray-700">
                    <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: colorFor(b.branchId) }} />
                    {b.branchName}
                  </span>
                  <span className="mt-1.5 flex items-center gap-2">
                    <span className="block h-1 w-full max-w-[120px] overflow-hidden rounded-full bg-surface-3">
                      <span className="block h-full rounded-full bg-gray-400" style={{ width: `${sharePct}%` }} />
                    </span>
                    <span className="font-mono text-[10px] text-gray-400 tabular-nums">{sharePct.toFixed(0)}%</span>
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-right font-mono font-semibold text-gray-700 tabular-nums">
                  Bs {b.totalSales.toFixed(2)}
                </td>
                <td className="py-2.5 pr-3 text-right font-mono text-red-500 tabular-nums">
                  Bs {b.totalExpenses.toFixed(2)}
                </td>
                <td className={`py-2.5 pr-3 text-right font-mono font-bold tabular-nums ${profitColor(b.netProfit)}`}>
                  {signed(b.netProfit)}
                </td>
                <td className="py-2.5 pr-3 text-right font-mono text-gray-600 tabular-nums">{b.orderCount}</td>
                <td className="py-2.5 pr-1 text-right font-mono text-gray-600 tabular-nums">
                  Bs {b.averageTicket.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-line-strong">
            <td className="pt-2.5 pl-1 pr-3 font-semibold text-gray-700">Total</td>
            <td className="pt-2.5 pr-3 text-right font-mono font-bold text-gray-900 tabular-nums">
              Bs {totals.totalSales.toFixed(2)}
            </td>
            <td className="pt-2.5 pr-3 text-right font-mono font-bold text-red-500 tabular-nums">
              Bs {totals.totalExpenses.toFixed(2)}
            </td>
            <td className={`pt-2.5 pr-3 text-right font-mono font-black tabular-nums ${profitColor(totals.netProfit)}`}>
              {signed(totals.netProfit)}
            </td>
            <td className="pt-2.5 pr-3 text-right font-mono text-gray-700 tabular-nums">{totals.orderCount}</td>
            <td className="pt-2.5 pr-1 text-right font-mono text-gray-700 tabular-nums">Bs {totalTicket.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
