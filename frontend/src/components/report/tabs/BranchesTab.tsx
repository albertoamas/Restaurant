import { useMemo } from 'react';
import type { BranchDailySeriesItemDto, BranchDto, BranchReportDto } from '@pos/shared';
import { EmptyState } from '../../ui/EmptyState';
import { Skeleton } from '../../ui/Skeleton';
import { ChartCard } from '../index';
import { BranchTotalsChart } from '../charts/BranchTotalsChart';
import { BranchTrendChart } from '../charts/BranchTrendChart';
import { BranchComparisonTable } from '../charts/BranchComparisonTable';
import { SeriesLegend } from '../charts/SeriesLegend';
import { useBarColors, useChartColors } from '../charts/chartColors';
import {
  buildBranchSeries,
  dailyBySeries,
  seriesByBranchId,
  totalsByMetric,
  visibleSeries,
} from '../../../utils/branch-series';

interface Props {
  byBranch:      BranchReportDto[];
  dailyByBranch: BranchDailySeriesItemDto[];
  /** Todas las sucursales del negocio: fijan el color de cada una (ver `buildBranchSeries`). */
  branches:      BranchDto[];
  /** Días del rango en hora Bolivia, para rellenar con 0 los días sin ventas. */
  days:          string[];
  isMultiDay:    boolean;
  loading:       boolean;
}

/**
 * Comparativa entre sucursales. A diferencia del resto de pestañas no depende
 * de la sucursal elegida en el menú: su razón de ser es verlas todas juntas.
 * En toda la pestaña el color identifica a la sucursal, así que un mismo local
 * tiene el mismo color en los dos gráficos y en la tabla.
 */
export function BranchesTab({ byBranch, dailyByBranch, branches, days, isMultiDay, loading }: Props) {
  const palette    = useBarColors();
  const { gray }   = useChartColors();

  const allSeries = useMemo(
    () => buildBranchSeries(branches.map((b) => ({ id: b.id, name: b.name })), palette, gray),
    [branches, palette, gray],
  );
  const series = useMemo(() => visibleSeries(allSeries, byBranch), [allSeries, byBranch]);
  const colorOf = useMemo(() => {
    const bySeries = seriesByBranchId(allSeries);
    return (branchId: string) => bySeries.get(branchId)?.color ?? gray;
  }, [allSeries, gray]);

  const totals = useMemo(() => totalsByMetric(byBranch, series), [byBranch, series]);
  const trend  = useMemo(() => dailyBySeries(dailyByBranch, days, series), [dailyByBranch, days, series]);

  if (loading) return <div className="grid gap-4"><Skeleton variant="card" /><Skeleton variant="card" /></div>;

  // Con una sola sucursal con movimiento no hay nada que comparar; se dice en
  // vez de dibujar un gráfico de una sola barra.
  if (byBranch.length < 2) {
    return (
      <EmptyState
        icon="building"
        title="Solo una sucursal tuvo movimiento"
        description="Elige un período más amplio para comparar tus sucursales."
      />
    );
  }

  const noSales = byBranch.every((b) => b.totalSales === 0);

  return (
    <div className="space-y-4">
      <p className="text-label text-soft">
        Esta sección compara todas las sucursales, sin importar la que tengas elegida en el menú.
      </p>

      <ChartCard title="Ventas, gastos y ganancia" description="Totales del período en Bs, una barra por sucursal.">
        <div className="mb-3"><SeriesLegend items={series} /></div>
        <BranchTotalsChart data={totals} series={series} />
      </ChartCard>

      {isMultiDay && !noSales && (
        <ChartCard title="Ventas por día" description="Cada línea es una sucursal, en Bs.">
          <div className="mb-3"><SeriesLegend items={series} /></div>
          <BranchTrendChart data={trend} series={series} />
        </ChartCard>
      )}

      <ChartCard title="Detalle por sucursal" description="Cuánto aporta cada sucursal a las ventas del período.">
        <BranchComparisonTable data={byBranch} colorFor={colorOf} />
      </ChartCard>
    </div>
  );
}
