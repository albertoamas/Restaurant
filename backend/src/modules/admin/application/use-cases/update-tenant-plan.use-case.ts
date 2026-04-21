import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SaasPlan } from '@pos/shared';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { PlanRepositoryPort } from '../../../plans/domain/ports/plan-repository.port';
import { Tenant } from '../../../tenant/domain/entities/tenant.entity';

@Injectable()
export class UpdateTenantPlanUseCase {
  constructor(
    @Inject('TenantRepositoryPort')
    private readonly tenantRepo: TenantRepositoryPort,
    @Inject('PlanRepositoryPort')
    private readonly planRepo: PlanRepositoryPort,
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
    return this.tenantRepo.updateModules(tenantId, {
      kitchenEnabled: newPlan.kitchenEnabled,
      rafflesEnabled: newPlan.rafflesEnabled,
    });
  }
}
