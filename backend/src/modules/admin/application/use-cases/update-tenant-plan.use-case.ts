import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SaasPlan, SOCKET_EVENTS } from '@pos/shared';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { PlanRepositoryPort } from '../../../plans/domain/ports/plan-repository.port';
import { PlanModulesService } from '../../../plans/application/plan-modules.service';
import { PlanExcess, PlanLimitService } from '../../../plans/application/plan-limit.service';
import { BranchRepositoryPort } from '../../../branch/domain/ports/branch-repository.port';
import { UserRepositoryPort } from '../../../auth/domain/ports/user-repository.port';
import { PRODUCT_REPOSITORY_PORT, ProductRepositoryPort } from '../../../catalog/domain/ports/product-repository.port';
import { EventsService } from '../../../events/events.service';
import { Tenant } from '../../../tenant/domain/entities/tenant.entity';
import { Plan } from '../../../plans/domain/entities/plan.entity';

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
    private readonly planLimits: PlanLimitService,
    private readonly eventsService: EventsService,
  ) {}

  async execute(tenantId: string, plan: SaasPlan): Promise<UpdateTenantPlanResult> {
    const [tenant, newPlan] = await Promise.all([
      this.tenantRepo.findById(tenantId),
      this.planRepo.findById(plan),
    ]);
    if (!tenant) throw new NotFoundException(`Tenant ${tenantId} no encontrado`);
    if (!newPlan) throw new NotFoundException(`Plan ${plan} no encontrado`);

    // El plan manda sobre los módulos, pero las excepciones que el admin
    // concedió a mano sobreviven: antes, cambiar de plan pisaba una cortesía
    // (p.ej. sorteos en BASICO) sin dejar rastro.
    // Se podan las que el plan nuevo ya cubre, para que no se acumulen ni
    // vuelvan a imponerse en un cambio posterior.
    const overrides = this.planModules.pruneOverrides(newPlan, tenant.moduleOverrides);
    const modules   = this.planModules.resolveModules(newPlan, overrides);
    // El plan viaja en la misma escritura que los módulos que de él se derivan.
    const updated   = await this.tenantRepo.applyModules(tenantId, modules, overrides, plan);

    this.eventsService.emitToTenant(tenantId, SOCKET_EVENTS.TENANT_MODULES_UPDATED, {});

    return { tenant: updated, excess: await this.findExcess(tenantId, newPlan) };
  }

  /**
   * Qué recursos quedaron por encima del nuevo plan (downgrade). La
   * comparación vive en PlanLimitService, junto a la que bloquea la creación:
   * dos criterios distintos de "cabe en el plan" sería peor que ninguno.
   */
  private async findExcess(tenantId: string, plan: Plan): Promise<PlanExcess[]> {
    const [sucursales, cajeros, productos] = await Promise.all([
      this.branchRepo.countByTenant(tenantId),
      this.userRepo.countCashiersByTenant(tenantId),
      this.productRepo.countByTenant(tenantId),
    ]);

    return this.planLimits.findExcess(plan, { sucursales, cajeros, productos });
  }
}
