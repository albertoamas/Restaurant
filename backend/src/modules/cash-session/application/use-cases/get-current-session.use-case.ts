import { Inject, Injectable } from '@nestjs/common';
import { CashSession } from '../../domain/entities/cash-session.entity';
import { CashSessionRepositoryPort } from '../../domain/ports/cash-session-repository.port';

@Injectable()
export class GetCurrentSessionUseCase {
  constructor(
    @Inject('CashSessionRepositoryPort')
    private readonly repo: CashSessionRepositoryPort,
  ) {}

  async execute(tenantId: string, branchId: string): Promise<CashSession | null> {
    return this.repo.findOpenByBranch(tenantId, branchId);
  }
}
