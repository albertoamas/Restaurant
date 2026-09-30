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
import { formatAmountAxis, formatBsFull, formatDayTick, useChartAnimation } from './chartFormat';

interface Props {
  /** Monto gastado por día (`YYYY-MM-DD`); los días sin gastos no vienen. */
  byDay: Record<string, number>;
  /** Todos los días del período: los que no tienen gastos se dibujan en 0. */
  days: string[];
}

export function ExpenseTrendChart({ byDay, days }: Props) {
  const c = useChartColors();
  const animate = useChartAnimation();
  const chartData = days.map((day) => ({
    fecha:  formatDayTick(day),
    Gastos: byDay[day] ?? 0,
  }));


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
          tickFormatter={formatAmountAxis}
          width={44}
        />

        <Tooltip
          content={<ChartTooltip formatter={formatBsFull} />}
          wrapperStyle={{ background: 'none', border: 'none', boxShadow: 'none', padding: 0 }}
        />

        <Area
          type="monotone"
          dataKey="Gastos"
          isAnimationActive={animate}
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
