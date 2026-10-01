import { useCallback, useMemo } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ExpenseDto, ExpenseSummaryDto, ExpenseCategoryDto, ExpenseConceptDto } from '@pos/shared';
import { SOCKET_EVENTS } from '@pos/shared';
import { expensesApi } from '../api/expenses.api';
import { useSocketEvent } from '../context/socket.context';
import { queryKeys } from '../lib/query-keys';

const EMPTY_SUMMARY: ExpenseSummaryDto = { total: 0, byCategory: {}, byDay: {}, transactionCount: 0 };

/** Cualquier cambio de gastos (en este u otro equipo) invalida todo lo que cuelga de 'expenses'. */
function useExpenseEventsSync() {
  const queryClient = useQueryClient();
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.expensesAll });
  }, [queryClient]);
  useSocketEvent(SOCKET_EVENTS.EXPENSE_CREATED, invalidate);
  useSocketEvent(SOCKET_EVENTS.EXPENSE_UPDATED, invalidate);
  useSocketEvent(SOCKET_EVENTS.EXPENSE_DELETED, invalidate);
  return invalidate;
}

/**
 * Gastos de un período completo, con su resumen (el bloque "Registrado hoy"). `invalidate` refresca
 * todo lo de gastos (también Movimientos), no solo esta consulta.
 */
export function useExpenses(from: string, to: string, branchId?: string) {
  const invalidate = useExpenseEventsSync();
  const { data, isPending: loading, isError: error } = useQuery({
    queryKey: queryKeys.expenses(from, to, branchId),
    queryFn:  () =>
      Promise.all([expensesApi.getAll(from, to, branchId), expensesApi.getSummary(from, to, branchId)])
        .then(([expenses, summary]): { expenses: ExpenseDto[]; summary: ExpenseSummaryDto } => ({ expenses, summary })),
  });
  return {
    expenses: data?.expenses ?? [],
    summary:  data?.summary ?? EMPTY_SUMMARY,
    loading,
    error,
    invalidate,
  };
}

/** Totales del período completo (no de lo cargado en la lista): cifras, categorías y calendario. */
export function useExpenseSummary(from: string, to: string, branchId?: string) {
  const invalidate = useExpenseEventsSync();
  const { data, isPending } = useQuery({
    queryKey: queryKeys.expenseSummary(from, to, branchId),
    queryFn:  () => expensesApi.getSummary(from, to, branchId),
  });
  return { summary: data ?? EMPTY_SUMMARY, loading: isPending, invalidate };
}

export const MOVEMENTS_PAGE_SIZE = 30;

/**
 * Movimientos de a 30, con los filtros aplicados en el servidor: con un rango largo no se
 * descarga todo el período para mostrar las primeras filas.
 */
export function useExpenseMovements(params: { from: string; to: string; branchId?: string; category: string; q: string }) {
  useExpenseEventsSync();
  const { data, isPending, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: queryKeys.expenseMovements(params),
    queryFn:  ({ pageParam }) => expensesApi.getPage({ ...params, page: pageParam, limit: MOVEMENTS_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last, all) => {
      const loaded = all.reduce((n, p) => n + p.data.length, 0);
      return loaded < last.total ? all.length + 1 : undefined;
    },
  });
  const expenses = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
  return {
    expenses,
    total:       data?.pages[0]?.total ?? 0,
    loading:     isPending,
    loadingMore: isFetchingNextPage,
    hasMore:     hasNextPage,
    loadMore:    () => { void fetchNextPage(); },
  };
}

/**
 * Invalida el catálogo de gastos (categorías + conceptos) ante cualquier cambio
 * hecho desde otro dispositivo. Las dos listas van juntas porque cargar el catálogo
 * sugerido crea categorías y gastos a la vez.
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
