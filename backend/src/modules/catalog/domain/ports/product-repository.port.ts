import { Product } from '../entities/product.entity';

export const PRODUCT_REPOSITORY_PORT = 'ProductRepositoryPort';

export interface ProductPage {
  data: Product[];
  total: number;
}

export interface ProductRepositoryPort {
  findAllByTenant(tenantId: string, categoryId?: string, includeInactive?: boolean, page?: number, limit?: number, q?: string): Promise<ProductPage>;
  findById(id: string, tenantId: string): Promise<Product | null>;
  findByIds(ids: string[], tenantId: string): Promise<Product[]>;
  countByTenant(tenantId: string): Promise<number>;
  save(product: Product): Promise<Product>;
}
