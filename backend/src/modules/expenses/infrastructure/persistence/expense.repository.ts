import { Injectable } from '@nestjs/common';
import { ExpenseSummaryDto } from '@pos/shared';
import { Expense as PrismaExpense, ExpenseItem as PrismaExpenseItem, ExpenseCategory as PrismaExpenseCategory } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Expense } from '../../domain/entities/expense.entity';
import { ExpensePatch, ExpenseRepositoryPort, NewExpenseItemInput } from '../../domain/ports/expense-repository.port';
import { PrismaService } from '../../../prisma/prisma.service';

type PrismaExpenseWithItems = PrismaExpense & {
  items: (PrismaExpenseItem & { category: PrismaExpenseCategory | null })[];
};

function toDomain(row: PrismaExpenseWithItems): Expense {
  return Expense.reconstitute({
    id:            row.id,
    tenantId:      row.tenantId,
    branchId:      row.branchId,
    category:      row.category,
    amount:        Number(row.amount),
    description:   row.description ?? null,
    createdBy:     row.createdBy,
    createdAt:     row.createdAt,
    cashSessionId: row.cashSessionId ?? null,
    items: row.items.map((item) => ({
      id:           item.id,
      expenseId:    item.expenseId,
      categoryId:   item.categoryId ?? null,
      categoryName: item.category?.name ?? null,
      name:         item.name,
      quantity:     Number(item.quantity),
      unitPrice:    Number(item.unitPrice),
      totalPrice:   Number(item.totalPrice),
    })),
  });
}

const ITEMS_INCLUDE = {
  items: {
    include: { category: true },
    orderBy: { createdAt: 'asc' as const },
  },
};

@Injectable()
export class ExpenseRepository implements ExpenseRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(expense: Expense, items: NewExpenseItemInput[]): Promise<Expense> {
    const row = await this.prisma.$transaction(async (tx) => {
      const created = await tx.expense.create({
        data: {
          id:            expense.id,
          tenantId:      expense.tenantId,
          branchId:      expense.branchId,
          category:      expense.category,
          amount:        expense.amount,
          description:   expense.description,
          createdBy:     expense.createdBy,
          createdAt:     expense.createdAt,
          cashSessionId: expense.cashSessionId ?? null,
        },
      });

      if (items.length > 0) {
        await tx.expenseItem.createMany({
          data: items.map((item) => ({
            id:         randomUUID(),
            expenseId:  created.id,
            categoryId: item.categoryId ?? null,
            name:       item.name,
            quantity:   item.quantity,
            unitPrice:  item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        });
      }

      return tx.expense.findFirstOrThrow({
        where:   { id: created.id },
        include: ITEMS_INCLUDE,
      });
    });

    return toDomain(row as PrismaExpenseWithItems);
  }

  async findById(id: string, tenantId: string): Promise<Expense | null> {
    const row = await this.prisma.expense.findFirst({
      where:   { id, tenantId },
      include: ITEMS_INCLUDE,
    });
    return row ? toDomain(row as PrismaExpenseWithItems) : null;
  }

  async update(
    id: string,
    tenantId: string,
    patch: ExpensePatch,
    items: NewExpenseItemInput[],
  ): Promise<Expense> {
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.expenseItem.deleteMany({ where: { expenseId: id } });

      if (items.length > 0) {
        await tx.expenseItem.createMany({
          data: items.map((item) => ({
            id:         randomUUID(),
            expenseId:  id,
            categoryId: item.categoryId ?? null,
            name:       item.name,
            quantity:   item.quantity,
            unitPrice:  item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        });
      }

      await tx.expense.updateMany({
        where: { id, tenantId },
        data:  { category: patch.category, amount: patch.amount, description: patch.description },
      });

      return tx.expense.findFirstOrThrow({
        where:   { id, tenantId },
        include: ITEMS_INCLUDE,
      });
    });

    return toDomain(row as PrismaExpenseWithItems);
  }

  async findAll(
    tenantId: string,
    branchId: string | null,
    from: Date,
    to: Date,
  ): Promise<Expense[]> {
    const rows = await this.prisma.expense.findMany({
      where: {
        tenantId,
        ...(branchId ? { branchId } : {}),
        createdAt: { gte: from, lte: to },
      },
      orderBy: { createdAt: 'desc' },
      include: ITEMS_INCLUDE,
    });
    return rows.map((r) => toDomain(r as PrismaExpenseWithItems));
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

    const byCategory: Record<string, number> = {};
    let total = 0;
    for (const row of rows) {
      const amount = Number(row.total);
      byCategory[row.category] = (byCategory[row.category] ?? 0) + amount;
      total += amount;
    }
    return { total, byCategory };
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.expense.deleteMany({ where: { id, tenantId } });
  }
}
