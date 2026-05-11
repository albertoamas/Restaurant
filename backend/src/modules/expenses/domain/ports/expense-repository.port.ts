import { ExpenseSummaryDto } from '@pos/shared';
import { Expense } from '../entities/expense.entity';

export const EXPENSE_REPOSITORY_PORT = 'ExpenseRepositoryPort';

export interface NewExpenseItemInput {
  categoryId: string | null;
  categoryName: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ExpensePatch {
  category: string;
  amount: number;
  description: string | null;
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
  delete(id: string, tenantId: string): Promise<void>;
}
