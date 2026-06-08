import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { HourlyDataDto } from '@pos/shared';
import { ChartTooltip } from './ChartTooltip';
import { C, GRID_COLOR, TICK_COLOR, TICK_SIZE } from './chartColors';

interface Props {
  data: HourlyDataDto[];
}

export function HourlyBarChart({ data }: Props) {
  const maxSales = data.reduce((m, d) => Math.max(m, d.totalSales), 0) || 1;

  const chartData = Array.from({ length: 24 }, (_, h) => {
    const item = data.find((x) => x.hour === h);
    return {
      hour:       `${String(h).padStart(2, '0')}:00`,
      Ventas:     item?.totalSales  ?? 0,
      Pedidos:    item?.orderCount  ?? 0,
      _intensity: item ? item.totalSales / maxSales : 0,
    };
  });

  const fmtFull = (v: number | string, name: string) =>
    name === 'Ventas' ? `Bs ${Number(v).toFixed(2)}` : String(v);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} barSize={14} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="hour"
          tick={{ fill: TICK_COLOR, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval={3}
        />
        <YAxis
          tick={{ fill: TICK_COLOR, fontSize: TICK_SIZE }}
          axisLine={false}
          tickLine={false}
          width={52}
          tickFormatter={(v: number) => `Bs ${v}`}
        />
        <Tooltip
          content={<ChartTooltip formatter={fmtFull} />}
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          wrapperStyle={{ background: 'none', border: 'none', boxShadow: 'none', padding: 0 }}
        />
        <Bar dataKey="Ventas" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, i) => {
            const t = entry._intensity;
            // Interpolate: gray → primary color based on intensity
            const opacity = 0.25 + t * 0.75;
            return (
              <Cell
                key={i}
                fill={entry.Ventas === 0 ? 'rgba(156,163,175,0.2)' : C.primary}
                fillOpacity={entry.Ventas === 0 ? 1 : opacity}
              />
            );
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
