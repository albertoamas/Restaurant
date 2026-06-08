import { useQuery } from '@tanstack/react-query';
import type { CategoryDto, DailyReportDto, ExpenseSummaryDto, TopCustomerDto, TopProductDto } from '@pos/shared';
import { reportsApi } from '../api/reports.api';
import { expensesApi } from '../api/expenses.api';
import { categoriesApi } from '../api/categories.api';
import { queryKeys } from '../lib/query-keys';

export function useReportData(
  utcFrom:         string,
  utcTo:           string,
  branchParam:     string | undefined,
  selectedCategory: string,
) {
  const { data: categories = [] as CategoryDto[] } = useQuery({
    queryKey: queryKeys.categories,
    queryFn:  () => categoriesApi.getAll(),
    staleTime: 5 * 60_000,
  });

  const { data: report = null, isPending: loading } = useQuery<DailyReportDto | null>({
    queryKey: queryKeys.reportRange(utcFrom, utcTo, branchParam),
    queryFn:  () => reportsApi.getByRange(utcFrom, utcTo, branchParam),
    staleTime: 0,
  });

  const { data: expenseSummary = null } = useQuery<ExpenseSummaryDto | null>({
    queryKey: queryKeys.reportExpenseSummary(utcFrom, utcTo, branchParam),
    queryFn:  () => expensesApi.getSummary(utcFrom, utcTo, branchParam).catch(() => null),
    staleTime: 0,
  });

  const { data: topProducts = [] as TopProductDto[], isPending: topLoading } = useQuery({
    queryKey: queryKeys.reportTopProducts(utcFrom, utcTo, branchParam, selectedCategory || undefined),
    queryFn:  () => reportsApi.getTopProducts(utcFrom, utcTo, branchParam, selectedCategory || undefined),
    staleTime: 0,
  });

  const { data: topCustomers = [] as TopCustomerDto[], isPending: custLoading } = useQuery({
    queryKey: queryKeys.reportTopCustomers(utcFrom, utcTo, branchParam),
    queryFn:  () => reportsApi.getTopCustomers(utcFrom, utcTo, branchParam),
    staleTime: 0,
  });

  return {
    categories,
    report,
    expenseSummary,
    topProducts,
    topCustomers,
    loading,
    topLoading,
    custLoading,
  };
}
