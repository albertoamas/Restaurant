import { Inject, Injectable } from '@nestjs/common';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { Tenant } from '../../../tenant/domain/entities/tenant.entity';
import { ActiveSessionService } from '../../../auth/application/services/active-session.service';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class ToggleTenantActiveUseCase {
  constructor(
    @Inject('TenantRepositoryPort')
    private readonly tenantRepo: TenantRepositoryPort,
    private readonly activeSession: ActiveSessionService,
    private readonly eventsService: EventsService,
  ) {}

  async execute(tenantId: string): Promise<Tenant> {
    const tenant = await this.tenantRepo.toggleActive(tenantId);
    // Suspendido: todo el negocio pierde la API y el tiempo real al instante.
    this.activeSession.forgetTenant(tenantId);
    if (!tenant.isActive) this.eventsService.disconnectTenant(tenantId);
    return tenant;
  }
}
