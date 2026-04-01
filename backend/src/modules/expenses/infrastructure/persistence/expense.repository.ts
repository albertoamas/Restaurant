import { Injectable } from '@nestjs/common';
import { ExpenseCategory, ExpenseSummaryDto } from '@pos/shared';
import { Expense as PrismaExpense } from '@prisma/client';
import { Expense } from '../../domain/entities/expense.entity';
import { ExpenseRepositoryPort } from '../../domain/ports/expense-repository.port';
import { PrismaService } from '../../../prisma/prisma.service';

function toDomain(row: PrismaExpense): Expense {
  return Expense.reconstitute({
    id: row.id,
    tenantId: row.tenantId,
    branchId: row.branchId,
    category: row.category as ExpenseCategory,
    amount: Number(row.amount),
    description: row.description ?? null,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
  });
}

@Injectable()
export class ExpenseRepository implements ExpenseRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(expense: Expense): Promise<Expense> {
    const row = await this.prisma.expense.create({
      data: {
        id: expense.id,
        tenantId: expense.tenantId,
        branchId: expense.branchId,
        category: expense.category,
        amount: expense.amount,
        description: expense.description,
        createdBy: expense.createdBy,
        createdAt: expense.createdAt,
      },
    });
    return toDomain(row);
  }

  async findAll(
    tenantId: string,
    branchId: string | null,
    from: Date,
    to: Date,
    category?: ExpenseCategory,
  ): Promise<Expense[]> {
    const rows = await this.prisma.expense.findMany({
      where: {
        tenantId,
        ...(branchId ? { branchId } : {}),
        ...(category ? { category } : {}),
        createdAt: { gte: from, lte: to },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toDomain);
  }

  async getSummary(
    tenantId: string,
    branchId: string | null,
    from: Date,
    to: Date,
  ): Promise<ExpenseSummaryDto> {
    type RawRow = { category: string; total: unknown };

    const rows: RawRow[] = branchId
      ? await this.prisma.$queryRaw`
          SELECT category, SUM(amount) AS total
          FROM expenses
          WHERE tenant_id = ${tenantId}
            AND branch_id = ${branchId}
            AND created_at BETWEEN ${from} AND ${to}
          GROUP BY category`
      : await this.prisma.$queryRaw`
          SELECT category, SUM(amount) AS total
          FROM expenses
          WHERE tenant_id = ${tenantId}
            AND created_at BETWEEN ${from} AND ${to}
          GROUP BY category`;

    const byCategory: Partial<Record<ExpenseCategory, number>> = {};
    let total = 0;
    for (const row of rows) {
      const amount = Number(row.total);
      byCategory[row.category as ExpenseCategory] = amount;
      total += amount;
    }
    return { total, byCategory };
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.expense.deleteMany({ where: { id, tenantId } });
  }
}
