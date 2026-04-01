import { Inject, Injectable } from '@nestjs/common';
import { CashSession } from '../../domain/entities/cash-session.entity';
import { CashSessionRepositoryPort } from '../../domain/ports/cash-session-repository.port';

@Injectable()
export class GetSessionHistoryUseCase {
  constructor(
    @Inject('CashSessionRepositoryPort')
    private readonly repo: CashSessionRepositoryPort,
  ) {}

  async execute(tenantId: string, branchId: string, limit = 20): Promise<CashSession[]> {
    return this.repo.findByBranch(tenantId, branchId, limit);
  }
}
