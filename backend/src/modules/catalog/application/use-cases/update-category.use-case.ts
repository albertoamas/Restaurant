import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CategoryRepositoryPort, CATEGORY_REPOSITORY_PORT } from '../../domain/ports/category-repository.port';
import { Category } from '../../domain/entities/category.entity';
import { UpdateCategoryDto } from '../dto/update-category.dto';

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepository: CategoryRepositoryPort,
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

    return this.categoryRepository.save(category);
  }
}
