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

  /**
   * Baja lógica de la categoría y de sus gastos predefinidos. Antes los gastos quedaban activos
   * pero ocultos (la lista filtra por categoría activa) y su nombre seguía ocupado: no se podía
   * volver a crear un gasto con ese nombre ("Ya existe un gasto predefinido llamado...").
   */
  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.expenseCategory.updateMany({
        where: { id, tenantId },
        data:  { isActive: false },
      }),
      this.prisma.expenseConcept.updateMany({
        where: { categoryId: id, tenantId, isActive: true },
        data:  { isActive: false },
      }),
    ]);
  }
}
