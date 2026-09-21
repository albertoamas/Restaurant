import { Inject, Injectable } from '@nestjs/common';
import { ExpenseConceptDto } from '@pos/shared';
import {
  EXPENSE_CATEGORY_REPOSITORY_PORT,
  ExpenseCategoryRepositoryPort,
} from '../../domain/ports/expense-category-repository.port';
import {
  EXPENSE_CONCEPT_REPOSITORY_PORT,
  ExpenseConceptRepositoryPort,
} from '../../domain/ports/expense-concept-repository.port';
import { SeedDefaultExpenseConceptsUseCase } from './seed-default-expense-concepts.use-case';
import { toExpenseConceptDto } from './expense-concept.mapper';

@Injectable()
export class ListExpenseConceptsUseCase {
  constructor(
    @Inject(EXPENSE_CONCEPT_REPOSITORY_PORT)
    private readonly repo: ExpenseConceptRepositoryPort,
    @Inject(EXPENSE_CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepo: ExpenseCategoryRepositoryPort,
    private readonly seedDefaults: SeedDefaultExpenseConceptsUseCase,
  ) {}

  async execute(tenantId: string): Promise<ExpenseConceptDto[]> {
    if ((await this.repo.count(tenantId)) === 0) {
      await this.seedDefaults.execute(tenantId);
    }

    const [concepts, categories] = await Promise.all([
      this.repo.findAll(tenantId),
      this.categoryRepo.findAll(tenantId),
    ]);
    const categoryNames = new Map(categories.map((c) => [c.id, c.name]));

    return concepts.map((concept) =>
      toExpenseConceptDto(concept, categoryNames.get(concept.categoryId) ?? ''),
    );
  }
}
