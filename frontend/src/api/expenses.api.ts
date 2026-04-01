import client from './client';
import type { ExpenseDto, ExpenseSummaryDto, CreateExpenseRequest, ExpenseCategory } from '@pos/shared';

export const expensesApi = {
  getAll: (from: string, to: string, branchId?: string, category?: ExpenseCategory) =>
    client
      .get<ExpenseDto[]>('/api/v1/expenses', {
        params: {
          from,
          to,
          ...(branchId ? { branchId } : {}),
          ...(category ? { category } : {}),
        },
      })
      .then((r) => r.data),

  getSummary: (from: string, to: string, branchId?: string) =>
    client
      .get<ExpenseSummaryDto>('/api/v1/expenses/summary', {
        params: { from, to, ...(branchId ? { branchId } : {}) },
      })
      .then((r) => r.data),

  create: (data: CreateExpenseRequest) =>
    client.post<ExpenseDto>('/api/v1/expenses', data).then((r) => r.data),

  delete: (id: string) =>
    client.delete(`/api/v1/expenses/${id}`).then((r) => r.data),
};
