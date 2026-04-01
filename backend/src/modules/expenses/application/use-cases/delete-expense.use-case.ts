import { Inject, Injectable } from '@nestjs/common';
import { EXPENSE_REPOSITORY_PORT, ExpenseRepositoryPort } from '../../domain/ports/expense-repository.port';

@Injectable()
export class DeleteExpenseUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_PORT)
    private readonly expenseRepository: ExpenseRepositoryPort,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    return this.expenseRepository.delete(id, tenantId);
  }
}
