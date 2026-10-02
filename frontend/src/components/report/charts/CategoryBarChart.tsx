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
import { TICK_COLOR, TICK_SIZE, useBarColors, useChartColors } from './chartColors';
import { formatAmountAxis, useChartAnimation } from './chartFormat';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { bs } from '../../../utils/money';

type View = 'quantity' | 'revenue';

interface Props {
  data: TopCategoryDto[];
}

export function CategoryBarChart({ data }: Props) {
  const [view, setView] = useState<View>('quantity');
  const barColors = useBarColors();
  const animate = useChartAnimation();
  const { grid }  = useChartColors();

  const top    = data.slice(0, 8);
  const height = Math.max(180, top.length * 50);

  const chartData = top.map((cat) => ({
    name:     cat.categoryName ?? 'Sin categoría',
    Unidades: cat.totalQuantity,
    Ingresos: cat.totalRevenue,
  }));

  const dataKey  = view === 'quantity' ? 'Unidades' : 'Ingresos';
  const fmtFull  = (v: number | string) =>
    view === 'revenue' ? bs(Number(v)) : `${v} unidades`;

  return (
    <div>
      <div className="mb-3">
        <SegmentedControl
          label="Medir categorías por"
          size="sm"
          value={view}
          onChange={setView}
          options={[{ value: 'quantity', label: 'Unidades' }, { value: 'revenue', label: 'Ingresos' }]}
        />
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 0, right: 56, left: 0, bottom: 0 }}
          barSize={20}
          barCategoryGap="28%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: TICK_COLOR, fontSize: TICK_SIZE }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => formatAmountAxis(v)}
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
          <Bar dataKey={dataKey} radius={[0, 4, 4, 0]} isAnimationActive={animate}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={barColors[i % barColors.length]} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
