import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EXPENSE_CATEGORY_REPOSITORY_PORT, ExpenseCategoryRepositoryPort } from '../../domain/ports/expense-category-repository.port';

@Injectable()
export class DeleteExpenseCategoryUseCase {
  constructor(
    @Inject(EXPENSE_CATEGORY_REPOSITORY_PORT)
    private readonly repo: ExpenseCategoryRepositoryPort,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const category = await this.repo.findById(id, tenantId);
    if (!category) throw new NotFoundException('Categoría no encontrada');
    await this.repo.delete(id, tenantId);
  }
}
