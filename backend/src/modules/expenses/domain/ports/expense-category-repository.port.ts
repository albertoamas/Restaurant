import { ExpenseCategoryEntity } from '../entities/expense-category.entity';

export const EXPENSE_CATEGORY_REPOSITORY_PORT = 'ExpenseCategoryRepositoryPort';

export interface ExpenseCategoryRepositoryPort {
  save(category: ExpenseCategoryEntity): Promise<ExpenseCategoryEntity>;
  findAll(tenantId: string): Promise<ExpenseCategoryEntity[]>;
  findById(id: string, tenantId: string): Promise<ExpenseCategoryEntity | null>;
  delete(id: string, tenantId: string): Promise<void>;
}
