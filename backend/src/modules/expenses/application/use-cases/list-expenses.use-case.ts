import { Inject, Injectable } from '@nestjs/common';
import { ExpenseCategory } from '@pos/shared';
import { Expense } from '../../domain/entities/expense.entity';
import { EXPENSE_REPOSITORY_PORT, ExpenseRepositoryPort } from '../../domain/ports/expense-repository.port';

@Injectable()
export class ListExpensesUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_PORT)
    private readonly expenseRepository: ExpenseRepositoryPort,
  ) {}

  async execute(
    tenantId: string,
    branchId: string | null,
    from: Date,
    to: Date,
    category?: ExpenseCategory,
  ): Promise<Expense[]> {
    return this.expenseRepository.findAll(tenantId, branchId, from, to, category);
  }
}
