import { Inject, Injectable } from '@nestjs/common';
import { Branch } from '../../domain/entities/branch.entity';
import { BranchRepositoryPort } from '../../domain/ports/branch-repository.port';
import { CreateBranchDto } from '../dto/create-branch.dto';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { PlanLimitService } from '../../../plans/application/plan-limit.service';

@Injectable()
export class CreateBranchUseCase {
  constructor(
    @Inject('BranchRepositoryPort')
    private readonly branchRepository: BranchRepositoryPort,
    @Inject('TenantRepositoryPort')
    private readonly tenantRepository: TenantRepositoryPort,
    private readonly planLimitService: PlanLimitService,
  ) {}

  async execute(tenantId: string, dto: CreateBranchDto): Promise<Branch> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (tenant) {
      const plan = await this.planLimitService.getPlan(tenant.plan);
      const count = await this.branchRepository.countByTenant(tenantId);
      this.planLimitService.assertWithinLimit('sucursales', plan, count);
    }

    const branch = Branch.create({ tenantId, name: dto.name, address: dto.address, phone: dto.phone });
    return this.branchRepository.save(branch);
  }
}
