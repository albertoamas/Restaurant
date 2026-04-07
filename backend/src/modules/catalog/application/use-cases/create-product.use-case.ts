import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { ProductRepositoryPort, PRODUCT_REPOSITORY_PORT } from '../../domain/ports/product-repository.port';
import { CategoryRepositoryPort, CATEGORY_REPOSITORY_PORT } from '../../domain/ports/category-repository.port';
import { Product } from '../../domain/entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepository: CategoryRepositoryPort,
    @Optional() private readonly eventsService?: EventsService,
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

    const saved = await this.productRepository.save(product);
    this.eventsService?.emitToTenant(tenantId, 'product.created', saved);
    return saved;
  }
}
