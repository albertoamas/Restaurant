import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import { useChartColors } from './chartColors';

interface Props {
  sales:    number;
  expenses: number;
}

/**
 * Anillo Ventas vs. Gastos — siempre dos partes no negativas que suman el
 * movimiento total (a diferencia de "ganancia vs. gastos", que se rompe en
 * pérdida: la ganancia no puede ser una porción negativa del anillo). El
 * margen ya se muestra como número grande arriba de esta tarjeta; el anillo
 * da la proporción de un vistazo, el % vuelve a aparecer en el centro como
 * refuerzo.
 */
export function NetProfitDonut({ sales, expenses }: Props) {
  const c = useChartColors();

  const total = sales + expenses;
  if (total <= 0) return null;

  const marginPct = sales > 0 ? ((sales - expenses) / sales) * 100 : 0;
  const data = [
    { name: 'Ventas', value: sales,    color: c.emerald },
    { name: 'Gastos',  value: expenses, color: c.red },
  ].filter((d) => d.value > 0);

  const fmtFull = (v: number | string) => `Bs ${Number(v).toFixed(2)}`;

  return (
    <div className="relative" style={{ height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="68%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} fillOpacity={0.9} />
            ))}
          </Pie>
          <Tooltip
            content={<ChartTooltip formatter={fmtFull} />}
            wrapperStyle={{ background: 'none', border: 'none', boxShadow: 'none', padding: 0 }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-heading text-2xl font-black ${marginPct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {marginPct >= 0 ? '' : '−'}{Math.abs(marginPct).toFixed(0)}%
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">margen</span>
      </div>
    </div>
  );
}
