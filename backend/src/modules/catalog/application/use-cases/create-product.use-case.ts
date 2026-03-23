import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepositoryPort, PRODUCT_REPOSITORY_PORT } from '../../domain/ports/product-repository.port';
import { CategoryRepositoryPort, CATEGORY_REPOSITORY_PORT } from '../../domain/ports/category-repository.port';
import { Product } from '../../domain/entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async execute(tenantId: string, dto: CreateProductDto): Promise<Product> {
    const category = await this.categoryRepository.findById(dto.categoryId, tenantId);
    if (!category) {
      throw new NotFoundException(`Category ${dto.categoryId} not found`);
    }

    const product = Product.create({
      tenantId,
      categoryId: dto.categoryId,
      name: dto.name,
      price: dto.price,
      imageUrl: dto.imageUrl ?? null,
    });

    return this.productRepository.save(product);
  }
}
