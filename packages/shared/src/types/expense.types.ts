import { ExpenseCategory } from './enums';

export interface ExpenseDto {
  id: string;
  branchId: string;
  category: ExpenseCategory;
  amount: number;
  description: string | null;
  createdBy: string;
  createdAt: string;
}

export interface CreateExpenseRequest {
  category: ExpenseCategory;
  amount: number;
  description?: string;
  branchId?: string;
}

export interface ExpenseSummaryDto {
  total: number;
  byCategory: Partial<Record<ExpenseCategory, number>>;
}
