import { Inject, Injectable } from '@nestjs/common';
import { ExpenseCategoryEntity } from '../../domain/entities/expense-category.entity';
import { EXPENSE_CATEGORY_REPOSITORY_PORT, ExpenseCategoryRepositoryPort } from '../../domain/ports/expense-category-repository.port';
import { CreateExpenseCategoryUseCase } from './create-expense-category.use-case';

@Injectable()
export class ListExpenseCategoriesUseCase {
  constructor(
    @Inject(EXPENSE_CATEGORY_REPOSITORY_PORT)
    private readonly repo: ExpenseCategoryRepositoryPort,
    private readonly createCategory: CreateExpenseCategoryUseCase,
  ) {}

  async execute(tenantId: string): Promise<ExpenseCategoryEntity[]> {
    const categories = await this.repo.findAll(tenantId);
    // First-time experience: auto-seed defaults so the user doesn't start empty.
    if (categories.length === 0) {
      return this.createCategory.seedDefaults(tenantId);
    }
    return categories;
  }
}
