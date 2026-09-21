import { Inject, Injectable } from '@nestjs/common';
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

/**
 * Siembra el catálogo por defecto de gastos predefinidos la primera vez que un
 * tenant lo pide. Crea también las categorías que falten: un tenant viejo solo
 * tiene las 5 iniciales, y sin esto los conceptos de las categorías nuevas se
 * perderían en silencio.
 *
 * Es idempotente a propósito: dos requests simultáneos del mismo tenant (dos
 * pestañas, o dos paneles montando a la vez) pueden entrar los dos acá, así que
 * las altas masivas ignoran duplicados en vez de reventar contra el índice único.
 */
@Injectable()
export class EnsureDefaultExpenseConceptsUseCase {
  constructor(
    @Inject(EXPENSE_CONCEPT_REPOSITORY_PORT)
    private readonly repo: ExpenseConceptRepositoryPort,
    @Inject(EXPENSE_CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepo: ExpenseCategoryRepositoryPort,
    private readonly listCategories: ListExpenseCategoriesUseCase,
  ) {}

  async execute(tenantId: string): Promise<void> {
    // Dispara el auto-seed de categorías base si el tenant no tiene ninguna, y
    // devuelve la lista ya cargada — no hace falta volver a consultarla.
    const existing = await this.listCategories.execute(tenantId);
    let byName = indexByName(existing);

    const missing = DEFAULT_CATALOG
      .filter((group) => !byName.has(group.category.toLowerCase()))
      .map((group, i) => ExpenseCategoryEntity.create({
        tenantId,
        name:          group.category,
        icon:          group.icon,
        trackQuantity: group.trackQuantity,
        sortOrder:     i * 10,
      }));

    if (missing.length > 0) {
      await this.categoryRepo.saveMany(missing);
      // Relectura obligatoria: con `skipDuplicates`, la fila que quedó puede ser
      // la que insertó otro request en paralelo, con otro id que el que generamos.
      byName = indexByName(await this.categoryRepo.findAll(tenantId));
    }

    const concepts: ExpenseConceptEntity[] = [];
    let sortOrder = 0;

    for (const group of DEFAULT_CATALOG) {
      const category = byName.get(group.category.toLowerCase());
      if (!category) continue;

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

function indexByName(categories: ExpenseCategoryEntity[]): Map<string, ExpenseCategoryEntity> {
  return new Map(categories.map((c) => [c.name.toLowerCase(), c]));
}
