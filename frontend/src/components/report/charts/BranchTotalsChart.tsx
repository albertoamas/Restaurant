import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { BranchSeries, ChartRow } from '../../../utils/branch-series';
import { ChartTooltip } from './ChartTooltip';
import { TICK_COLOR, TICK_SIZE, useChartColors } from './chartColors';
import { formatAmountAxis, formatBsFull } from './chartFormat';

interface Props {
  /** Una fila por medida (Ventas, Gastos, Ganancia), una columna por serie. */
  data:   ChartRow[];
  series: BranchSeries[];
}

/**
 * Ancho fijo de cada barra. Con `barSize` recharts centra el grupo dentro de la
 * categoría y respeta `barGap`; si las sucursales no entran (muchas, en un
 * celular) cae solo a repartir el 90% del ancho.
 *
 * No usar `barCategoryGap` en porcentaje para afinar las barras: recharts lo
 * aplica a CADA lado de la categoría, y por encima de 50% el ancho de las
 * barras se vuelve negativo y el grupo se dibuja espejado.
 */
const BAR_SIZE = 28;

/**
 * Ventas, gastos y ganancia del período, con una barra por sucursal dentro de
 * cada medida. Las tres medidas están en Bs, así que comparten un único eje;
 * la ganancia puede ser negativa y cae bajo la línea de cero.
 */
export function BranchTotalsChart({ data, series }: Props) {
  const c = useChartColors();

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barSize={BAR_SIZE} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
        <XAxis
          dataKey="metric"
          tick={{ fill: TICK_COLOR, fontSize: TICK_SIZE }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: TICK_COLOR, fontSize: TICK_SIZE }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatAmountAxis}
          width={44}
        />
        <ReferenceLine y={0} stroke={TICK_COLOR} strokeOpacity={0.5} />
        <Tooltip
          content={<ChartTooltip formatter={formatBsFull} />}
          cursor={{ fill: c.grid }}
          wrapperStyle={{ background: 'none', border: 'none', boxShadow: 'none', padding: 0 }}
        />
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.name}
            fill={s.color}
            // recharts invierte el rectángulo cuando el valor es negativo, así
            // que las esquinas redondeadas quedan siempre en el extremo del dato.
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
