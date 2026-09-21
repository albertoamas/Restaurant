import client from './client';
import type {
  ExpenseDto,
  ExpenseSummaryDto,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseCategoryDto,
  ExpenseConceptDto,
  CreateExpenseConceptRequest,
  UpdateExpenseConceptRequest,
  CreateExpenseCategoryRequest,
  UpdateExpenseCategoryRequest,
  VoidExpenseRequest,
} from '@pos/shared';

export const expensesApi = {
  // ── Categories ─────────────────────────────────────────────────

  getCategories: () =>
    client.get<ExpenseCategoryDto[]>('/api/v1/expenses/categories').then((r) => r.data),

  createCategory: (data: CreateExpenseCategoryRequest) =>
    client.post<ExpenseCategoryDto>('/api/v1/expenses/categories', data).then((r) => r.data),

  updateCategory: (id: string, data: UpdateExpenseCategoryRequest) =>
    client.patch<ExpenseCategoryDto>(`/api/v1/expenses/categories/${id}`, data).then((r) => r.data),

  deleteCategory: (id: string) =>
    client.delete(`/api/v1/expenses/categories/${id}`).then((r) => r.data),

  // ── Gastos predefinidos ────────────────────────────────────────

  getConcepts: () =>
    client.get<ExpenseConceptDto[]>('/api/v1/expenses/concepts').then((r) => r.data),

  createConcept: (data: CreateExpenseConceptRequest) =>
    client.post<ExpenseConceptDto>('/api/v1/expenses/concepts', data).then((r) => r.data),

  updateConcept: (id: string, data: UpdateExpenseConceptRequest) =>
    client.patch<ExpenseConceptDto>(`/api/v1/expenses/concepts/${id}`, data).then((r) => r.data),

  deleteConcept: (id: string) =>
    client.delete(`/api/v1/expenses/concepts/${id}`).then(() => {}),

  // ── Expenses ───────────────────────────────────────────────────

  getAll: (from: string, to: string, branchId?: string) =>
    client
      .get<ExpenseDto[]>('/api/v1/expenses', {
        params: { from, to, ...(branchId ? { branchId } : {}) },
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

  update: (id: string, data: UpdateExpenseRequest) =>
    client.patch<ExpenseDto>(`/api/v1/expenses/${id}`, data).then((r) => r.data),

  void: (id: string, data: VoidExpenseRequest = {}) =>
    client.delete(`/api/v1/expenses/${id}`, { data }).then((r) => r.data),
};
