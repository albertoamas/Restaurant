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

  /** Crea las categorías elegidas del catálogo sugerido, con sus gastos. */
  loadSuggestedCatalog: (categories: string[]) =>
    client
      .post<{ categories: number; concepts: number }>('/api/v1/expenses/catalog/suggested', { categories })
      .then((r) => r.data),

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

  /** Una página de movimientos con filtros; el total viene en X-Total-Count. */
  getPage: (params: {
    from: string; to: string; branchId?: string;
    category?: string; q?: string; page: number; limit: number;
  }): Promise<{ data: ExpenseDto[]; total: number }> =>
    client
      .get<ExpenseDto[]>('/api/v1/expenses', {
        params: {
          from: params.from, to: params.to, page: params.page, limit: params.limit,
          ...(params.branchId ? { branchId: params.branchId } : {}),
          ...(params.category ? { category: params.category } : {}),
          ...(params.q ? { q: params.q } : {}),
        },
      })
      .then((r) => ({ data: r.data, total: Number(r.headers['x-total-count'] ?? r.data.length) })),

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
