import { Inject, Injectable, Optional } from '@nestjs/common';
import { SOCKET_EVENTS } from '@pos/shared';
import { Expense } from '../../domain/entities/expense.entity';
import { EXPENSE_REPOSITORY_PORT, ExpenseRepositoryPort } from '../../domain/ports/expense-repository.port';
import { BranchAccessService } from '../../../branch/application/services/branch-access.service';
import { CashSessionRepositoryPort } from '../../../cash-session/domain/ports/cash-session-repository.port';
import { CreateExpenseDto } from '../dto/create-expense.dto';
import { ExpenseItemsService, resolveExpenseDate } from '../services/expense-items.service';
import { EventsService } from '../../../events/events.service';

/**
 * `Expense.category` de un gasto sin categoría. Es la clave del enum viejo `ExpenseCategory`: el
 * frontend la traduce a "Otro" (`utils/expense-labels.ts`) y los reportes ya agrupan por ella.
 */
const UNCATEGORIZED = 'OTHER';

@Injectable()
export class CreateExpenseUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_PORT)
    private readonly expenseRepository: ExpenseRepositoryPort,

    private readonly itemsService: ExpenseItemsService,

    private readonly branchAccess: BranchAccessService,

    @Inject('CashSessionRepositoryPort')
    private readonly cashSessionRepository: CashSessionRepositoryPort,

    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(tenantId: string, branchId: string, userId: string, dto: CreateExpenseDto): Promise<Expense> {
    await this.branchAccess.assertUsable(branchId, tenantId);

    const { items, amount, mainCategory } = await this.itemsService.build(tenantId, dto.items);
    const activeSession = await this.cashSessionRepository.findOpenByBranch(tenantId, branchId);

    const expense = Expense.create({
      tenantId,
      branchId,
      category:       mainCategory ?? UNCATEGORIZED,
      amount,
      description:    dto.description?.trim() || null,
      expenseDate:    resolveExpenseDate(dto.expenseDate, new Date()),
      paymentMethod:  dto.paymentMethod ?? null,
      supplierName:   dto.supplierName?.trim() || null,
      documentNumber: dto.documentNumber?.trim() || null,
      createdBy:      userId,
      cashSessionId:  activeSession?.id ?? null,
      items:          [],
    });

    const saved = await this.expenseRepository.save(expense, items);
    this.eventsService?.emitToOwners(tenantId, SOCKET_EVENTS.EXPENSE_CREATED, saved);
    return saved;
  }
}
