import { Injectable } from '@nestjs/common';
import { ExpenseSummaryDto } from '@pos/shared';
import { Expense as PrismaExpense, ExpenseItem as PrismaExpenseItem, ExpenseCategory as PrismaExpenseCategory, Prisma } from '@prisma/client';
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
    expenseDate:   row.expenseDate,
    status:        row.status as 'ACTIVE' | 'VOIDED',
    paymentMethod: row.paymentMethod as Expense['paymentMethod'],
    supplierName:  row.supplierName ?? null,
    documentNumber: row.documentNumber ?? null,
    voidedAt:      row.voidedAt ?? null,
    voidedBy:      row.voidedBy ?? null,
    voidReason:    row.voidReason ?? null,
    cashSessionId: row.cashSessionId ?? null,
    items: row.items.map((item) => ({
      id:           item.id,
      expenseId:    item.expenseId,
      categoryId:   item.categoryId ?? null,
      categoryName: item.category?.name ?? null,
      name:         item.name,
      unit:         item.unit ?? null,
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
          expenseDate:   expense.expenseDate,
          status:        expense.status,
          paymentMethod: expense.paymentMethod,
          supplierName:  expense.supplierName,
          documentNumber: expense.documentNumber,
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
            unit:       item.unit,
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
            unit:       item.unit,
            quantity:   item.quantity,
            unitPrice:  item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        });
      }

      await tx.expense.updateMany({
        where: { id, tenantId },
        data:  {
          category: patch.category,
          amount: patch.amount,
          description: patch.description,
          expenseDate: patch.expenseDate,
          paymentMethod: patch.paymentMethod,
          supplierName: patch.supplierName,
          documentNumber: patch.documentNumber,
        },
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
        expenseDate: { gte: from, lte: to },
        status: 'ACTIVE',
      },
      orderBy: [{ expenseDate: 'desc' }, { createdAt: 'desc' }],
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
    type DayRow = { day: Date; total: unknown };
    const branchFilter = branchId ? Prisma.sql`AND e.branch_id = ${branchId}` : Prisma.empty;

    const rows = await this.prisma.$queryRaw<RawRow[]>(Prisma.sql`
      SELECT category, SUM(total) AS total
      FROM (
        SELECT COALESCE(ec.name, e.category) AS category, SUM(ei.total_price) AS total
        FROM expenses e
        JOIN expense_items ei ON ei.expense_id = e.id
        LEFT JOIN expense_categories ec ON ec.id = ei.category_id
        WHERE e.tenant_id = ${tenantId}
          ${branchFilter}
          AND e.status = 'ACTIVE'
          AND e.expense_date BETWEEN ${from} AND ${to}
        GROUP BY COALESCE(ec.name, e.category)

        UNION ALL

        SELECT e.category AS category, SUM(e.amount) AS total
        FROM expenses e
        WHERE e.tenant_id = ${tenantId}
          ${branchFilter}
          AND e.status = 'ACTIVE'
          AND e.expense_date BETWEEN ${from} AND ${to}
          AND NOT EXISTS (SELECT 1 FROM expense_items ei WHERE ei.expense_id = e.id)
        GROUP BY e.category
      ) categorized
      GROUP BY category
    `);

    const dayRows = await this.prisma.$queryRaw<DayRow[]>(Prisma.sql`
      SELECT DATE_TRUNC('day', e.expense_date AT TIME ZONE 'America/La_Paz') AS day,
             SUM(e.amount) AS total
      FROM expenses e
      WHERE e.tenant_id = ${tenantId}
        ${branchFilter}
        AND e.status = 'ACTIVE'
        AND e.expense_date BETWEEN ${from} AND ${to}
      GROUP BY DATE_TRUNC('day', e.expense_date AT TIME ZONE 'America/La_Paz')
      ORDER BY day
    `);

    const transactionCount = await this.prisma.expense.count({
      where: {
        tenantId,
        ...(branchId ? { branchId } : {}),
        status: 'ACTIVE',
        expenseDate: { gte: from, lte: to },
      },
    });

    const byCategory: Record<string, number> = {};
    let total = 0;
    for (const row of rows) {
      const amount = Number(row.total);
      byCategory[row.category] = (byCategory[row.category] ?? 0) + amount;
      total += amount;
    }
    const byDay: Record<string, number> = {};
    for (const row of dayRows) {
      byDay[row.day.toISOString().slice(0, 10)] = Number(row.total);
    }
    return { total, byCategory, byDay, transactionCount };
  }

  async void(id: string, tenantId: string, userId: string, reason: string | null): Promise<void> {
    await this.prisma.expense.updateMany({
      where: { id, tenantId, status: 'ACTIVE' },
      data: { status: 'VOIDED', voidedAt: new Date(), voidedBy: userId, voidReason: reason },
    });
  }
}
