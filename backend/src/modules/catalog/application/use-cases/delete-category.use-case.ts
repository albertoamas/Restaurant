import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { CategoryRepositoryPort, CATEGORY_REPOSITORY_PORT } from '../../domain/ports/category-repository.port';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class DeleteCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepository: CategoryRepositoryPort,
    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const category = await this.categoryRepository.findById(id, tenantId);
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    await this.categoryRepository.delete(id, tenantId);
    this.eventsService?.emitToTenant(tenantId, 'category.deleted', { id });
  }
}
