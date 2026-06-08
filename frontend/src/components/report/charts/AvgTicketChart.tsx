import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DailySeriesItemDto } from '@pos/shared';
import { ChartTooltip } from './ChartTooltip';
import { C, GRID_COLOR, TICK_COLOR, TICK_SIZE } from './chartColors';

interface Props {
  data:             DailySeriesItemDto[];
  prevAvgTicket?:   number; // ticket promedio del período anterior para línea de referencia
}

export function AvgTicketChart({ data, prevAvgTicket }: Props) {
  const chartData = data
    .filter((d) => d.orderCount > 0)
    .map((d) => ({
      fecha:  d.date.slice(5),
      Ticket: parseFloat((d.totalSales / d.orderCount).toFixed(2)),
    }));

  const avg = chartData.length
    ? chartData.reduce((s, d) => s + d.Ticket, 0) / chartData.length
    : 0;

  const fmt = (v: number | string) => `Bs ${Number(v).toFixed(2)}`;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
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
          tickFormatter={fmt}
          width={64}
        />
        <Tooltip
          content={<ChartTooltip formatter={fmt} />}
          wrapperStyle={{ background: 'none', border: 'none', boxShadow: 'none', padding: 0 }}
        />

        {/* Línea de promedio del período actual */}
        <ReferenceLine
          y={avg}
          stroke={`${C.violet}80`}
          strokeDasharray="4 4"
          label={{
            value: `Prom. Bs ${avg.toFixed(0)}`,
            fill: C.violet,
            fontSize: 10,
            position: 'insideTopRight',
          }}
        />

        {/* Línea de promedio del período anterior */}
        {prevAvgTicket !== undefined && prevAvgTicket > 0 && (
          <ReferenceLine
            y={prevAvgTicket}
            stroke={`${C.gray}60`}
            strokeDasharray="2 4"
            label={{
              value: `Ant. Bs ${prevAvgTicket.toFixed(0)}`,
              fill: C.gray,
              fontSize: 10,
              position: 'insideBottomRight',
            }}
          />
        )}

        <Line
          type="monotone"
          dataKey="Ticket"
          stroke={C.violet}
          strokeWidth={2.5}
          dot={{ r: 3, fill: C.violet, stroke: 'none' }}
          activeDot={{ r: 5, fill: C.violet, stroke: 'none' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
