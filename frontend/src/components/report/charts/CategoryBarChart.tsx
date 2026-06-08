import { useState } from 'react';
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
import type { TopCategoryDto } from '@pos/shared';
import { ChartTooltip } from './ChartTooltip';
import { C, GRID_COLOR, TICK_COLOR, TICK_SIZE } from './chartColors';

type View = 'quantity' | 'revenue';

interface Props {
  data: TopCategoryDto[];
}

const BAR_COLORS = [C.primary, C.amber, C.emerald, C.violet, C.sky, C.rose, C.cyan, C.gray];

export function CategoryBarChart({ data }: Props) {
  const [view, setView] = useState<View>('quantity');

  const top    = data.slice(0, 8);
  const height = Math.max(160, top.length * 40);

  const chartData = top.map((cat) => ({
    name:     cat.categoryName ?? 'Sin cat.',
    Unidades: cat.totalQuantity,
    Ingresos: cat.totalRevenue,
  }));

  const dataKey  = view === 'quantity' ? 'Unidades' : 'Ingresos';
  const fmtFull  = (v: number | string) =>
    view === 'revenue' ? `Bs ${Number(v).toFixed(2)}` : `${v} uds`;

  return (
    <div>
      {/* Toggle */}
      <div className="flex gap-1 mb-3 p-0.5 rounded-lg bg-white/5 border border-white/8 w-fit">
        {(['quantity', 'revenue'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
              view === v
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {v === 'quantity' ? 'Cantidad' : 'Ingresos'}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 0, right: 56, left: 0, bottom: 0 }}
          barSize={12}
          barCategoryGap="30%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: TICK_COLOR, fontSize: TICK_SIZE }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => view === 'revenue' ? `Bs ${v}` : String(v)}
          />
          <YAxis
            type="category"
            dataKey="name"
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
          <Bar dataKey={dataKey} radius={[0, 4, 4, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
