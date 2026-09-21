import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { ExpenseConceptDto, SOCKET_EVENTS } from '@pos/shared';
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

    const category = await this.categoryRepo.findById(dto.categoryId, tenantId);
    if (!category) throw new NotFoundException('Categoría no encontrada');

    const existing = await this.repo.findByName(tenantId, name);
    if (existing) {
      // El índice único (tenant, name) cubre también los desactivados: reactivar
      // en vez de fallar, para que borrar y volver a crear no quede bloqueado.
      if (existing.isActive) {
        throw new ConflictException(`Ya existe un gasto predefinido llamado "${name}"`);
      }
      // `undefined` = el caller no mandó el campo → se conserva el valor previo,
      // igual que ya hace `sortOrder` acá abajo y que `UpdateExpenseConceptUseCase`.
      // Sin esto, revivir un concepto sin mandar unidad/precio lo convertía en
      // silencio de "gasto por cantidad" a "gasto de monto libre".
      const revived = await this.repo.update(
        existing.withChanges({
          categoryId:       dto.categoryId,
          name,
          unit:             dto.unit === undefined ? undefined : (dto.unit.trim() || null),
          defaultUnitPrice: dto.defaultUnitPrice === undefined ? undefined : (dto.defaultUnitPrice ?? null),
          isActive:         true,
          sortOrder:        dto.sortOrder ?? existing.sortOrder,
        }),
      );
      const revivedDto = toExpenseConceptDto(revived, category.name);
      this.eventsService?.emitToTenant(tenantId, SOCKET_EVENTS.EXPENSE_CONCEPT_CREATED, revivedDto);
      return revivedDto;
    }

    const created = await this.repo.save(
      ExpenseConceptEntity.create({
        tenantId,
        categoryId:       dto.categoryId,
        name,
        unit:             dto.unit?.trim() || null,
        defaultUnitPrice: dto.defaultUnitPrice ?? null,
        sortOrder:        dto.sortOrder ?? 0,
      }),
    );
    const createdDto = toExpenseConceptDto(created, category.name);
    this.eventsService?.emitToTenant(tenantId, SOCKET_EVENTS.EXPENSE_CONCEPT_CREATED, createdDto);
    return createdDto;
  }
}
