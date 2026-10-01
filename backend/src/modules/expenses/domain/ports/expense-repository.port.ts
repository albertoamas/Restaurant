import { ExpenseSummaryDto, PaymentMethod } from '@pos/shared';
import { Expense } from '../entities/expense.entity';

export const EXPENSE_REPOSITORY_PORT = 'ExpenseRepositoryPort';

export interface NewExpenseItemInput {
  categoryId: string | null;
  conceptId: string | null;
  categoryName: string | null;
  name: string;
  unit: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ExpensePatch {
  category: string;
  amount: number;
  description: string | null;
  expenseDate: Date;
  paymentMethod: PaymentMethod | null;
  supplierName: string | null;
  documentNumber: string | null;
}

/** Filtros y página de la lista de gastos (pantalla Movimientos). */
export interface ExpenseListFilters {
  /** Nombre de la categoría: la del ítem o, en gastos viejos, la guardada en el gasto. */
  category?: string;
  /** Texto en el nombre de un ítem, la nota, el proveedor o el comprobante. */
  q?: string;
  page: number;
  limit: number;
}

export interface ExpenseRepositoryPort {
  save(expense: Expense, items: NewExpenseItemInput[]): Promise<Expense>;
  findById(id: string, tenantId: string): Promise<Expense | null>;
  update(id: string, tenantId: string, patch: ExpensePatch, items: NewExpenseItemInput[]): Promise<Expense>;
  findAll(
    tenantId: string,
    branchId: string | null,
    from: Date,
    to: Date,
  ): Promise<Expense[]>;
  findPage(
    tenantId: string,
    branchId: string | null,
    from: Date,
    to: Date,
    filters: ExpenseListFilters,
  ): Promise<{ data: Expense[]; total: number }>;
  getSummary(
    tenantId: string,
    branchId: string | null,
    from: Date,
    to: Date,
  ): Promise<ExpenseSummaryDto>;
  /** Anula un gasto activo del tenant. `false` si no existe o ya estaba anulado. */
  void(id: string, tenantId: string, userId: string, reason: string | null): Promise<boolean>;
}
