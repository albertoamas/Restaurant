import { Inject, Injectable } from '@nestjs/common';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { Tenant } from '../../../tenant/domain/entities/tenant.entity';

@Injectable()
export class ToggleTenantActiveUseCase {
  constructor(
    @Inject('TenantRepositoryPort')
    private readonly tenantRepo: TenantRepositoryPort,
  ) {}

  execute(tenantId: string): Promise<Tenant> {
    return this.tenantRepo.toggleActive(tenantId);
  }
}
