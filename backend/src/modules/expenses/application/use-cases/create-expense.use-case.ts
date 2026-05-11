import { BadRequestException, Inject, Injectable, Optional } from '@nestjs/common';
import { Expense } from '../../domain/entities/expense.entity';
import { EXPENSE_REPOSITORY_PORT, ExpenseRepositoryPort, NewExpenseItemInput } from '../../domain/ports/expense-repository.port';
import { EXPENSE_CATEGORY_REPOSITORY_PORT, ExpenseCategoryRepositoryPort } from '../../domain/ports/expense-category-repository.port';
import { BranchRepositoryPort } from '../../../branch/domain/ports/branch-repository.port';
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

    @Inject('BranchRepositoryPort')
    private readonly branchRepository: BranchRepositoryPort,

    @Inject('CashSessionRepositoryPort')
    private readonly cashSessionRepository: CashSessionRepositoryPort,

    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(tenantId: string, branchId: string, userId: string, dto: CreateExpenseDto): Promise<Expense> {
    const branch = await this.branchRepository.findById(branchId, tenantId);
    if (!branch) throw new BadRequestException(`Sucursal ${branchId} no encontrada`);

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
        categoryName: i.categoryId ? (categoryMap.get(i.categoryId) ?? null) : null,
        name:         i.name,
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
      createdBy:     userId,
      cashSessionId: activeSession?.id ?? null,
      items:         [],
    });

    const saved = await this.expenseRepository.save(expense, items);
    this.eventsService?.emitToTenant(tenantId, 'expense.created', saved);
    return saved;
  }
}
