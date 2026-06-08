import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import { TICK_COLOR } from './chartColors';

export interface DonutSlice {
  name:  string;
  value: number;
  color: string;
}

interface Props {
  data:      DonutSlice[];
  total:     number;
  label:     string;
  formatter?: (value: number | string, name: string) => string;
}

export function DonutChart({ data, total, label, formatter }: Props) {
  const noData = data.every((d) => d.value === 0);

  const fmtDefault = (v: number | string) =>
    `Bs ${Number(v).toFixed(2)}`;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full" style={{ height: 200 }}>
        {noData ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-gray-400">Sin datos</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="80%"
                dataKey="value"
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((slice, i) => (
                  <Cell key={i} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip
                content={<ChartTooltip formatter={formatter ?? fmtDefault} />}
                wrapperStyle={{ background: 'none', border: 'none', boxShadow: 'none', padding: 0 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}

        {/* Centro del donut */}
        {!noData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="font-heading font-black text-lg text-gray-900 leading-tight">
              Bs {total.toFixed(0)}
            </p>
          </div>
        )}
      </div>

      {/* Leyenda manual */}
      {!noData && (
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
          {data.filter((d) => d.value > 0).map((d) => (
            <span key={d.name} className="inline-flex items-center gap-1 text-[11px]" style={{ color: TICK_COLOR }}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
              {d.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
