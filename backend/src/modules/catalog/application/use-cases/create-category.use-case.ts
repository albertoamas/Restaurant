import { Inject, Injectable, Optional } from '@nestjs/common';
import { CategoryRepositoryPort, CATEGORY_REPOSITORY_PORT } from '../../domain/ports/category-repository.port';
import { Category } from '../../domain/entities/category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepository: CategoryRepositoryPort,
    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(tenantId: string, dto: CreateCategoryDto): Promise<Category> {
    const category = Category.create({
      tenantId,
      name: dto.name,
      sortOrder: dto.sortOrder,
    });
    const saved = await this.categoryRepository.save(category);
    this.eventsService?.emitToTenant(tenantId, 'category.created', saved);
    return saved;
  }
}
