import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ExpenseConceptDto } from '@pos/shared';
import {
  EXPENSE_CATEGORY_REPOSITORY_PORT,
  ExpenseCategoryRepositoryPort,
} from '../../domain/ports/expense-category-repository.port';
import {
  EXPENSE_CONCEPT_REPOSITORY_PORT,
  ExpenseConceptRepositoryPort,
} from '../../domain/ports/expense-concept-repository.port';
import { UpdateExpenseConceptDto } from '../dto/update-expense-concept.dto';
import { toExpenseConceptDto } from './expense-concept.mapper';

@Injectable()
export class UpdateExpenseConceptUseCase {
  constructor(
    @Inject(EXPENSE_CONCEPT_REPOSITORY_PORT)
    private readonly repo: ExpenseConceptRepositoryPort,
    @Inject(EXPENSE_CATEGORY_REPOSITORY_PORT)
    private readonly categoryRepo: ExpenseCategoryRepositoryPort,
  ) {}

  async execute(id: string, tenantId: string, dto: UpdateExpenseConceptDto): Promise<ExpenseConceptDto> {
    const concept = await this.repo.findById(id, tenantId);
    if (!concept) throw new NotFoundException('Gasto predefinido no encontrado');

    const category = await this.categoryRepo.findById(dto.categoryId ?? concept.categoryId, tenantId);
    if (!category) throw new NotFoundException('Categoría no encontrada');

    let name: string | undefined;
    if (dto.name !== undefined) {
      name = dto.name.trim();
      if (!name) throw new BadRequestException('El nombre del gasto predefinido es obligatorio');
      const clash = await this.repo.findByName(tenantId, name);
      if (clash && clash.id !== id) {
        throw new ConflictException(`Ya existe un gasto predefinido llamado "${name}"`);
      }
    }

    const updated = await this.repo.update(
      concept.withChanges({
        categoryId:       dto.categoryId,
        name,
        unit:             dto.unit === undefined ? undefined : (dto.unit?.trim() || null),
        defaultUnitPrice: dto.defaultUnitPrice === undefined ? undefined : (dto.defaultUnitPrice ?? null),
        isActive:         dto.isActive,
        sortOrder:        dto.sortOrder,
      }),
    );
    return toExpenseConceptDto(updated, category.name);
  }
}
