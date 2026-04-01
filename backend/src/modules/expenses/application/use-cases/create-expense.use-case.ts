import { Inject, Injectable } from '@nestjs/common';
import { Expense } from '../../domain/entities/expense.entity';
import { EXPENSE_REPOSITORY_PORT, ExpenseRepositoryPort } from '../../domain/ports/expense-repository.port';
import { CreateExpenseDto } from '../dto/create-expense.dto';

@Injectable()
export class CreateExpenseUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_PORT)
    private readonly expenseRepository: ExpenseRepositoryPort,
  ) {}

  async execute(tenantId: string, branchId: string, userId: string, dto: CreateExpenseDto): Promise<Expense> {
    const expense = Expense.create({
      tenantId,
      branchId,
      category: dto.category,
      amount: dto.amount,
      description: dto.description ?? null,
      createdBy: userId,
    });
    return this.expenseRepository.save(expense);
  }
}
