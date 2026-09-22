import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SOCKET_EVENTS } from '@pos/shared';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { PlanRepositoryPort } from '../../../plans/domain/ports/plan-repository.port';
import { PlanModulesService } from '../../../plans/application/plan-modules.service';
import { Tenant, TenantModules } from '../../../tenant/domain/entities/tenant.entity';
import { EventsService } from '../../../events/events.service';

@Injectable()
export class UpdateTenantModulesUseCase {
  constructor(
    @Inject('TenantRepositoryPort')
    private readonly tenantRepo: TenantRepositoryPort,
    @Inject('PlanRepositoryPort')
    private readonly planRepo: PlanRepositoryPort,
    private readonly planModules: PlanModulesService,
    private readonly eventsService: EventsService,
  ) {}

  async execute(tenantId: string, requested: Partial<TenantModules>): Promise<Tenant> {
    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant) throw new NotFoundException(`Tenant ${tenantId} no encontrado`);

    const plan = await this.planRepo.findById(tenant.plan);
    if (!plan) throw new NotFoundException(`Plan ${tenant.plan} no encontrado`);

    // Lo que el admin pide se guarda como excepción solo si difiere del plan:
    // si coincide, deja de ser excepción y ese módulo vuelve a seguir al plan
    // en futuros cambios, en vez de quedar congelado para siempre.
    const overrides = this.planModules.mergeOverrides(plan, tenant.moduleOverrides, requested);
    const modules   = this.planModules.resolveModules(plan, overrides);

    const result = await this.tenantRepo.applyModules(tenantId, modules, overrides);
    this.eventsService.emitToTenant(tenantId, SOCKET_EVENTS.TENANT_MODULES_UPDATED, {});
    return result;
  }
}
