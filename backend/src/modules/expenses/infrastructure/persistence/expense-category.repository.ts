import { Injectable } from '@nestjs/common';
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
