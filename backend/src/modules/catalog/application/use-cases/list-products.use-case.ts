import { Inject, Injectable } from '@nestjs/common';
import { ProductRepositoryPort, PRODUCT_REPOSITORY_PORT } from '../../domain/ports/product-repository.port';
import { Product } from '../../domain/entities/product.entity';

@Injectable()
export class ListProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepository: ProductRepositoryPort,
  ) {}

  async execute(tenantId: string, categoryId?: string): Promise<Product[]> {
    return this.productRepository.findAllByTenant(tenantId, categoryId);
  }
}
