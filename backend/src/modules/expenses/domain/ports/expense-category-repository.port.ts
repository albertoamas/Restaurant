import { ExpenseCategoryEntity } from '../entities/expense-category.entity';

export const EXPENSE_CATEGORY_REPOSITORY_PORT = 'ExpenseCategoryRepositoryPort';

export interface ExpenseCategoryRepositoryPort {
  save(category: ExpenseCategoryEntity): Promise<ExpenseCategoryEntity>;
  update(category: ExpenseCategoryEntity): Promise<ExpenseCategoryEntity>;
  findAll(tenantId: string): Promise<ExpenseCategoryEntity[]>;
  findById(id: string, tenantId: string): Promise<ExpenseCategoryEntity | null>;
  /** Case-insensitive, incluye eliminadas; devuelve primero la activa si la hay. */
  findByName(tenantId: string, name: string): Promise<ExpenseCategoryEntity | null>;
  /** Baja lógica de la categoría y de sus gastos predefinidos. */
  delete(id: string, tenantId: string): Promise<void>;
}
