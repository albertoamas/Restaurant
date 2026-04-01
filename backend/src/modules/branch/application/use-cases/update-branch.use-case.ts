import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BranchRepositoryPort } from '../../domain/ports/branch-repository.port';
import { UpdateBranchDto } from '../dto/update-branch.dto';
import { Branch } from '../../domain/entities/branch.entity';

@Injectable()
export class UpdateBranchUseCase {
  constructor(
    @Inject('BranchRepositoryPort')
    private readonly branchRepository: BranchRepositoryPort,
  ) {}

  async execute(id: string, tenantId: string, dto: UpdateBranchDto): Promise<Branch> {
    const branch = await this.branchRepository.findById(id, tenantId);
    if (!branch) throw new NotFoundException('Sucursal no encontrada');

    if (dto.name !== undefined) branch.name = dto.name;
    if (dto.address !== undefined) branch.address = dto.address ?? null;
    if (dto.phone !== undefined) branch.phone = dto.phone ?? null;

    return this.branchRepository.save(branch);
  }
}
