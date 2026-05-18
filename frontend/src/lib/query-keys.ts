export const queryKeys = {
  // ── Static ────────────────────────────────────────────────────────────────
  categories:  ['categories']  as const,
  branches:    ['branches']    as const,
  users:       ['users']       as const,
  plans:       ['plans']       as const,
  raffles:     ['raffles']     as const,

  // ── Parameterised ─────────────────────────────────────────────────────────
  raffleDetail: (id: string) =>
    ['raffles', id] as const,

  products: (p: { q: string; categoryId?: string; page: number; includeInactive: boolean; pageSize: number }) =>
    ['products', p] as const,

  customers: (p: { q: string; page: number; sortBy: string; sortDir: string }) =>
    ['customers', p] as const,

  expenses: (from: string, to: string, branchId?: string) =>
    ['expenses', from, to, branchId] as const,

  expenseCategories: ['expenseCategories'] as const,

  cashSession: (branchId: string) =>
    ['cashSession', branchId] as const,

  // ── Reports ───────────────────────────────────────────────────────────────
  reportRange: (from: string, to: string, branchId?: string) =>
    ['reports', 'range', from, to, branchId] as const,

  reportTopProducts: (from: string, to: string, branchId?: string, categoryId?: string) =>
    ['reports', 'topProducts', from, to, branchId, categoryId] as const,

  reportTopCustomers: (from: string, to: string, branchId?: string) =>
    ['reports', 'topCustomers', from, to, branchId] as const,

  reportExpenseSummary: (from: string, to: string, branchId?: string) =>
    ['reports', 'expenseSummary', from, to, branchId] as const,
};
