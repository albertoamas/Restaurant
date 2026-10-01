import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DailySeriesItemDto } from '@pos/shared';
import { ChartTooltip } from './ChartTooltip';
import { TICK_COLOR, TICK_SIZE, useChartColors } from './chartColors';
import { formatAmountAxis, formatBsFull, formatDayTick, useChartAnimation } from './chartFormat';

interface Props {
  data: DailySeriesItemDto[];
}

export function SalesAreaChart({ data }: Props) {
  const c = useChartColors();
  const animate = useChartAnimation();
  const chartData = data.map((d) => ({
    fecha:  formatDayTick(d.date),
    Ventas: d.totalSales,
  }));


  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={c.primary} stopOpacity={0.35} />
            <stop offset="95%" stopColor={c.primary} stopOpacity={0.02} />
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
          dataKey="Ventas"
          isAnimationActive={animate}
          stroke={c.primary}
          strokeWidth={2.5}
          fill="url(#gradVentas)"
          dot={false}
          activeDot={{ r: 4, fill: c.primary, stroke: 'none' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
