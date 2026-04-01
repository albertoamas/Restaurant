import { Inject, Injectable } from '@nestjs/common';
import { Branch } from '../../domain/entities/branch.entity';
import { BranchRepositoryPort } from '../../domain/ports/branch-repository.port';
import { CreateBranchDto } from '../dto/create-branch.dto';

@Injectable()
export class CreateBranchUseCase {
  constructor(
    @Inject('BranchRepositoryPort')
    private readonly branchRepository: BranchRepositoryPort,
  ) {}

  async execute(tenantId: string, dto: CreateBranchDto): Promise<Branch> {
    const branch = Branch.create({
      tenantId,
      name: dto.name,
      address: dto.address,
      phone: dto.phone,
    });
    return this.branchRepository.save(branch);
  }
}
