import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepositoryPort, PRODUCT_REPOSITORY_PORT } from '../../domain/ports/product-repository.port';
import { CategoryRepositoryPort, CATEGORY_REPOSITORY_PORT } from '../../domain/ports/category-repository.port';
import { Product } from '../../domain/entities/product.entity';
import { UpdateProductDto } from '../dto/update-product.dto';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async execute(id: string, tenantId: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.findById(id, tenantId);
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    if (dto.categoryId !== undefined) {
      const category = await this.categoryRepository.findById(dto.categoryId, tenantId);
      if (!category) {
        throw new NotFoundException(`Category ${dto.categoryId} not found`);
      }
    }

    product.update({
      categoryId: dto.categoryId,
      name: dto.name,
      price: dto.price,
      imageUrl: dto.imageUrl,
    });

    return this.productRepository.save(product);
  }
}
