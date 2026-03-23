import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepositoryPort, PRODUCT_REPOSITORY_PORT } from '../../domain/ports/product-repository.port';
import { Product } from '../../domain/entities/product.entity';

@Injectable()
export class ToggleProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepository: ProductRepositoryPort,
  ) {}

  async execute(id: string, tenantId: string): Promise<Product> {
    const product = await this.productRepository.findById(id, tenantId);
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    product.isActive = !product.isActive;

    return this.productRepository.save(product);
  }
}
