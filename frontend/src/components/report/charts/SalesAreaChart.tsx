import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DailySeriesItemDto } from '@pos/shared';
import { ChartTooltip } from './ChartTooltip';
import { C, GRID_COLOR, TICK_COLOR, TICK_SIZE } from './chartColors';

interface Props {
  data: DailySeriesItemDto[];
}

export function SalesAreaChart({ data }: Props) {
  const chartData = data.map((d) => ({
    fecha:   d.date.slice(5),   // MM-DD
    Ventas:  d.totalSales,
    Pedidos: d.orderCount,
  }));

  const fmtSales = (v: number | string) => `Bs ${Number(v).toFixed(0)}`;
  const fmtFull  = (v: number | string, name: string) =>
    name === 'Ventas' ? `Bs ${Number(v).toFixed(2)}` : `${v} pedidos`;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={C.primary} stopOpacity={0.35} />
            <stop offset="95%" stopColor={C.primary} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gradPedidos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={C.emerald} stopOpacity={0.18} />
            <stop offset="95%" stopColor={C.emerald} stopOpacity={0.01} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />

        <XAxis
          dataKey="fecha"
          tick={{ fill: TICK_COLOR, fontSize: TICK_SIZE }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        {/* Single visible Y-axis for Ventas */}
        <YAxis
          yAxisId="left"
          tick={{ fill: TICK_COLOR, fontSize: TICK_SIZE }}
          axisLine={false}
          tickLine={false}
          tickFormatter={fmtSales}
          width={64}
        />
        {/* Pedidos axis hidden — keeps its own proper scale without showing confusing labels */}
        <YAxis
          yAxisId="right"
          orientation="right"
          hide={true}
        />

        <Tooltip
          content={<ChartTooltip formatter={fmtFull} />}
          wrapperStyle={{ background: 'none', border: 'none', boxShadow: 'none', padding: 0 }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: TICK_COLOR, paddingTop: 12 }}
          iconType="circle"
          iconSize={8}
        />

        {/* Primary area: Ventas in Bs */}
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="Ventas"
          stroke={C.primary}
          strokeWidth={2.5}
          fill="url(#gradVentas)"
          dot={false}
          activeDot={{ r: 4, fill: C.primary, stroke: 'none' }}
        />
        {/* Secondary area: Pedidos — scaled independently, shown as subtle trend overlay */}
        <Area
          yAxisId="right"
          type="monotone"
          dataKey="Pedidos"
          stroke={C.emerald}
          strokeWidth={1.5}
          strokeDasharray="4 2"
          fill="url(#gradPedidos)"
          dot={false}
          activeDot={{ r: 3, fill: C.emerald, stroke: 'none' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
