import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { EXPENSE_REPOSITORY_PORT, ExpenseRepositoryPort, NewExpenseItemInput } from '../../domain/ports/expense-repository.port';
import { EXPENSE_CATEGORY_REPOSITORY_PORT, ExpenseCategoryRepositoryPort } from '../../domain/ports/expense-category-repository.port';
import { EventsService } from '../../../events/events.service';
import { UpdateExpenseDto } from '../dto/update-expense.dto';
import { Expense } from '../../domain/entities/expense.entity';

@Injectable()
export class UpdateExpenseUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_PORT)
    private readonly expenseRepository: ExpenseRepositoryPort,

    @Inject(EXPENSE_CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepository: ExpenseCategoryRepositoryPort,

    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(id: string, tenantId: string, dto: UpdateExpenseDto): Promise<Expense> {
    const existing = await this.expenseRepository.findById(id, tenantId);
    if (!existing) throw new NotFoundException('Gasto no encontrado');

    const categoryIds = [...new Set(dto.items.map((i) => i.categoryId).filter(Boolean) as string[])];
    const categoryMap = new Map<string, string>();
    for (const catId of categoryIds) {
      const cat = await this.categoryRepository.findById(catId, tenantId);
      if (cat) categoryMap.set(catId, cat.name);
    }

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

    const totalAmount = Math.round(items.reduce((s, i) => s + i.totalPrice, 0) * 100) / 100;
    const firstCategoryName = items[0]?.categoryName ?? existing.category;

    const saved = await this.expenseRepository.update(id, tenantId, {
      category:    firstCategoryName,
      amount:      totalAmount,
      description: dto.description ?? null,
    }, items);

    this.eventsService?.emitToTenant(tenantId, 'expense.updated', saved);
    return saved;
  }
}
