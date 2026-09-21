import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import { TICK_COLOR, TICK_SIZE, useChartColors } from './chartColors';

interface Props {
  /** fecha (YYYY-MM-DD) → monto gastado ese día */
  byDay: Record<string, number>;
}

export function ExpenseTrendChart({ byDay }: Props) {
  const c = useChartColors();
  const chartData = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({
      fecha:  date.slice(5), // MM-DD
      Gastos: amount,
    }));

  const fmtAxis = (v: number | string) => `Bs ${Number(v).toFixed(0)}`;
  const fmtFull = (v: number | string) => `Bs ${Number(v).toFixed(2)}`;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradGastos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={c.rose} stopOpacity={0.35} />
            <stop offset="95%" stopColor={c.rose} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />

        <XAxis
          dataKey="fecha"
          tick={{ fill: TICK_COLOR, fontSize: TICK_SIZE }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: TICK_COLOR, fontSize: TICK_SIZE }}
          axisLine={false}
          tickLine={false}
          tickFormatter={fmtAxis}
          width={64}
        />

        <Tooltip
          content={<ChartTooltip formatter={fmtFull} />}
          wrapperStyle={{ background: 'none', border: 'none', boxShadow: 'none', padding: 0 }}
        />

        <Area
          type="monotone"
          dataKey="Gastos"
          stroke={c.rose}
          strokeWidth={2.5}
          fill="url(#gradGastos)"
          dot={false}
          activeDot={{ r: 4, fill: c.rose, stroke: 'none' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
