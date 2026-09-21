import { Injectable, NotFoundException } from '@nestjs/common';
import { ExpenseCategory as PrismaExpenseCategory } from '@prisma/client';
import { ExpenseCategoryEntity } from '../../domain/entities/expense-category.entity';
import { ExpenseCategoryRepositoryPort } from '../../domain/ports/expense-category-repository.port';
import { PrismaService } from '../../../prisma/prisma.service';

function toDomain(row: PrismaExpenseCategory): ExpenseCategoryEntity {
  return ExpenseCategoryEntity.reconstitute({
    id:            row.id,
    tenantId:      row.tenantId,
    name:          row.name,
    icon:          row.icon ?? null,
    isActive:      row.isActive,
    trackQuantity: row.trackQuantity,
    sortOrder:     row.sortOrder,
    createdAt:     row.createdAt,
  });
}

@Injectable()
export class ExpenseCategoryRepository implements ExpenseCategoryRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(category: ExpenseCategoryEntity): Promise<ExpenseCategoryEntity> {
    const row = await this.prisma.expenseCategory.create({
      data: {
        id:            category.id,
        tenantId:      category.tenantId,
        name:          category.name,
        icon:          category.icon,
        isActive:      category.isActive,
        trackQuantity: category.trackQuantity,
        sortOrder:     category.sortOrder,
        createdAt:     category.createdAt,
      },
    });
    return toDomain(row);
  }

  async saveMany(categories: ExpenseCategoryEntity[]): Promise<void> {
    if (categories.length === 0) return;
    await this.prisma.expenseCategory.createMany({
      data: categories.map((c) => ({
        id:            c.id,
        tenantId:      c.tenantId,
        name:          c.name,
        icon:          c.icon,
        isActive:      c.isActive,
        trackQuantity: c.trackQuantity,
        sortOrder:     c.sortOrder,
        createdAt:     c.createdAt,
      })),
      skipDuplicates: true,
    });
  }

  async update(category: ExpenseCategoryEntity): Promise<ExpenseCategoryEntity> {
    // `updateMany` + relectura en vez de `update`: Prisma exige un `where` único
    // y `(id, tenantId)` no tiene índice compuesto, así que `update` obligaría a
    // filtrar solo por id y dejaría la fila de otro tenant al alcance.
    const { count } = await this.prisma.expenseCategory.updateMany({
      where: { id: category.id, tenantId: category.tenantId },
      data: {
        name:      category.name,
        icon:      category.icon,
        isActive:  category.isActive,
        sortOrder: category.sortOrder,
      },
    });
    if (count === 0) {
      throw new NotFoundException('Categoría no encontrada');
    }

    const row = await this.prisma.expenseCategory.findFirstOrThrow({
      where: { id: category.id, tenantId: category.tenantId },
    });
    return toDomain(row);
  }

  async findByName(tenantId: string, name: string): Promise<ExpenseCategoryEntity | null> {
    const row = await this.prisma.expenseCategory.findFirst({
      where: { tenantId, name: { equals: name, mode: 'insensitive' } },
    });
    return row ? toDomain(row) : null;
  }

  async findAll(tenantId: string): Promise<ExpenseCategoryEntity[]> {
    const rows = await this.prisma.expenseCategory.findMany({
      where:   { tenantId, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map(toDomain);
  }

  async findById(id: string, tenantId: string): Promise<ExpenseCategoryEntity | null> {
    const row = await this.prisma.expenseCategory.findFirst({ where: { id, tenantId } });
    return row ? toDomain(row) : null;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.expenseCategory.updateMany({
      where: { id, tenantId },
      data:  { isActive: false },
    });
  }
}
