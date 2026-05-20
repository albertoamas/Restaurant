import { Inject, Injectable } from '@nestjs/common';
import { SOCKET_EVENTS } from '@pos/shared';
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
    this.eventsService.emitToTenant(tenantId, SOCKET_EVENTS.TENANT_MODULES_UPDATED, {});
    return result;
  }
}
