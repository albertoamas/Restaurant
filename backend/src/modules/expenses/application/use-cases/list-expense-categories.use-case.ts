import { Inject, Injectable } from '@nestjs/common';
import { ExpenseCategoryEntity } from '../../domain/entities/expense-category.entity';
import { EXPENSE_CATEGORY_REPOSITORY_PORT, ExpenseCategoryRepositoryPort } from '../../domain/ports/expense-category-repository.port';

/**
 * Lista las categorías activas. Ya no siembra nada: un negocio nuevo empieza vacío y carga el
 * catálogo sugerido solo si quiere (`LoadSuggestedExpenseCatalogUseCase`).
 */
@Injectable()
export class ListExpenseCategoriesUseCase {
  constructor(
    @Inject(EXPENSE_CATEGORY_REPOSITORY_PORT)
    private readonly repo: ExpenseCategoryRepositoryPort,
  ) {}

  execute(tenantId: string): Promise<ExpenseCategoryEntity[]> {
    return this.repo.findAll(tenantId);
  }
}
