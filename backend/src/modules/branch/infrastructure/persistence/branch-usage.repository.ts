import { Injectable } from '@nestjs/common';
import { CashSessionStatus, UserRole } from '@pos/shared';
import { BranchUsagePort } from '../../domain/ports/branch-usage.port';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class BranchUsageRepository implements BranchUsagePort {
  constructor(private readonly prisma: PrismaService) {}

  countActiveCashiers(tenantId: string, branchId: string): Promise<number> {
    return this.prisma.user.count({
      where: { tenantId, branchId, role: UserRole.CASHIER, isActive: true },
    });
  }

  async hasOpenCashSession(tenantId: string, branchId: string): Promise<boolean> {
    const open = await this.prisma.cashSession.findFirst({
      where:  { tenantId, branchId, status: CashSessionStatus.OPEN },
      select: { id: true },
    });
    return open !== null;
  }
}
