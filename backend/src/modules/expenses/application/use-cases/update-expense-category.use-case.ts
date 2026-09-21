import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { SOCKET_EVENTS } from '@pos/shared';
import { ExpenseCategoryEntity } from '../../domain/entities/expense-category.entity';
import {
  EXPENSE_CATEGORY_REPOSITORY_PORT,
  ExpenseCategoryRepositoryPort,
} from '../../domain/ports/expense-category-repository.port';
import { EventsService } from '../../../events/events.service';
import { UpdateExpenseCategoryDto } from '../dto/update-expense-category.dto';

@Injectable()
export class UpdateExpenseCategoryUseCase {
  constructor(
    @Inject(EXPENSE_CATEGORY_REPOSITORY_PORT)
    private readonly repo: ExpenseCategoryRepositoryPort,

    @Optional() private readonly eventsService?: EventsService,
  ) {}

  async execute(id: string, tenantId: string, dto: UpdateExpenseCategoryDto): Promise<ExpenseCategoryEntity> {
    const category = await this.repo.findById(id, tenantId);
    if (!category) throw new NotFoundException('Categoría no encontrada');

    let name: string | undefined;
    if (dto.name !== undefined) {
      name = dto.name.trim();
      if (!name) throw new BadRequestException('El nombre de la categoría es obligatorio');
      const clash = await this.repo.findByName(tenantId, name);
      if (clash && clash.id !== id) {
        throw new ConflictException(`Ya existe una categoría con el nombre "${name}"`);
      }
    }

    const updated = await this.repo.update(
      category.withChanges({
        name,
        icon: dto.icon === undefined ? undefined : (dto.icon || null),
      }),
    );
    this.eventsService?.emitToTenant(tenantId, SOCKET_EVENTS.EXPENSE_CATEGORY_UPDATED, updated);
    return updated;
  }
}
