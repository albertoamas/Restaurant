import { Inject, Injectable } from '@nestjs/common';
import { TENANT_MODULES_UPDATED_EVENT } from '@pos/shared';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { Tenant, TenantModules } from '../../../tenant/domain/entities/tenant.entity';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class UpdateTenantModulesUseCase {
  constructor(
    @Inject('TenantRepositoryPort')
    private readonly tenantRepo: TenantRepositoryPort,
    private readonly eventsService: EventsService,
  ) {}

  async execute(tenantId: string, modules: Partial<TenantModules>): Promise<Tenant> {
    const result = await this.tenantRepo.updateModules(tenantId, modules);
    this.eventsService.emitToTenant(tenantId, TENANT_MODULES_UPDATED_EVENT, {});
    return result;
  }
}
