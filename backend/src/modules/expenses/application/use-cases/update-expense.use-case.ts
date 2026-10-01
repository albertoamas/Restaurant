import { BadRequestException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { SOCKET_EVENTS } from '@pos/shared';
import { EXPENSE_REPOSITORY_PORT, ExpenseRepositoryPort } from '../../domain/ports/expense-repository.port';
import { EventsService } from '../../../events/events.service';
import { UpdateExpenseDto } from '../dto/update-expense.dto';
import { Expense } from '../../domain/entities/expense.entity';
import { ExpenseItemsService, resolveExpenseDate } from '../services/expense-items.service';

/** `undefined` conserva el valor; la cadena vacía lo borra. */
const keepOrClear = (value: string | undefined, current: string | null) =>
  value === undefined ? current : (value.trim() || null);

@Injectable()
export class UpdateExpenseUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_PORT)
    private readonly expenseRepository: ExpenseRepositoryPort,

    private readonly itemsService: ExpenseItemsService,

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

    const { items, amount, mainCategory } = await this.itemsService.build(tenantId, dto.items);

    const saved = await this.expenseRepository.update(id, tenantId, {
      category:       mainCategory ?? existing.category,
      amount,
      description:    keepOrClear(dto.description, existing.description),
      expenseDate:    resolveExpenseDate(dto.expenseDate, existing.expenseDate),
      paymentMethod:  dto.paymentMethod ?? existing.paymentMethod,
      supplierName:   keepOrClear(dto.supplierName, existing.supplierName),
      documentNumber: keepOrClear(dto.documentNumber, existing.documentNumber),
    }, items);

    this.eventsService?.emitToTenant(tenantId, SOCKET_EVENTS.EXPENSE_UPDATED, saved);
    return saved;
  }
}
