import { ExpenseCategory, ExpenseSummaryDto } from '@pos/shared';
import { Expense } from '../entities/expense.entity';

export const EXPENSE_REPOSITORY_PORT = 'ExpenseRepositoryPort';

export interface ExpenseRepositoryPort {
  save(expense: Expense): Promise<Expense>;
  findAll(
    tenantId: string,
    branchId: string | null,
    from: Date,
    to: Date,
    category?: ExpenseCategory,
  ): Promise<Expense[]>;
  getSummary(
    tenantId: string,
    branchId: string | null,
    from: Date,
    to: Date,
  ): Promise<ExpenseSummaryDto>;
  delete(id: string, tenantId: string): Promise<void>;
}
