import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { DailyReportDto } from '@pos/shared';
import { reportsApi } from '../api/reports.api';
import { queryKeys } from '../lib/query-keys';
import { getBoliviaDayBounds } from '../utils/timezone';
import { formatDayRange, mondayOf, today } from '../utils/date';

export type CashierPeriod = 'today' | 'week' | 'month';

/** Días `YYYY-MM-DD` del período, siempre en hora de Bolivia (no la del dispositivo). */
function buildRange(period: CashierPeriod) {
  const to = today();
  if (period === 'today') return { from: to, to };
  if (period === 'week')  return { from: mondayOf(to), to };
  return { from: `${to.slice(0, 7)}-01`, to };
}

/**
 * Rendición de quien consulta. Para un cajero, el backend cuenta solo los pedidos que tomó él;
 * para el dueño, la sucursal elegida (`branchId`) o todas (`null`).
 */
export function useCashierReport(branchId: string | null) {
  const [period, setPeriod] = useState<CashierPeriod>('today');

  const { from, to } = buildRange(period);
  const rangeLabel   = period === 'today' ? `Hoy, ${formatDayRange(from, to)}` : formatDayRange(from, to);

  const { start: utcFrom } = getBoliviaDayBounds(from);
  const { end:   utcTo   } = getBoliviaDayBounds(to);

  const { data: report = null, isPending: loading } = useQuery<DailyReportDto | null>({
    queryKey: queryKeys.reportRange(utcFrom, utcTo, branchId ?? undefined),
    queryFn:  () => reportsApi.getByRange(utcFrom, utcTo, branchId ?? undefined),
    staleTime: 0,
  });

  return { report, loading, period, setPeriod, rangeLabel, from, to };
}
