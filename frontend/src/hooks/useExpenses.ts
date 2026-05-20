import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ExpenseDto, ExpenseSummaryDto, ExpenseCategoryDto } from '@pos/shared';
import { SOCKET_EVENTS } from '@pos/shared';
import { expensesApi } from '../api/expenses.api';
import { useSocketEvent } from '../context/socket.context';
import { queryKeys } from '../lib/query-keys';

export function useExpenses(from: string, to: string, branchId?: string) {
  const queryClient = useQueryClient();

  const { data, isPending: loading, isError: error, refetch } = useQuery({
    queryKey: queryKeys.expenses(from, to, branchId),
    queryFn:  () =>
      Promise.all([
        expensesApi.getAll(from, to, branchId),
        expensesApi.getSummary(from, to, branchId),
      ]).then(([expenses, summary]): { expenses: ExpenseDto[]; summary: ExpenseSummaryDto } => ({
        expenses,
        summary,
      })),
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
  }, [queryClient]);

  useSocketEvent(SOCKET_EVENTS.EXPENSE_CREATED, invalidate);
  useSocketEvent(SOCKET_EVENTS.EXPENSE_DELETED, invalidate);

  return {
    expenses: data?.expenses ?? [],
    summary:  data?.summary  ?? { total: 0, byCategory: {} },
    loading,
    error,
    reload: refetch,
  };
}

export function useExpenseCategories() {
  const { data: categories = [] as ExpenseCategoryDto[], isPending: loading, refetch } = useQuery({
    queryKey: queryKeys.expenseCategories,
    queryFn:  () => expensesApi.getCategories(),
    staleTime: 5 * 60_000,
  });
  return { categories, loading, reload: refetch };
}
