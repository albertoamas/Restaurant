import { useState, useEffect } from 'react';
import type { ExpenseDto, ExpenseSummaryDto } from '@pos/shared';
import { expensesApi } from '../api/expenses.api';

export function useExpenses(from: string, to: string, branchId?: string) {
  const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
  const [summary, setSummary] = useState<ExpenseSummaryDto>({ total: 0, byCategory: {} });
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      expensesApi.getAll(from, to, branchId),
      expensesApi.getSummary(from, to, branchId),
    ])
      .then(([list, sum]) => {
        setExpenses(list);
        setSummary(sum);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [from, to, branchId]);

  return { expenses, summary, loading, reload: load };
}
