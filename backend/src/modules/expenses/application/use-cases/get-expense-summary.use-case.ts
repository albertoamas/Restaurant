import { Inject, Injectable } from '@nestjs/common';
import { ExpenseSummaryDto } from '@pos/shared';
import { EXPENSE_REPOSITORY_PORT, ExpenseRepositoryPort } from '../../domain/ports/expense-repository.port';

@Injectable()
export class GetExpenseSummaryUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_PORT)
    private readonly expenseRepository: ExpenseRepositoryPort,
  ) {}

  async execute(tenantId: string, branchId: string | null, from: Date, to: Date): Promise<ExpenseSummaryDto> {
    return this.expenseRepository.getSummary(tenantId, branchId, from, to);
  }
}
