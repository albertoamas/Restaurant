import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { ProductRepositoryPort, PRODUCT_REPOSITORY_PORT } from '../../domain/ports/product-repository.port';
import { CategoryRepositoryPort, CATEGORY_REPOSITORY_PORT } from '../../domain/ports/category-repository.port';
import { Product } from '../../domain/entities/product.entity';
import { UpdateProductDto } from '../dto/update-product.dto';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepository: CategoryRepositoryPort,
    @Optional() private readonly eventsService?: EventsService,
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

    const saved = await this.productRepository.save(product);
    this.eventsService?.emitToTenant(tenantId, 'product.updated', saved);
    return saved;
  }
}
