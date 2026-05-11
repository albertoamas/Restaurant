import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import type { ExpenseDto, ExpenseSummaryDto, ExpenseCategoryDto } from '@pos/shared';
import { expensesApi } from '../api/expenses.api';
import { useVisibilityRefresh } from './useVisibilityRefresh';
import { useSocketEvent } from '../context/socket.context';

export function useExpenses(from: string, to: string, branchId?: string) {
  const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
  const [summary, setSummary] = useState<ExpenseSummaryDto>({ total: 0, byCategory: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([
      expensesApi.getAll(from, to, branchId),
      expensesApi.getSummary(from, to, branchId),
    ])
      .then(([list, sum]) => {
        setExpenses(list);
        setSummary(sum);
      })
      .catch(() => {
        setError(true);
        toast.error('Error al cargar gastos');
      })
      .finally(() => setLoading(false));
  }, [from, to, branchId]);

  useEffect(() => { load(); }, [load]);

  useVisibilityRefresh(load);
  useSocketEvent('expense.created', load);
  useSocketEvent('expense.deleted', load);

  return { expenses, summary, loading, error, reload: load };
}

export function useExpenseCategories() {
  const [categories, setCategories] = useState<ExpenseCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    expensesApi
      .getCategories()
      .then(setCategories)
      .catch(() => { /* silently ignore — categories are best-effort */ })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return { categories, loading, reload: load };
}
