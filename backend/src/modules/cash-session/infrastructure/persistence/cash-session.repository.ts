import { Injectable } from '@nestjs/common';
import { CashSessionStatus, PaymentMethod } from '@pos/shared';
import { CashSession } from '../../domain/entities/cash-session.entity';
import { CashSessionRepositoryPort } from '../../domain/ports/cash-session-repository.port';
import { PrismaService } from '../../../prisma/prisma.service';
import { CashSession as PrismaCashSession } from '@prisma/client';

function toDomain(row: PrismaCashSession): CashSession {
  return CashSession.reconstitute({
    id: row.id,
    tenantId: row.tenantId,
    branchId: row.branchId,
    openedBy: row.openedBy,
    closedBy: row.closedBy,
    openingAmount: Number(row.openingAmount),
    closingAmount: row.closingAmount !== null ? Number(row.closingAmount) : null,
    expectedAmount: row.expectedAmount !== null ? Number(row.expectedAmount) : null,
    difference: row.difference !== null ? Number(row.difference) : null,
    status: row.status as CashSessionStatus,
    openedAt: row.openedAt,
    closedAt: row.closedAt,
    notes: row.notes,
  });
}

@Injectable()
export class CashSessionRepository implements CashSessionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(session: CashSession): Promise<CashSession> {
    const data = {
      id: session.id,
      tenantId: session.tenantId,
      branchId: session.branchId,
      openedBy: session.openedBy,
      closedBy: session.closedBy,
      openingAmount: session.openingAmount,
      closingAmount: session.closingAmount,
      expectedAmount: session.expectedAmount,
      difference: session.difference,
      status: session.status,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      notes: session.notes,
    };

    const row = await this.prisma.cashSession.upsert({
      where: { id: session.id },
      create: data,
      update: data,
    });
    return toDomain(row);
  }

  async findOpenByBranch(tenantId: string, branchId: string): Promise<CashSession | null> {
    const row = await this.prisma.cashSession.findFirst({
      where: { tenantId, branchId, status: CashSessionStatus.OPEN },
    });
    return row ? toDomain(row) : null;
  }

  async findById(id: string, tenantId: string): Promise<CashSession | null> {
    const row = await this.prisma.cashSession.findFirst({
      where: { id, tenantId },
    });
    return row ? toDomain(row) : null;
  }

  async findByBranch(tenantId: string, branchId: string, limit = 20): Promise<CashSession[]> {
    const rows = await this.prisma.cashSession.findMany({
      where: { tenantId, branchId },
      orderBy: { openedAt: 'desc' },
      take: limit,
    });
    return rows.map(toDomain);
  }

  async getCashSalesDuringSession(tenantId: string, branchId: string, from: Date): Promise<number> {
    const result = await this.prisma.$queryRaw<[{ cash_total: number }]>`
      SELECT COALESCE(SUM(total), 0) AS cash_total
      FROM orders
      WHERE tenant_id = ${tenantId}
        AND branch_id = ${branchId}
        AND payment_method = ${PaymentMethod.CASH}
        AND status != 'CANCELLED'
        AND created_at >= ${from}`;

    return Number(result[0]?.cash_total ?? 0);
  }
}
