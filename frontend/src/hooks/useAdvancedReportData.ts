import { useQuery } from '@tanstack/react-query';
import type {
  CashierReportDto,
  CashSessionReportItemDto,
  DailyReportDto,
  DailySeriesItemDto,
  DayHourDataDto,
  HourlyDataDto,
  TopCategoryDto,
} from '@pos/shared';
import { reportsApi } from '../api/reports.api';
import { queryKeys } from '../lib/query-keys';

export function useAdvancedReportData(
  utcFrom:      string,
  utcTo:        string,
  branchParam:  string | undefined,
  isMultiDay:   boolean,
  enabled:      boolean,
  prevUtcFrom:  string,
  prevUtcTo:    string,
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

  const { data: byCashier = [] as CashierReportDto[], isPending: cashierLoading } = useQuery({
    queryKey: queryKeys.reportByCashier(utcFrom, utcTo, branchParam),
    queryFn:  () => reportsApi.getByCashier(utcFrom, utcTo, branchParam),
    staleTime: 0,
    enabled,
  });

  const { data: topCategories = [] as TopCategoryDto[], isPending: catLoading } = useQuery({
    queryKey: queryKeys.reportTopCategories(utcFrom, utcTo, branchParam),
    queryFn:  () => reportsApi.getTopCategories(utcFrom, utcTo, branchParam),
    staleTime: 0,
    enabled,
  });

  const { data: byHour = [] as HourlyDataDto[], isPending: hourLoading } = useQuery({
    queryKey: queryKeys.reportByHour(utcFrom, utcTo, branchParam),
    queryFn:  () => reportsApi.getByHour(utcFrom, utcTo, branchParam),
    staleTime: 0,
    enabled,
  });

  const { data: byDayHour = [] as DayHourDataDto[], isPending: dayHourLoading } = useQuery({
    queryKey: queryKeys.reportByDayHour(utcFrom, utcTo, branchParam),
    queryFn:  () => reportsApi.getByDayHour(utcFrom, utcTo, branchParam),
    staleTime: 0,
    enabled,
  });

  const { data: cashSessions = [] as CashSessionReportItemDto[], isPending: sessionsLoading } = useQuery({
    queryKey: queryKeys.reportCashSessions(utcFrom, utcTo, branchParam),
    queryFn:  () => reportsApi.getCashSessions(utcFrom, utcTo, branchParam),
    staleTime: 0,
    enabled,
  });

  const isLoading =
    enabled &&
    (cashierLoading || catLoading || hourLoading || dayHourLoading || sessionsLoading ||
      (isMultiDay && seriesLoading));

  return { prevReport, dailySeries, byCashier, topCategories, byHour, byDayHour, cashSessions, isLoading };
}
