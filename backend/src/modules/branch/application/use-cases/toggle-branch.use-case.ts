import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BranchRepositoryPort } from '../../domain/ports/branch-repository.port';
import { Branch } from '../../domain/entities/branch.entity';

@Injectable()
export class ToggleBranchUseCase {
  constructor(
    @Inject('BranchRepositoryPort')
    private readonly branchRepository: BranchRepositoryPort,
  ) {}

  async execute(id: string, tenantId: string): Promise<Branch> {
    const branch = await this.branchRepository.findById(id, tenantId);
    if (!branch) throw new NotFoundException('Sucursal no encontrada');

    branch.isActive = !branch.isActive;
    return this.branchRepository.save(branch);
  }
}
