import { Injectable } from '@nestjs/common';
import { CashSessionReportItemDto } from '@pos/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { getBoliviaTodayBoundsISO } from '../../../../common/utils/timezone.util';

@Injectable()
export class GetCashSessionsReportUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    tenantId: string,
    branchId: string | null,
    from?: string,
    to?: string,
  ): Promise<CashSessionReportItemDto[]> {
    const { start: defaultStart, end: defaultEnd } = getBoliviaTodayBoundsISO();
    const fromTs = new Date(from || defaultStart);
    const toTs   = new Date(to   || defaultEnd);

    const branchFilter = branchId
      ? Prisma.sql`AND cs.branch_id = ${branchId}`
      : Prisma.sql``;

    type RawRow = {
      id:             string;
      branchId:       string;
      branchName:     string;
      status:         string;
      openedAt:       Date;
      closedAt:       Date | null;
      openingAmount:  unknown;
      closingAmount:  unknown | null;
      expectedAmount: unknown | null;
      difference:     unknown | null;
    };

    const rows = await this.prisma.$queryRaw<RawRow[]>`
      SELECT
        cs.id,
        cs.branch_id       AS "branchId",
        b.name             AS "branchName",
        cs.status,
        cs.opened_at       AS "openedAt",
        cs.closed_at       AS "closedAt",
        cs.opening_amount  AS "openingAmount",
        cs.closing_amount  AS "closingAmount",
        cs.expected_amount AS "expectedAmount",
        cs.difference
      FROM cash_sessions cs
      JOIN branches b ON b.id = cs.branch_id
      WHERE cs.tenant_id = ${tenantId}
        ${branchFilter}
        AND cs.opened_at BETWEEN ${fromTs} AND ${toTs}
      ORDER BY cs.opened_at DESC`;

    return rows.map((r) => ({
      id:             r.id,
      branchId:       r.branchId,
      branchName:     r.branchName,
      status:         r.status,
      openedAt:       r.openedAt.toISOString(),
      closedAt:       r.closedAt       != null ? r.closedAt.toISOString() : null,
      openingAmount:  Number(r.openingAmount),
      closingAmount:  r.closingAmount  != null ? Number(r.closingAmount)  : null,
      expectedAmount: r.expectedAmount != null ? Number(r.expectedAmount) : null,
      difference:     r.difference     != null ? Number(r.difference)     : null,
    }));
  }
}
