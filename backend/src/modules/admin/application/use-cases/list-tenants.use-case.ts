import { Inject, Injectable } from '@nestjs/common';
import { TenantRepositoryPort, TenantWithOwner } from '../../../tenant/domain/ports/tenant-repository.port';
import { StorageQuotaService } from '../../../upload/application/storage-quota.service';

const MB = 1024 * 1024;

export interface TenantListItem extends TenantWithOwner {
  /** MB ocupados hoy por las imágenes del tenant, para contrastarlos con su plan. */
  storageUsedMb: number;
}

@Injectable()
export class ListTenantsUseCase {
  constructor(
    @Inject('TenantRepositoryPort')
    private readonly tenantRepo: TenantRepositoryPort,
    private readonly storageQuota: StorageQuotaService,
  ) {}

  async execute(): Promise<TenantListItem[]> {
    const tenants = await this.tenantRepo.findAll();

    // Un readdir por tenant. El panel de admin tiene rate limit de 10 req/min y
    // el conteo es el mismo que cobra la cuota al subir: una sola fuente.
    return Promise.all(
      tenants.map(async (tenant) => ({
        ...tenant,
        storageUsedMb: Math.round((await this.storageQuota.usedBytes(tenant.id)) / MB * 10) / 10,
      })),
    );
  }
}
