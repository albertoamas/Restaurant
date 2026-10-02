import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, Optional } from '@nestjs/common';
import { EXPENSE_CATALOG_LIMITS, SOCKET_EVENTS } from '@pos/shared';
import { ExpenseCategoryEntity } from '../../domain/entities/expense-category.entity';
import { EXPENSE_CATEGORY_REPOSITORY_PORT, ExpenseCategoryRepositoryPort } from '../../domain/ports/expense-category-repository.port';
import { EventsService } from '../../../events/events.service';
import { CreateExpenseCategoryDto } from '../dto/create-expense-category.dto';

@Injectable()
export class CreateExpenseCategoryUseCase {
  constructor(
    @Inject(EXPENSE_CATEGORY_REPOSITORY_PORT)
    private readonly repo: ExpenseCategoryRepositoryPort,

    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(tenantId: string, dto: CreateExpenseCategoryDto): Promise<ExpenseCategoryEntity> {
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('El nombre de la categoría es obligatorio');

    const existing = await this.repo.findByName(tenantId, name);
    // Crear o reactivar suma una categoría activa: ambas respetan el tope.
    if (!existing?.isActive) await this.assertBelowLimit(tenantId);
    if (existing) {
      // Si hay una eliminada con ese nombre se reactiva (conserva su id y su historial) en
      // vez de crear otra.
      if (existing.isActive) {
        throw new ConflictException(`Ya existe una categoría con el nombre "${name}"`);
      }
      // `undefined` = el caller no mandó ícono → se conserva el que ya tenía (la UI
      // no tiene editor de íconos, perderlo acá sería irrecuperable). Cadena vacía
      // sí lo limpia. Mismo criterio que `UpdateExpenseCategoryUseCase`.
      const revived = await this.repo.update(
        existing.withChanges({
          name,
          icon:     dto.icon === undefined ? undefined : (dto.icon || null),
          isActive: true,
        }),
      );
      this.eventsService?.emitToTenant(tenantId, SOCKET_EVENTS.EXPENSE_CATEGORY_CREATED, revived);
      return revived;
    }

    const category = ExpenseCategoryEntity.create({
      tenantId,
      name,
      icon:          dto.icon ?? null,
      trackQuantity: false,
      sortOrder:     0,
    });
    const created = await this.repo.save(category);
    this.eventsService?.emitToTenant(tenantId, SOCKET_EVENTS.EXPENSE_CATEGORY_CREATED, created);
    return created;
  }

  private async assertBelowLimit(tenantId: string): Promise<void> {
    const active = await this.repo.findAll(tenantId);
    if (active.length >= EXPENSE_CATALOG_LIMITS.categories) {
      throw new ForbiddenException(
        `Llegaste al máximo de ${EXPENSE_CATALOG_LIMITS.categories} categorías de gasto. Elimina las que ya no uses para crear otra.`,
      );
    }
  }
}
