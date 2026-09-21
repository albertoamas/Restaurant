import { useQuery } from '@tanstack/react-query';
import type { CategoryDto, DailyReportDto, ExpenseSummaryDto, TopCustomerDto, TopProductDto } from '@pos/shared';
import { reportsApi } from '../api/reports.api';
import { expensesApi } from '../api/expenses.api';
import { categoriesApi } from '../api/categories.api';
import { queryKeys } from '../lib/query-keys';

/**
 * Base del reporte: ventas del período y total de gastos. Siempre activo —
 * lo usan el resumen, los KPIs de ventas y el detalle de gastos.
 */
export function useReportSummary(utcFrom: string, utcTo: string, branchParam: string | undefined) {
  const { data: report = null, isPending: loading } = useQuery<DailyReportDto | null>({
    queryKey: queryKeys.reportRange(utcFrom, utcTo, branchParam),
    queryFn:  () => reportsApi.getByRange(utcFrom, utcTo, branchParam),
    staleTime: 0,
  });

  const { data: expenseSummary = null, isPending: expenseLoading } = useQuery<ExpenseSummaryDto | null>({
    queryKey: queryKeys.reportExpenseSummary(utcFrom, utcTo, branchParam),
    queryFn:  () => expensesApi.getSummary(utcFrom, utcTo, branchParam).catch(() => null),
    staleTime: 0,
  });

  return { report, expenseSummary, loading, expenseLoading };
}

/** Datos de la pestaña Productos. Solo se piden cuando esa pestaña está activa. */
export function useTopProductsReport(
  utcFrom: string,
  utcTo: string,
  branchParam: string | undefined,
  selectedCategory: string,
  enabled: boolean,
) {
  const { data: categories = [] as CategoryDto[] } = useQuery({
    queryKey: queryKeys.categories,
    queryFn:  () => categoriesApi.getAll(),
    staleTime: 5 * 60_000,
    enabled,
  });

  const { data: topProducts = [] as TopProductDto[], isPending } = useQuery({
    queryKey: queryKeys.reportTopProducts(utcFrom, utcTo, branchParam, selectedCategory || undefined),
    queryFn:  () => reportsApi.getTopProducts(utcFrom, utcTo, branchParam, selectedCategory || undefined),
    staleTime: 0,
    enabled,
  });

  return { categories, topProducts, loading: enabled && isPending };
}

/** Datos de la pestaña Clientes. */
export function useTopCustomersReport(
  utcFrom: string,
  utcTo: string,
  branchParam: string | undefined,
  enabled: boolean,
) {
  const { data: topCustomers = [] as TopCustomerDto[], isPending } = useQuery({
    queryKey: queryKeys.reportTopCustomers(utcFrom, utcTo, branchParam),
    queryFn:  () => reportsApi.getTopCustomers(utcFrom, utcTo, branchParam),
    staleTime: 0,
    enabled,
  });

  return { topCustomers, loading: enabled && isPending };
}
