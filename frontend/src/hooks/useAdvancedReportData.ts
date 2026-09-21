import { useQuery } from '@tanstack/react-query';
import type {
  CashierReportDto,
  CashSessionReportItemDto,
  DailyReportDto,
  DailySeriesItemDto,
  DayHourDataDto,
  TopCategoryDto,
} from '@pos/shared';
import { reportsApi } from '../api/reports.api';
import { queryKeys } from '../lib/query-keys';

/**
 * Datos de la pestaña Ventas: comparación con el período anterior, evolución
 * diaria y mapa de calor hora × día.
 */
export function useSalesTrends(
  utcFrom: string,
  utcTo: string,
  branchParam: string | undefined,
  isMultiDay: boolean,
  prevUtcFrom: string,
  prevUtcTo: string,
  enabled: boolean,
) {
  const { data: prevReport = null } = useQuery<DailyReportDto | null>({
    queryKey: queryKeys.reportRange(prevUtcFrom, prevUtcTo, branchParam),
    queryFn:  () => reportsApi.getByRange(prevUtcFrom, prevUtcTo, branchParam),
    staleTime: 0,
    enabled,
  });

  const { data: dailySeries = [] as DailySeriesItemDto[], isPending: seriesLoading } = useQuery({
    queryKey: queryKeys.reportDailySeries(utcFrom, utcTo, branchParam),
    queryFn:  () => reportsApi.getDailySeries(utcFrom, utcTo, branchParam),
    staleTime: 0,
    enabled:  enabled && isMultiDay,
  });

  const { data: byDayHour = [] as DayHourDataDto[], isPending: dayHourLoading } = useQuery({
    queryKey: queryKeys.reportByDayHour(utcFrom, utcTo, branchParam),
    queryFn:  () => reportsApi.getByDayHour(utcFrom, utcTo, branchParam),
    staleTime: 0,
    enabled,
  });

  const loading = enabled && (dayHourLoading || (isMultiDay && seriesLoading));
  return { prevReport, dailySeries, byDayHour, loading };
}

/** Categorías más vendidas — vive en la pestaña Productos. */
export function useTopCategoriesReport(
  utcFrom: string,
  utcTo: string,
  branchParam: string | undefined,
  enabled: boolean,
) {
  const { data: topCategories = [] as TopCategoryDto[], isPending } = useQuery({
    queryKey: queryKeys.reportTopCategories(utcFrom, utcTo, branchParam),
    queryFn:  () => reportsApi.getTopCategories(utcFrom, utcTo, branchParam),
    staleTime: 0,
    enabled,
  });

  return { topCategories, loading: enabled && isPending };
}

/** Datos de la pestaña Caja: rendimiento por cajero y arqueos. */
export function useCashReport(
  utcFrom: string,
  utcTo: string,
  branchParam: string | undefined,
  enabled: boolean,
) {
  const { data: byCashier = [] as CashierReportDto[], isPending: cashierLoading } = useQuery({
    queryKey: queryKeys.reportByCashier(utcFrom, utcTo, branchParam),
    queryFn:  () => reportsApi.getByCashier(utcFrom, utcTo, branchParam),
    staleTime: 0,
    enabled,
  });

  const { data: cashSessions = [] as CashSessionReportItemDto[], isPending: sessionsLoading } = useQuery({
    queryKey: queryKeys.reportCashSessions(utcFrom, utcTo, branchParam),
    queryFn:  () => reportsApi.getCashSessions(utcFrom, utcTo, branchParam),
    staleTime: 0,
    enabled,
  });

  const loading = enabled && (cashierLoading || sessionsLoading);
  return { byCashier, cashSessions, loading };
}
