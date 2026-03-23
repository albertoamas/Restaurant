import { Inject, Injectable } from '@nestjs/common';
import { CategoryRepositoryPort, CATEGORY_REPOSITORY_PORT } from '../../domain/ports/category-repository.port';
import { Category } from '../../domain/entities/category.entity';

@Injectable()
export class ListCategoriesUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async execute(tenantId: string): Promise<Category[]> {
    return this.categoryRepository.findAllByTenant(tenantId);
  }
}
