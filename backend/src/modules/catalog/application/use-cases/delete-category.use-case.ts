import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CategoryRepositoryPort, CATEGORY_REPOSITORY_PORT } from '../../domain/ports/category-repository.port';

@Injectable()
export class DeleteCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const category = await this.categoryRepository.findById(id, tenantId);
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    await this.categoryRepository.delete(id, tenantId);
  }
}
