import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SaasPlan, SOCKET_EVENTS, isUnlimited } from '@pos/shared';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { PlanRepositoryPort } from '../../../plans/domain/ports/plan-repository.port';
import { PlanModulesService } from '../../../plans/application/plan-modules.service';
import { BranchRepositoryPort } from '../../../branch/domain/ports/branch-repository.port';
import { UserRepositoryPort } from '../../../auth/domain/ports/user-repository.port';
import { PRODUCT_REPOSITORY_PORT, ProductRepositoryPort } from '../../../catalog/domain/ports/product-repository.port';
import { EventsService } from '../../../events/events.service';
import { Tenant } from '../../../tenant/domain/entities/tenant.entity';

/** Un recurso que quedó por encima de lo que permite el plan nuevo. */
export interface PlanExcess {
  resource: 'sucursales' | 'cajeros' | 'productos';
  current: number;
  max: number;
}

export interface UpdateTenantPlanResult {
  tenant: Tenant;
  /**
   * Excesos tras un downgrade. No se destruye nada automáticamente —borrar
   * sucursales de un cliente que paga es inaceptable—: se informa para que
   * /admin lo muestre y el admin decida.
   */
  excess: PlanExcess[];
}

@Injectable()
export class UpdateTenantPlanUseCase {
  constructor(
    @Inject('TenantRepositoryPort')
    private readonly tenantRepo: TenantRepositoryPort,
    @Inject('PlanRepositoryPort')
    private readonly planRepo: PlanRepositoryPort,
    @Inject('BranchRepositoryPort')
    private readonly branchRepo: BranchRepositoryPort,
    @Inject('UserRepositoryPort')
    private readonly userRepo: UserRepositoryPort,
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepo: ProductRepositoryPort,
    private readonly planModules: PlanModulesService,
    private readonly eventsService: EventsService,
  ) {}

  async execute(tenantId: string, plan: SaasPlan): Promise<UpdateTenantPlanResult> {
    const [tenant, newPlan] = await Promise.all([
      this.tenantRepo.findById(tenantId),
      this.planRepo.findById(plan),
    ]);
    if (!tenant) throw new NotFoundException(`Tenant ${tenantId} no encontrado`);
    if (!newPlan) throw new NotFoundException(`Plan ${plan} no encontrado`);

    await this.tenantRepo.updatePlan(tenantId, plan);

    // El plan manda sobre los módulos, pero las excepciones que el admin
    // concedió a mano sobreviven: antes, cambiar de plan pisaba una cortesía
    // (p.ej. sorteos en BASICO) sin dejar rastro.
    // Se podan las que el plan nuevo ya cubre, para que no se acumulen ni
    // vuelvan a imponerse en un cambio posterior.
    const overrides = this.planModules.pruneOverrides(newPlan, tenant.moduleOverrides);
    const modules   = this.planModules.resolveModules(newPlan, overrides);
    const updated   = await this.tenantRepo.applyModules(tenantId, modules, overrides);

    this.eventsService.emitToTenant(tenantId, SOCKET_EVENTS.TENANT_MODULES_UPDATED, {});

    return { tenant: updated, excess: await this.findExcess(tenantId, newPlan) };
  }

  /** Qué recursos quedaron por encima del nuevo plan (downgrade). */
  private async findExcess(
    tenantId: string,
    plan: { maxBranches: number; maxCashiers: number; maxProducts: number },
  ): Promise<PlanExcess[]> {
    const [branches, cashiers, products] = await Promise.all([
      this.branchRepo.countByTenant(tenantId),
      this.userRepo.countCashiersByTenant(tenantId),
      this.productRepo.countByTenant(tenantId),
    ]);

    const checks: PlanExcess[] = [
      { resource: 'sucursales', current: branches, max: plan.maxBranches },
      { resource: 'cajeros',    current: cashiers, max: plan.maxCashiers },
      { resource: 'productos',  current: products, max: plan.maxProducts },
    ];

    return checks.filter((c) => !isUnlimited(c.max) && c.current > c.max);
  }
}
