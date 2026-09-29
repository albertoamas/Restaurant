import { useMemo } from 'react';
import type { BranchDailySeriesItemDto, BranchDto, BranchReportDto } from '@pos/shared';
import { Card } from '../../ui/Card';
import { Icon } from '../../ui/Icon';
import { Spinner } from '../../ui/Spinner';
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

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  // Con una sola sucursal con movimiento no hay nada que comparar; se dice en
  // vez de dibujar un gráfico de una sola barra.
  if (byBranch.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Icon name="building" size={40} strokeWidth={1.5} className="mb-3 opacity-40" />
        <p className="text-sm font-semibold text-gray-500">Solo una sucursal tuvo movimiento</p>
        <p className="mt-1 text-xs">Elige un período más amplio para comparar tus locales</p>
      </div>
    );
  }

  const noSales = byBranch.every((b) => b.totalSales === 0);

  return (
    <>
      <p className="mb-4 text-[11px] text-gray-400">
        Compara todas tus sucursales, sin importar la que tengas seleccionada en el menú.
      </p>

      <Card variant="panel" className="mb-6">
        <h3 className="mb-0.5 font-heading text-sm font-bold text-gray-700">Ventas, gastos y ganancia</h3>
        <p className="mb-3 text-[11px] text-gray-400">Totales del período en Bs, una barra por sucursal</p>
        <div className="mb-3"><SeriesLegend items={series} /></div>
        <BranchTotalsChart data={totals} series={series} />
      </Card>

      {isMultiDay && !noSales && (
        <Card variant="panel" className="mb-6">
          <h3 className="mb-0.5 font-heading text-sm font-bold text-gray-700">Evolución de ventas</h3>
          <p className="mb-3 text-[11px] text-gray-400">Ventas diarias de cada sucursal, en Bs</p>
          <div className="mb-3"><SeriesLegend items={series} /></div>
          <BranchTrendChart data={trend} series={series} />
        </Card>
      )}

      <Card variant="panel" className="mb-6">
        <h3 className="mb-0.5 font-heading text-sm font-bold text-gray-700">Detalle por sucursal</h3>
        <p className="mb-4 text-[11px] text-gray-400">Participación de cada local en las ventas del período</p>
        <BranchComparisonTable data={byBranch} colorFor={colorOf} />
      </Card>
    </>
  );
}
