import { Inject, Injectable, Optional } from '@nestjs/common';
import { Expense } from '../../domain/entities/expense.entity';
import { EXPENSE_REPOSITORY_PORT, ExpenseRepositoryPort } from '../../domain/ports/expense-repository.port';
import { CashSessionRepositoryPort } from '../../../cash-session/domain/ports/cash-session-repository.port';
import { CreateExpenseDto } from '../dto/create-expense.dto';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class CreateExpenseUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_PORT)
    private readonly expenseRepository: ExpenseRepositoryPort,

    // Necesario para adjuntar el gasto a la sesión de caja activa del branch.
    // El módulo CashSessionModule debe estar importado en ExpensesModule.
    @Inject('CashSessionRepositoryPort')
    private readonly cashSessionRepository: CashSessionRepositoryPort,

    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(tenantId: string, branchId: string, userId: string, dto: CreateExpenseDto): Promise<Expense> {
    // Buscar sesión activa del branch para vincular el gasto formalmente.
    // Si no hay sesión abierta (fuera de horario), cashSessionId queda null — el gasto se registra igual.
    const activeSession = await this.cashSessionRepository.findOpenByBranch(tenantId, branchId);

    const expense = Expense.create({
      tenantId,
      branchId,
      category:      dto.category,
      amount:        dto.amount,
      description:   dto.description ?? null,
      createdBy:     userId,
      cashSessionId: activeSession?.id ?? null,
    });

    const saved = await this.expenseRepository.save(expense);
    this.eventsService?.emitToTenant(tenantId, 'expense.created', saved);
    return saved;
  }
}
