import { Inject, Injectable } from '@nestjs/common';
import { ExpenseConceptDto } from '@pos/shared';
import { ExpenseCategoryEntity } from '../../domain/entities/expense-category.entity';
import { ExpenseConceptEntity } from '../../domain/entities/expense-concept.entity';
import {
  EXPENSE_CATEGORY_REPOSITORY_PORT,
  ExpenseCategoryRepositoryPort,
} from '../../domain/ports/expense-category-repository.port';
import {
  EXPENSE_CONCEPT_REPOSITORY_PORT,
  ExpenseConceptRepositoryPort,
} from '../../domain/ports/expense-concept-repository.port';
import { ListExpenseCategoriesUseCase } from './list-expense-categories.use-case';

/**
 * Catálogo inicial de gastos frecuentes, al estilo de la planilla Excel que
 * llevan los locales. El dueño puede editarlo después desde la UI.
 * Cada entrada: [categoría, ícono, seguimiento de cantidad, concepto, unidad].
 */
const DEFAULT_CATALOG: {
  category: string;
  icon: string;
  trackQuantity: boolean;
  concepts: [name: string, unit: string | null][];
}[] = [
  {
    category: 'Insumos', icon: '🧂', trackQuantity: true,
    concepts: [
      ['Carne', 'kg'], ['Pollo', 'kg'], ['Queso mozzarella', 'kg'], ['Papa', 'kg'],
      ['Tomate', 'kg'], ['Cebolla', 'kg'], ['Aceite', 'litro'], ['Pan', 'unidad'],
    ],
  },
  {
    category: 'Gaseosas', icon: '🥤', trackQuantity: true,
    concepts: [['Coca-Cola', 'unidad'], ['Sprite', 'unidad'], ['Agua mineral', 'unidad']],
  },
  {
    category: 'Refrescos', icon: '🧃', trackQuantity: true,
    concepts: [['Fruta o pulpa', 'kg'], ['Azúcar', 'kg']],
  },
  {
    category: 'Personal', icon: '👤', trackQuantity: false,
    concepts: [['Sueldos', 'mes'], ['Adelanto de personal', null]],
  },
  {
    category: 'Servicios', icon: '💡', trackQuantity: false,
    concepts: [['Electricidad', 'mes'], ['Agua', 'mes'], ['Gas', 'garrafa'], ['Internet', 'mes']],
  },
  {
    category: 'Administrativos', icon: '🧾', trackQuantity: false,
    concepts: [['Alquiler', 'mes'], ['Contabilidad', 'mes'], ['Software', 'mes']],
  },
  {
    category: 'Operativos', icon: '🧽', trackQuantity: false,
    concepts: [['Material de limpieza', null], ['Empaques', null], ['Publicidad', null]],
  },
  { category: 'Transporte',    icon: '🚗', trackQuantity: false, concepts: [['Transporte', 'viaje']] },
  { category: 'Mantenimiento', icon: '🔧', trackQuantity: false, concepts: [['Reparación de equipo', null]] },
  { category: 'Otro',          icon: '📋', trackQuantity: false, concepts: [['Otro gasto', null]] },
];

@Injectable()
export class ListExpenseConceptsUseCase {
  constructor(
    @Inject(EXPENSE_CONCEPT_REPOSITORY_PORT)
    private readonly repo: ExpenseConceptRepositoryPort,
    @Inject(EXPENSE_CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepo: ExpenseCategoryRepositoryPort,
    private readonly listCategories: ListExpenseCategoriesUseCase,
  ) {}

  async execute(tenantId: string): Promise<ExpenseConceptDto[]> {
    if ((await this.repo.count(tenantId)) === 0) {
      await this.seedDefaults(tenantId);
    }

    const [concepts, categories] = await Promise.all([
      this.repo.findAll(tenantId),
      this.categoryRepo.findAll(tenantId),
    ]);
    const categoryNames = new Map(categories.map((c) => [c.id, c.name]));

    return concepts.map((concept) => ({
      id:               concept.id,
      categoryId:       concept.categoryId,
      categoryName:     categoryNames.get(concept.categoryId) ?? '',
      name:             concept.name,
      unit:             concept.unit,
      defaultUnitPrice: concept.defaultUnitPrice,
      isActive:         concept.isActive,
    }));
  }

  /**
   * Siembra el catálogo por defecto. Crea también las categorías que falten:
   * un tenant existente solo tiene las 5 iniciales, y sin esto los conceptos
   * de las categorías nuevas se perderían en silencio.
   */
  private async seedDefaults(tenantId: string): Promise<void> {
    // Dispara el auto-seed de categorías por defecto si el tenant no tiene ninguna.
    await this.listCategories.execute(tenantId);
    const existing = await this.categoryRepo.findAll(tenantId);
    const byName = new Map(existing.map((c) => [c.name.toLowerCase(), c]));

    const concepts: ExpenseConceptEntity[] = [];
    let sortOrder = 0;

    for (const group of DEFAULT_CATALOG) {
      let category = byName.get(group.category.toLowerCase());
      if (!category) {
        category = await this.categoryRepo.save(
          ExpenseCategoryEntity.create({
            tenantId,
            name:          group.category,
            icon:          group.icon,
            trackQuantity: group.trackQuantity,
            sortOrder:     sortOrder,
          }),
        );
        byName.set(group.category.toLowerCase(), category);
      }

      for (const [name, unit] of group.concepts) {
        concepts.push(
          ExpenseConceptEntity.create({
            tenantId,
            categoryId:       category.id,
            name,
            unit,
            defaultUnitPrice: null,
            sortOrder:        (sortOrder += 10),
          }),
        );
      }
    }

    await this.repo.saveMany(concepts);
  }
}
