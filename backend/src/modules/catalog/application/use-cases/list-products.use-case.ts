import { Inject, Injectable } from '@nestjs/common';
import { ProductPage, ProductRepositoryPort, PRODUCT_REPOSITORY_PORT } from '../../domain/ports/product-repository.port';

@Injectable()
export class ListProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepository: ProductRepositoryPort,
  ) {}

  async execute(tenantId: string, categoryId?: string, includeInactive = false, page = 1, limit = 100): Promise<ProductPage> {
    return this.productRepository.findAllByTenant(tenantId, categoryId, includeInactive, page, limit);
  }
}
