import { Inject, Injectable, Optional } from '@nestjs/common';
import { SOCKET_EVENTS } from '@pos/shared';
import { Expense } from '../../domain/entities/expense.entity';
import { EXPENSE_REPOSITORY_PORT, ExpenseRepositoryPort, NewExpenseItemInput } from '../../domain/ports/expense-repository.port';
import { EXPENSE_CATEGORY_REPOSITORY_PORT, ExpenseCategoryRepositoryPort } from '../../domain/ports/expense-category-repository.port';
import { BranchAccessService } from '../../../branch/application/services/branch-access.service';
import { CashSessionRepositoryPort } from '../../../cash-session/domain/ports/cash-session-repository.port';
import { CreateExpenseDto } from '../dto/create-expense.dto';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class CreateExpenseUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_PORT)
    private readonly expenseRepository: ExpenseRepositoryPort,

    @Inject(EXPENSE_CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepository: ExpenseCategoryRepositoryPort,

    private readonly branchAccess: BranchAccessService,

    @Inject('CashSessionRepositoryPort')
    private readonly cashSessionRepository: CashSessionRepositoryPort,

    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(tenantId: string, branchId: string, userId: string, dto: CreateExpenseDto): Promise<Expense> {
    await this.branchAccess.assertUsable(branchId, tenantId);

    // Resolve category names for all items that have a categoryId.
    const categoryIds = [...new Set(dto.items.map((i) => i.categoryId).filter(Boolean) as string[])];
    const categoryMap = new Map<string, string>();
    for (const catId of categoryIds) {
      const cat = await this.categoryRepository.findById(catId, tenantId);
      if (cat) categoryMap.set(catId, cat.name);
    }

    // Build items with computed totalPrice and resolved category name.
    const items: NewExpenseItemInput[] = dto.items.map((i) => {
      const totalPrice = Math.round(i.quantity * i.unitPrice * 100) / 100;
      return {
        categoryId:   i.categoryId ?? null,
        conceptId:    i.conceptId ?? null,
        categoryName: i.categoryId ? (categoryMap.get(i.categoryId) ?? null) : null,
        name:         i.name,
        unit:         i.unit?.trim() || null,
        quantity:     i.quantity,
        unitPrice:    i.unitPrice,
        totalPrice,
      };
    });

    const totalAmount = items.reduce((sum, i) => sum + i.totalPrice, 0);
    const firstCategoryName = items[0]?.categoryName ?? 'OTHER';

    const activeSession = await this.cashSessionRepository.findOpenByBranch(tenantId, branchId);

    const expense = Expense.create({
      tenantId,
      branchId,
      category:      firstCategoryName,
      amount:        Math.round(totalAmount * 100) / 100,
      description:   dto.description ?? null,
      expenseDate:   dto.expenseDate ? new Date(`${dto.expenseDate}T12:00:00-04:00`) : new Date(),
      paymentMethod: dto.paymentMethod ?? null,
      supplierName:  dto.supplierName?.trim() || null,
      documentNumber: dto.documentNumber?.trim() || null,
      createdBy:     userId,
      cashSessionId: activeSession?.id ?? null,
      items:         [],
    });

    const saved = await this.expenseRepository.save(expense, items);
    this.eventsService?.emitToTenant(tenantId, SOCKET_EVENTS.EXPENSE_CREATED, saved);
    return saved;
  }
}
