import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { EXPENSE_CATALOG_LIMITS, ExpenseConceptDto, SOCKET_EVENTS } from '@pos/shared';
import { EventsService } from '../../../events/events.service';
import { ExpenseConceptEntity } from '../../domain/entities/expense-concept.entity';
import {
  EXPENSE_CATEGORY_REPOSITORY_PORT,
  ExpenseCategoryRepositoryPort,
} from '../../domain/ports/expense-category-repository.port';
import {
  EXPENSE_CONCEPT_REPOSITORY_PORT,
  ExpenseConceptRepositoryPort,
} from '../../domain/ports/expense-concept-repository.port';
import { CreateExpenseConceptDto } from '../dto/create-expense-concept.dto';
import { toExpenseConceptDto } from './expense-concept.mapper';

@Injectable()
export class CreateExpenseConceptUseCase {
  constructor(
    @Inject(EXPENSE_CONCEPT_REPOSITORY_PORT)
    private readonly repo: ExpenseConceptRepositoryPort,
    @Inject(EXPENSE_CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepo: ExpenseCategoryRepositoryPort,

    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(tenantId: string, dto: CreateExpenseConceptDto): Promise<ExpenseConceptDto> {
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('El nombre del gasto predefinido es obligatorio');

    // Activa: en una categoría eliminada el gasto no aparecería en la lista.
    const category = await this.categoryRepo.findById(dto.categoryId, tenantId);
    if (!category?.isActive) throw new NotFoundException('Categoría no encontrada');

    const found = await this.repo.findByName(tenantId, name);
    // Un gasto activo en una categoría eliminada no se ve en la lista: se trata como eliminado
    // y se reactiva en la categoría elegida, en vez de responder que ya existe.
    const existing = found?.isActive && !(await this.categoryRepo.findById(found.categoryId, tenantId))?.isActive
      ? found.withChanges({ isActive: false })
      : found;
    // Crear o reactivar suma un gasto activo a la lista: ambos respetan el tope.
    if (!existing?.isActive) {
      const active = await this.repo.findAll(tenantId);
      if (active.length >= EXPENSE_CATALOG_LIMITS.concepts) {
        throw new ForbiddenException(
          `Llegaste al máximo de ${EXPENSE_CATALOG_LIMITS.concepts} gastos en tu lista. Quita los que ya no uses para agregar otros.`,
        );
      }
    }
    if (existing) {
      // Si hay uno eliminado con ese nombre se reactiva (conserva su id y su vínculo con los
      // gastos registrados) en vez de crear otro.
      if (existing.isActive) {
        throw new ConflictException(`Ya existe un gasto predefinido llamado "${name}"`);
      }
      // `undefined` = el caller no mandó el campo → se conserva el valor previo,
      // como hace `UpdateExpenseConceptUseCase`.
      // Sin esto, revivir un concepto sin mandar unidad/precio lo convertía en
      // silencio de "gasto por cantidad" a "gasto de monto libre".
      const revived = await this.repo.update(
        existing.withChanges({
          categoryId:       dto.categoryId,
          name,
          unit:             dto.unit === undefined ? undefined : (dto.unit.trim() || null),
          defaultUnitPrice: dto.defaultUnitPrice === undefined ? undefined : (dto.defaultUnitPrice ?? null),
          isActive:         true,
        }),
      );
      const revivedDto = toExpenseConceptDto(revived, category.name);
      this.eventsService?.emitToOwners(tenantId, SOCKET_EVENTS.EXPENSE_CONCEPT_CREATED, revivedDto);
      return revivedDto;
    }

    const created = await this.repo.save(
      ExpenseConceptEntity.create({
        tenantId,
        categoryId:       dto.categoryId,
        name,
        unit:             dto.unit?.trim() || null,
        defaultUnitPrice: dto.defaultUnitPrice ?? null,
        sortOrder:        0,
      }),
    );
    const createdDto = toExpenseConceptDto(created, category.name);
    this.eventsService?.emitToOwners(tenantId, SOCKET_EVENTS.EXPENSE_CONCEPT_CREATED, createdDto);
    return createdDto;
  }
}
