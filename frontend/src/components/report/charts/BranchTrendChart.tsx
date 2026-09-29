import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { BranchSeries, ChartRow } from '../../../utils/branch-series';
import { ChartTooltip } from './ChartTooltip';
import { TICK_COLOR, TICK_SIZE, useChartColors } from './chartColors';
import { formatAmountAxis, formatBsFull } from './chartFormat';

interface Props {
  /** Una fila por día del rango (incluidos los días sin ventas), una columna por serie. */
  data:   ChartRow[];
  series: BranchSeries[];
}

/** Ventas diarias de cada sucursal en el período: deja ver cuál crece y cuál cae. */
export function BranchTrendChart({ data, series }: Props) {
  const c = useChartColors();
  const chartData = data.map((row) => ({ ...row, fecha: String(row.date).slice(5) })); // MM-DD

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
        <XAxis
          dataKey="fecha"
          tick={{ fill: TICK_COLOR, fontSize: TICK_SIZE }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          // Sin esto, recharts deja fechas vecinas casi pegadas ("09-11 09-12").
          minTickGap={16}
        />
        <YAxis
          tick={{ fill: TICK_COLOR, fontSize: TICK_SIZE }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatAmountAxis}
          width={44}
        />
        <Tooltip
          content={<ChartTooltip formatter={formatBsFull} />}
          cursor={{ stroke: TICK_COLOR, strokeOpacity: 0.4, strokeWidth: 1 }}
          wrapperStyle={{ background: 'none', border: 'none', boxShadow: 'none', padding: 0 }}
        />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            // Anillo del color de la superficie: si dos sucursales venden lo
            // mismo ese día, los dos puntos siguen distinguiéndose.
            activeDot={{ r: 4, fill: s.color, stroke: c.surface, strokeWidth: 2 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
