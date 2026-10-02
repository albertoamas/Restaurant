import { BadRequestException, ForbiddenException, Inject, Injectable, Optional } from '@nestjs/common';
import { EXPENSE_CATALOG_LIMITS, SOCKET_EVENTS, SUGGESTED_EXPENSE_CATALOG } from '@pos/shared';
import { EventsService } from '../../../events/events.service';
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
import { toExpenseConceptDto } from './expense-concept.mapper';

export interface LoadSuggestedCatalogResult {
  categories: number;
  concepts: number;
}

/**
 * Carga las categorías del catálogo sugerido que el dueño eligió, con sus gastos. Reemplaza la
 * siembra automática que llenaba la lista de un negocio nuevo sin preguntar.
 *
 * Lo que ya existe no se duplica: una categoría o un gasto activo con el mismo nombre se reutiliza
 * y uno eliminado se reactiva (el índice único (tenant, name) cubre también los inactivos).
 */
@Injectable()
export class LoadSuggestedExpenseCatalogUseCase {
  constructor(
    @Inject(EXPENSE_CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepo: ExpenseCategoryRepositoryPort,
    @Inject(EXPENSE_CONCEPT_REPOSITORY_PORT)
    private readonly conceptRepo: ExpenseConceptRepositoryPort,
    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(tenantId: string, names: string[]): Promise<LoadSuggestedCatalogResult> {
    const wanted = new Set(names.map((n) => n.trim().toLowerCase()));
    const groups = SUGGESTED_EXPENSE_CATALOG.filter((g) => wanted.has(g.name.toLowerCase()));
    if (wanted.size === 0) {
      throw new BadRequestException('Elige al menos una categoría del catálogo sugerido');
    }
    if (groups.length !== wanted.size) {
      throw new BadRequestException('Alguna de las categorías elegidas no está en el catálogo sugerido');
    }

    // Plan completo antes de escribir: si algo supera los topes, no se crea nada a medias.
    const categoryPlan = await Promise.all(groups.map(async (group) => ({
      group,
      existing: await this.categoryRepo.findByName(tenantId, group.name),
    })));
    const conceptPlan = await Promise.all(groups.flatMap((group) => group.concepts.map(async ([name, unit]) => ({
      group, name, unit,
      existing: await this.conceptRepo.findByName(tenantId, name),
    }))));

    const newCategories = categoryPlan.filter((p) => !p.existing?.isActive).length;
    const newConcepts   = conceptPlan.filter((p) => !p.existing?.isActive).length;

    const [activeCategories, activeConcepts] = await Promise.all([
      this.categoryRepo.findAll(tenantId),
      this.conceptRepo.findAll(tenantId),
    ]);
    if (activeCategories.length + newCategories > EXPENSE_CATALOG_LIMITS.categories) {
      throw new ForbiddenException(
        `No entran: superarías el máximo de ${EXPENSE_CATALOG_LIMITS.categories} categorías de gasto. Elige menos o elimina las que no uses.`,
      );
    }
    if (activeConcepts.length + newConcepts > EXPENSE_CATALOG_LIMITS.concepts) {
      throw new ForbiddenException(
        `No entran: superarías el máximo de ${EXPENSE_CATALOG_LIMITS.concepts} gastos en tu lista. Elige menos o quita los que no uses.`,
      );
    }

    const lastOrder = activeCategories.reduce((max, c) => Math.max(max, c.sortOrder), 0);
    const categoryByGroup = new Map<string, ExpenseCategoryEntity>();
    for (const [i, { group, existing }] of categoryPlan.entries()) {
      let category: ExpenseCategoryEntity;
      if (existing?.isActive) {
        category = existing;
      } else if (existing) {
        category = await this.categoryRepo.update(existing.withChanges({ isActive: true }));
        this.eventsService?.emitToOwners(tenantId, SOCKET_EVENTS.EXPENSE_CATEGORY_CREATED, category);
      } else {
        category = await this.categoryRepo.save(ExpenseCategoryEntity.create({
          tenantId,
          name:          group.name,
          icon:          group.icon,
          trackQuantity: group.trackQuantity,
          sortOrder:     lastOrder + (i + 1) * 10,
        }));
        this.eventsService?.emitToOwners(tenantId, SOCKET_EVENTS.EXPENSE_CATEGORY_CREATED, category);
      }
      categoryByGroup.set(group.name, category);
    }

    let sortOrder = activeConcepts.reduce((max, c) => Math.max(max, c.sortOrder), 0);
    for (const { group, name, unit, existing } of conceptPlan) {
      if (existing?.isActive) continue;
      const category = categoryByGroup.get(group.name)!;
      sortOrder += 10;
      const concept = existing
        ? await this.conceptRepo.update(existing.withChanges({ categoryId: category.id, isActive: true, sortOrder }))
        : await this.conceptRepo.save(ExpenseConceptEntity.create({
            tenantId, categoryId: category.id, name, unit, defaultUnitPrice: null, sortOrder,
          }));
      this.eventsService?.emitToOwners(tenantId, SOCKET_EVENTS.EXPENSE_CONCEPT_CREATED, toExpenseConceptDto(concept, category.name));
    }

    return { categories: newCategories, concepts: newConcepts };
  }
}
