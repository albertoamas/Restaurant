import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ExpenseDto, ExpenseSummaryDto, ExpenseCategoryDto, ExpenseConceptDto } from '@pos/shared';
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
    queryClient.invalidateQueries({ queryKey: queryKeys.expensesAll });
  }, [queryClient]);

  useSocketEvent(SOCKET_EVENTS.EXPENSE_CREATED, invalidate);
  useSocketEvent(SOCKET_EVENTS.EXPENSE_UPDATED, invalidate);
  useSocketEvent(SOCKET_EVENTS.EXPENSE_DELETED, invalidate);

  return {
    expenses: data?.expenses ?? [],
    summary:  data?.summary  ?? { total: 0, byCategory: {}, byDay: {}, transactionCount: 0 },
    loading,
    error,
    reload: refetch,
  };
}

/**
 * Invalida el catálogo de gastos (categorías + conceptos) ante cualquier cambio
 * hecho desde otro dispositivo. Las dos listas van juntas porque el catálogo
 * auto-siembra categorías la primera vez.
 */
function useExpenseCatalogSync() {
  const queryClient = useQueryClient();

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.expenseConcepts });
    queryClient.invalidateQueries({ queryKey: queryKeys.expenseCategories });
  }, [queryClient]);

  useSocketEvent(SOCKET_EVENTS.EXPENSE_CATEGORY_CREATED, invalidate);
  useSocketEvent(SOCKET_EVENTS.EXPENSE_CATEGORY_UPDATED, invalidate);
  useSocketEvent(SOCKET_EVENTS.EXPENSE_CATEGORY_DELETED, invalidate);
  useSocketEvent(SOCKET_EVENTS.EXPENSE_CONCEPT_CREATED,  invalidate);
  useSocketEvent(SOCKET_EVENTS.EXPENSE_CONCEPT_UPDATED,  invalidate);
  useSocketEvent(SOCKET_EVENTS.EXPENSE_CONCEPT_DELETED,  invalidate);

  return invalidate;
}

export function useExpenseCategories() {
  useExpenseCatalogSync();

  const { data: categories = [] as ExpenseCategoryDto[], isPending: loading, refetch } = useQuery({
    queryKey: queryKeys.expenseCategories,
    queryFn:  () => expensesApi.getCategories(),
    staleTime: 5 * 60_000,
  });
  return { categories, loading, reload: refetch };
}

export function useExpenseConcepts() {
  const invalidate = useExpenseCatalogSync();

  const { data: concepts = [] as ExpenseConceptDto[], isPending: loading } = useQuery({
    queryKey: queryKeys.expenseConcepts,
    queryFn: () => expensesApi.getConcepts(),
    staleTime: 5 * 60_000,
  });

  return { concepts, loading, invalidate };
}
