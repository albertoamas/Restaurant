import { ExpenseSummaryDto, PaymentMethod } from '@pos/shared';
import { Expense } from '../entities/expense.entity';

export const EXPENSE_REPOSITORY_PORT = 'ExpenseRepositoryPort';

export interface NewExpenseItemInput {
  categoryId: string | null;
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
  getSummary(
    tenantId: string,
    branchId: string | null,
    from: Date,
    to: Date,
  ): Promise<ExpenseSummaryDto>;
  void(id: string, tenantId: string, userId: string, reason: string | null): Promise<void>;
}
