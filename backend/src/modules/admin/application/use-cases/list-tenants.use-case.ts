import { Inject, Injectable } from '@nestjs/common';
import { TenantRepositoryPort, TenantWithOwner } from '../../../tenant/domain/ports/tenant-repository.port';

@Injectable()
export class ListTenantsUseCase {
  constructor(
    @Inject('TenantRepositoryPort')
    private readonly tenantRepo: TenantRepositoryPort,
  ) {}

  execute(): Promise<TenantWithOwner[]> {
    return this.tenantRepo.findAll();
  }
}
