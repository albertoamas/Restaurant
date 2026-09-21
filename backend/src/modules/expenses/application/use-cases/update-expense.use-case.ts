import { BadRequestException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { SOCKET_EVENTS } from '@pos/shared';
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
    // El borrado es lógico: sin este chequeo la edición de un gasto anulado
    // respondía 200 y escribía cambios que ningún reporte volvería a mostrar.
    if (existing.status === 'VOIDED') {
      throw new BadRequestException('No se puede editar un gasto anulado');
    }

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
        conceptId:    i.conceptId ?? null,
        categoryName: i.categoryId ? (categoryMap.get(i.categoryId) ?? null) : null,
        name:         i.name,
        unit:         i.unit?.trim() || null,
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
      expenseDate: dto.expenseDate ? new Date(`${dto.expenseDate}T12:00:00-04:00`) : existing.expenseDate,
      paymentMethod: dto.paymentMethod ?? existing.paymentMethod,
      supplierName: dto.supplierName === undefined ? existing.supplierName : (dto.supplierName.trim() || null),
      documentNumber: dto.documentNumber === undefined ? existing.documentNumber : (dto.documentNumber.trim() || null),
    }, items);

    this.eventsService?.emitToTenant(tenantId, SOCKET_EVENTS.EXPENSE_UPDATED, saved);
    return saved;
  }
}
