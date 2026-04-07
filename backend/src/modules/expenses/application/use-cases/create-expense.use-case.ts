import { Inject, Injectable, Optional } from '@nestjs/common';
import { Expense } from '../../domain/entities/expense.entity';
import { EXPENSE_REPOSITORY_PORT, ExpenseRepositoryPort } from '../../domain/ports/expense-repository.port';
import { CreateExpenseDto } from '../dto/create-expense.dto';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class CreateExpenseUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_PORT)
    private readonly expenseRepository: ExpenseRepositoryPort,
    @Optional() private readonly eventsService?: EventsService,
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
    const saved = await this.expenseRepository.save(expense);
    this.eventsService?.emit(tenantId, branchId, 'expense.created', saved);
    return saved;
  }
}
