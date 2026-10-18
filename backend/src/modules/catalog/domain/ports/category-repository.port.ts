import { Category } from '../entities/category.entity';

export const CATEGORY_REPOSITORY_PORT = 'CategoryRepositoryPort';

export interface CategoryRepositoryPort {
  findAllByTenant(tenantId: string): Promise<Category[]>;
  findById(id: string, tenantId: string): Promise<Category | null>;
  /** Solo las que existen en el negocio, activas o no. */
  findByIds(ids: string[], tenantId: string): Promise<Category[]>;
  /**
   * Algún sorteo la usa, o usa un producto suyo. Borrarla arrastra sus productos y dejaría al
   * sorteo sin regla.
   */
  isUsedByRaffle(id: string, tenantId: string): Promise<boolean>;
  save(category: Category): Promise<Category>;
  delete(id: string, tenantId: string): Promise<void>;
}
