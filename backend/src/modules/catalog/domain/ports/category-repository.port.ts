import { Category } from '../entities/category.entity';

export const CATEGORY_REPOSITORY_PORT = 'CategoryRepositoryPort';

export interface CategoryRepositoryPort {
  findAllByTenant(tenantId: string): Promise<Category[]>;
  findById(id: string, tenantId: string): Promise<Category | null>;
  save(category: Category): Promise<Category>;
  delete(id: string, tenantId: string): Promise<void>;
}
