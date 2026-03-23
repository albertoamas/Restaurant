import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepositoryPort, PRODUCT_REPOSITORY_PORT } from '../../domain/ports/product-repository.port';
import { Product } from '../../domain/entities/product.entity';
import { UpdateProductDto } from '../dto/update-product.dto';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepository: ProductRepositoryPort,
  ) {}

  async execute(id: string, tenantId: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.findById(id, tenantId);
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    if (dto.categoryId !== undefined) {
      product.categoryId = dto.categoryId;
    }
    if (dto.name !== undefined) {
      product.name = dto.name;
    }
    if (dto.price !== undefined) {
      product.price = dto.price;
    }
    if (dto.imageUrl !== undefined) {
      product.imageUrl = dto.imageUrl ?? null;
    }

    return this.productRepository.save(product);
  }
}
