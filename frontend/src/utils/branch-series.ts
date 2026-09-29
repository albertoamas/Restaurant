import type { BranchDailySeriesItemDto, BranchReportDto } from '@pos/shared';

/** Clave de la serie que agrupa a las sucursales que no entran en la paleta. */
export const OTHERS_KEY = 'otras';

/** Una serie de los gráficos de sucursales: una sucursal, o "Otras" agrupadas. */
export interface BranchSeries {
  key:       string;
  name:      string;
  color:     string;
  branchIds: string[];
}

/**
 * Asigna a cada sucursal un color que no cambia nunca.
 *
 * El dominio es la lista COMPLETA de sucursales del negocio, ordenada por
 * nombre — no las que tuvieron movimiento en el período, ni su posición en el
 * ranking de ventas. Si el color dependiera de eso, cambiar de "Esta semana" a
 * "Este mes" repintaría las sucursales y el dueño compararía colores que ya no
 * significan lo mismo.
 *
 * La paleta tiene un número fijo de colores validados. Si hay más sucursales,
 * las que sobran (siempre las mismas, por orden de nombre) se agrupan en
 * "Otras" con el color neutro, en vez de inventar un color nuevo.
 */
export function buildBranchSeries(
  branches: { id: string; name: string }[],
  palette: readonly string[],
  othersColor: string,
): BranchSeries[] {
  const sorted = [...branches].sort(
    (a, b) => a.name.localeCompare(b.name, 'es') || a.id.localeCompare(b.id),
  );

  const own = (b: { id: string; name: string }, i: number): BranchSeries => ({
    key: b.id, name: b.name, color: palette[i], branchIds: [b.id],
  });

  if (sorted.length <= palette.length) return sorted.map(own);

  const withColor = palette.length - 1;
  const rest      = sorted.slice(withColor);
  return [
    ...sorted.slice(0, withColor).map(own),
    {
      key:       OTHERS_KEY,
      name:      `Otras (${rest.length})`,
      color:     othersColor,
      branchIds: rest.map((b) => b.id),
    },
  ];
}

/** Las series que tienen al menos una sucursal con fila en el período. */
export function visibleSeries(series: BranchSeries[], byBranch: BranchReportDto[]): BranchSeries[] {
  const present = new Set(byBranch.map((b) => b.branchId));
  return series.filter((s) => s.branchIds.some((id) => present.has(id)));
}

/** `branchId` → serie a la que pertenece. */
export function seriesByBranchId(series: BranchSeries[]): Map<string, BranchSeries> {
  return new Map(series.flatMap((s) => s.branchIds.map((id) => [id, s] as const)));
}

export type ChartRow = Record<string, number | string>;

/**
 * Totales del período agrupados por medida, con una columna por serie: el
 * formato que espera un gráfico de barras agrupadas (una barra por sucursal
 * dentro de cada medida).
 */
export function totalsByMetric(byBranch: BranchReportDto[], series: BranchSeries[]): ChartRow[] {
  const bySeries = seriesByBranchId(series);
  const metrics = [
    { label: 'Ventas',   pick: (b: BranchReportDto) => b.totalSales },
    { label: 'Gastos',   pick: (b: BranchReportDto) => b.totalExpenses },
    { label: 'Ganancia', pick: (b: BranchReportDto) => b.netProfit },
  ];

  return metrics.map(({ label, pick }) => {
    const row: ChartRow = { metric: label };
    for (const s of series) row[s.key] = 0;
    for (const b of byBranch) {
      const s = bySeries.get(b.branchId);
      if (s) row[s.key] = round2(Number(row[s.key]) + pick(b));
    }
    return row;
  });
}

/**
 * Una fila por día del rango con las ventas de cada serie. Los días en que una
 * sucursal no vendió valen 0 en vez de faltar: si faltaran, la línea uniría
 * los días vecinos y dibujaría ventas que no existieron.
 */
export function dailyBySeries(
  rows: BranchDailySeriesItemDto[],
  days: string[],
  series: BranchSeries[],
): ChartRow[] {
  const bySeries = seriesByBranchId(series);
  const table = new Map<string, ChartRow>(
    days.map((d) => {
      const row: ChartRow = { date: d };
      for (const s of series) row[s.key] = 0;
      return [d, row];
    }),
  );

  for (const r of rows) {
    const row = table.get(r.date);
    const s   = bySeries.get(r.branchId);
    if (row && s) row[s.key] = round2(Number(row[s.key]) + r.totalSales);
  }
  return days.map((d) => table.get(d)!);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
