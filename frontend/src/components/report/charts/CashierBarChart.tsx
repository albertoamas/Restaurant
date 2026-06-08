import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CashierReportDto } from '@pos/shared';
import { ChartTooltip } from './ChartTooltip';
import { C, GRID_COLOR, TICK_COLOR, TICK_SIZE } from './chartColors';

interface Props {
  data: CashierReportDto[];
}

export function CashierBarChart({ data }: Props) {
  const height = Math.max(160, data.length * 52);

  const chartData = data.map((c) => ({
    nombre:  c.userName,
    Ventas:  c.totalSales,
    Pedidos: c.orderCount,
  }));

  const fmtFull = (v: number | string, name: string) =>
    name === 'Ventas' ? `Bs ${Number(v).toFixed(2)}` : String(v);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 0, right: 48, left: 0, bottom: 0 }}
        barSize={10}
        barCategoryGap="35%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: TICK_COLOR, fontSize: TICK_SIZE }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="nombre"
          tick={{ fill: TICK_COLOR, fontSize: TICK_SIZE }}
          axisLine={false}
          tickLine={false}
          width={84}
        />
        <Tooltip
          content={<ChartTooltip formatter={fmtFull} />}
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          wrapperStyle={{ background: 'none', border: 'none', boxShadow: 'none', padding: 0 }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: TICK_COLOR, paddingTop: 8 }}
          iconType="circle"
          iconSize={7}
        />
        <Bar dataKey="Ventas"  fill={C.primary} radius={[0, 4, 4, 0]} fillOpacity={0.9} />
        <Bar dataKey="Pedidos" fill={C.emerald} radius={[0, 4, 4, 0]} fillOpacity={0.9} />
      </BarChart>
    </ResponsiveContainer>
  );
}
