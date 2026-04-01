import { Inject, Injectable } from '@nestjs/common';
import { Branch } from '../../domain/entities/branch.entity';
import { BranchRepositoryPort } from '../../domain/ports/branch-repository.port';

@Injectable()
export class ListBranchesUseCase {
  constructor(
    @Inject('BranchRepositoryPort')
    private readonly branchRepository: BranchRepositoryPort,
  ) {}

  async execute(tenantId: string): Promise<Branch[]> {
    return this.branchRepository.findAllByTenant(tenantId);
  }
}
