import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BOLIVIA_OFFSET } from '@pos/shared';
import { toBoliviaDateString } from '../../../../common/utils/timezone.util';
import {
  EXPENSE_CATEGORY_REPOSITORY_PORT,
  ExpenseCategoryRepositoryPort,
} from '../../domain/ports/expense-category-repository.port';
import {
  EXPENSE_CONCEPT_REPOSITORY_PORT,
  ExpenseConceptRepositoryPort,
} from '../../domain/ports/expense-concept-repository.port';
import { NewExpenseItemInput } from '../../domain/ports/expense-repository.port';
import { ExpenseItemDto, MAX_EXPENSE_AMOUNT } from '../dto/expense-fields.dto';

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface BuiltExpenseItems {
  items: NewExpenseItemInput[];
  amount: number;
  /** Categoría del primer ítem: es la que se guarda en `Expense.category` (lectura rápida y legacy). */
  mainCategory: string | null;
}

/**
 * Fecha de un gasto. El formulario manda solo el día: si es el mismo día que ya tenía (o hoy, al
 * registrar), se conserva la hora real; si es otro día, se guarda a mediodía para que ningún
 * corrimiento de zona lo mueva de día. Antes se guardaba siempre a mediodía y la lista mostraba
 * "12:00" en todos los gastos.
 */
export function resolveExpenseDate(day: string | undefined, current: Date): Date {
  if (!day || day === toBoliviaDateString(current)) return current;
  return new Date(`${day}T12:00:00${BOLIVIA_OFFSET}`);
}

/** Arma los ítems de un gasto (registrar y editar comparten esto). */
@Injectable()
export class ExpenseItemsService {
  constructor(
    @Inject(EXPENSE_CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepo: ExpenseCategoryRepositoryPort,
    @Inject(EXPENSE_CONCEPT_REPOSITORY_PORT)
    private readonly conceptRepo: ExpenseConceptRepositoryPort,
  ) {}

  /**
   * Resuelve el nombre de cada categoría y valida que categorías y gastos de la lista sean del
   * negocio: antes un id ajeno se guardaba tal cual y el ítem quedaba ligado a otro negocio.
   * Una categoría o un gasto eliminados sí valen: un gasto viejo puede seguir apuntándoles.
   */
  async build(tenantId: string, dtoItems: ExpenseItemDto[]): Promise<BuiltExpenseItems> {
    const categoryNames = new Map<string, string>();
    for (const id of new Set(dtoItems.map((i) => i.categoryId).filter((id): id is string => !!id))) {
      const category = await this.categoryRepo.findById(id, tenantId);
      if (!category) throw new NotFoundException('Categoría no encontrada');
      categoryNames.set(id, category.name);
    }
    for (const id of new Set(dtoItems.map((i) => i.conceptId).filter((id): id is string => !!id))) {
      if (!(await this.conceptRepo.findById(id, tenantId))) {
        throw new NotFoundException('Gasto predefinido no encontrado');
      }
    }

    const items: NewExpenseItemInput[] = dtoItems.map((i) => ({
      categoryId:   i.categoryId ?? null,
      conceptId:    i.conceptId ?? null,
      categoryName: i.categoryId ? categoryNames.get(i.categoryId) ?? null : null,
      name:         i.name.trim(),
      unit:         i.unit?.trim() || null,
      quantity:     i.quantity,
      unitPrice:    i.unitPrice,
      totalPrice:   round2(i.quantity * i.unitPrice),
    }));

    const amount = round2(items.reduce((sum, i) => sum + i.totalPrice, 0));
    if (amount > MAX_EXPENSE_AMOUNT) {
      throw new BadRequestException('El monto del gasto es demasiado grande');
    }
    if (items.some((i) => !i.name)) {
      throw new BadRequestException('Cada gasto necesita un nombre');
    }
    return { items, amount, mainCategory: items[0]?.categoryName ?? null };
  }
}
