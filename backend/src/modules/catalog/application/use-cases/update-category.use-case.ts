import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { CategoryRepositoryPort, CATEGORY_REPOSITORY_PORT } from '../../domain/ports/category-repository.port';
import { Category } from '../../domain/entities/category.entity';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepository: CategoryRepositoryPort,
    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(id: string, tenantId: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepository.findById(id, tenantId);
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }

    if (dto.name !== undefined) {
      category.name = dto.name;
    }
    if (dto.sortOrder !== undefined) {
      category.sortOrder = dto.sortOrder;
    }

    const saved = await this.categoryRepository.save(category);
    this.eventsService?.emitToTenant(tenantId, 'category.updated', saved);
    return saved;
  }
}
