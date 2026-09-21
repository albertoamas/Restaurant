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

interface Props {
  data: DailySeriesItemDto[];
}

export function OrdersAreaChart({ data }: Props) {
  const c = useChartColors();
  const chartData = data.map((d) => ({
    fecha:   d.date.slice(5), // MM-DD
    Pedidos: d.orderCount,
  }));

  const fmtFull = (v: number | string) => `${v} pedidos`;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradPedidos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={c.emerald} stopOpacity={0.35} />
            <stop offset="95%" stopColor={c.emerald} stopOpacity={0.02} />
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
          allowDecimals={false}
          width={40}
        />

        <Tooltip
          content={<ChartTooltip formatter={fmtFull} />}
          wrapperStyle={{ background: 'none', border: 'none', boxShadow: 'none', padding: 0 }}
        />

        <Area
          type="monotone"
          dataKey="Pedidos"
          stroke={c.emerald}
          strokeWidth={2.5}
          fill="url(#gradPedidos)"
          dot={false}
          activeDot={{ r: 4, fill: c.emerald, stroke: 'none' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
