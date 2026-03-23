import { Inject, Injectable } from '@nestjs/common';
import { CategoryRepositoryPort, CATEGORY_REPOSITORY_PORT } from '../../domain/ports/category-repository.port';
import { Category } from '../../domain/entities/category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepository: CategoryRepositoryPort,
  ) {}

  async execute(tenantId: string, dto: CreateCategoryDto): Promise<Category> {
    const category = Category.create({
      tenantId,
      name: dto.name,
      sortOrder: dto.sortOrder,
    });
    return this.categoryRepository.save(category);
  }
}
