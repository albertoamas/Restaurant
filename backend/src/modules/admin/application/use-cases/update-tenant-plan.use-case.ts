import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SaasPlan, SOCKET_EVENTS } from '@pos/shared';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { PlanRepositoryPort } from '../../../plans/domain/ports/plan-repository.port';
import { EventsService } from '../../../events/events.service';
import { Tenant } from '../../../tenant/domain/entities/tenant.entity';

@Injectable()
export class UpdateTenantPlanUseCase {
  constructor(
    @Inject('TenantRepositoryPort')
    private readonly tenantRepo: TenantRepositoryPort,
    @Inject('PlanRepositoryPort')
    private readonly planRepo: PlanRepositoryPort,
    private readonly eventsService: EventsService,
  ) {}

  async execute(tenantId: string, plan: SaasPlan): Promise<Tenant> {
    const [tenant, newPlan] = await Promise.all([
      this.tenantRepo.findById(tenantId),
      this.planRepo.findById(plan),
    ]);
    if (!tenant) throw new NotFoundException(`Tenant ${tenantId} not found`);
    if (!newPlan) throw new NotFoundException(`Plan ${plan} not found`);

    await this.tenantRepo.updatePlan(tenantId, plan);

    // Sync plan-gated feature flags (kitchenEnabled, rafflesEnabled).
    // Core flags (ordersEnabled, cashEnabled, teamEnabled, branchesEnabled)
    // are admin-only overrides — they are never touched by plan changes.
    const result = await this.tenantRepo.updateModules(tenantId, {
      kitchenEnabled: newPlan.kitchenEnabled,
      rafflesEnabled: newPlan.rafflesEnabled,
    });

    this.eventsService.emitToTenant(tenantId, SOCKET_EVENTS.TENANT_MODULES_UPDATED, {});
    return result;
  }
}
