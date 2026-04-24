import { Inject, Injectable } from '@nestjs/common';
import { CashSession } from '../../domain/entities/cash-session.entity';
import { CashSessionRepositoryPort } from '../../domain/ports/cash-session-repository.port';

@Injectable()
export class GetCurrentSessionUseCase {
  constructor(
    @Inject('CashSessionRepositoryPort')
    private readonly repo: CashSessionRepositoryPort,
  ) {}

  async execute(tenantId: string, branchId: string): Promise<(CashSession & { cashSales: number }) | null> {
    const session = await this.repo.findOpenByBranch(tenantId, branchId);
    if (!session) return null;

    const cashSales = await this.repo.getCashSalesDuringSession(tenantId, branchId, session.openedAt);
    return Object.assign(session, { cashSales });
  }
}
