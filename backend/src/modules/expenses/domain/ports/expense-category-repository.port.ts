import { ExpenseCategoryEntity } from '../entities/expense-category.entity';

export const EXPENSE_CATEGORY_REPOSITORY_PORT = 'ExpenseCategoryRepositoryPort';

export interface ExpenseCategoryRepositoryPort {
  save(category: ExpenseCategoryEntity): Promise<ExpenseCategoryEntity>;
  /** Alta masiva idempotente: ignora las que ya existan por (tenant, name). */
  saveMany(categories: ExpenseCategoryEntity[]): Promise<void>;
  update(category: ExpenseCategoryEntity): Promise<ExpenseCategoryEntity>;
  findAll(tenantId: string): Promise<ExpenseCategoryEntity[]>;
  findById(id: string, tenantId: string): Promise<ExpenseCategoryEntity | null>;
  /** Case-insensitive incluyendo desactivadas — protege el único (tenant, name). */
  findByName(tenantId: string, name: string): Promise<ExpenseCategoryEntity | null>;
  delete(id: string, tenantId: string): Promise<void>;
}
