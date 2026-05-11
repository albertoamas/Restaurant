import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { ExpenseCategoryEntity } from '../../domain/entities/expense-category.entity';
import { EXPENSE_CATEGORY_REPOSITORY_PORT, ExpenseCategoryRepositoryPort } from '../../domain/ports/expense-category-repository.port';
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
  ) {}

  async execute(tenantId: string, dto: CreateExpenseCategoryDto): Promise<ExpenseCategoryEntity> {
    const existing = await this.repo.findAll(tenantId);
    const conflict = existing.find((c) => c.name.toLowerCase() === dto.name.trim().toLowerCase());
    if (conflict) throw new ConflictException(`Ya existe una categoría con el nombre "${dto.name}"`);

    const category = ExpenseCategoryEntity.create({
      tenantId,
      name:          dto.name.trim(),
      icon:          dto.icon ?? null,
      trackQuantity: false,
      sortOrder:     0,
    });
    return this.repo.save(category);
  }

  /** Seeds default categories for the tenant if none exist yet. */
  async seedDefaults(tenantId: string): Promise<ExpenseCategoryEntity[]> {
    const results: ExpenseCategoryEntity[] = [];
    for (const def of DEFAULT_CATEGORIES) {
      const cat = ExpenseCategoryEntity.create({ tenantId, name: def.name, icon: def.icon, trackQuantity: def.trackQuantity, sortOrder: def.sortOrder });
      results.push(await this.repo.save(cat));
    }
    return results;
  }
}
