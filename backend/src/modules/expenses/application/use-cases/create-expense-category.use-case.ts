import { BadRequestException, ConflictException, Inject, Injectable, Optional } from '@nestjs/common';
import { SOCKET_EVENTS } from '@pos/shared';
import { ExpenseCategoryEntity } from '../../domain/entities/expense-category.entity';
import { EXPENSE_CATEGORY_REPOSITORY_PORT, ExpenseCategoryRepositoryPort } from '../../domain/ports/expense-category-repository.port';
import { EventsService } from '../../../events/events.service';
import { CreateExpenseCategoryDto } from '../dto/create-expense-category.dto';

const DEFAULT_CATEGORIES: { name: string; icon: string; trackQuantity: boolean; sortOrder: number }[] = [
  { name: 'Insumos',    icon: '🧂', trackQuantity: true,  sortOrder: 10 },
  { name: 'Personal',   icon: '👤', trackQuantity: false, sortOrder: 20 },
  { name: 'Servicios',  icon: '💡', trackQuantity: false, sortOrder: 30 },
  { name: 'Transporte', icon: '🚗', trackQuantity: false, sortOrder: 40 },
  { name: 'Otro',       icon: '📋', trackQuantity: false, sortOrder: 99 },
];

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
    if (existing) {
      // El índice único (tenant, name) también cubre las desactivadas: se
      // reactiva en vez de fallar, para que borrar y volver a crear funcione.
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

  /**
   * Siembra las categorías base la primera vez. Alta masiva idempotente: si dos
   * requests del mismo tenant entran a la vez, el segundo ignora los duplicados
   * en vez de chocar contra el único (tenant, name).
   */
  async seedDefaults(tenantId: string): Promise<ExpenseCategoryEntity[]> {
    await this.repo.saveMany(
      DEFAULT_CATEGORIES.map((def) => ExpenseCategoryEntity.create({
        tenantId,
        name:          def.name,
        icon:          def.icon,
        trackQuantity: def.trackQuantity,
        sortOrder:     def.sortOrder,
      })),
    );
    // Relectura: con `skipDuplicates` las filas que quedaron pueden ser las del
    // request que ganó la carrera, con otros ids que los recién generados.
    return this.repo.findAll(tenantId);
  }
}
