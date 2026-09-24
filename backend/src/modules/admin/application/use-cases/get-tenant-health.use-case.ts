import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@pos/shared';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { UserRepositoryPort } from '../../../auth/domain/ports/user-repository.port';
import { BranchRepositoryPort } from '../../../branch/domain/ports/branch-repository.port';
import { PRODUCT_REPOSITORY_PORT, ProductRepositoryPort } from '../../../catalog/domain/ports/product-repository.port';
import { PlanLimitService } from '../../../plans/application/plan-limit.service';
import { PlanModulesService } from '../../../plans/application/plan-modules.service';

export interface TenantHealthDto {
  tenantId: string;
  /** Un tenant suspendido no puede operar: todos sus logins reciben 403. */
  isActive: boolean;
  hasBranch: boolean;
  hasActiveOwner: boolean;
  hasProducts: boolean;
  branchCount: number;
  cashierCount: number;
  productCount: number;
  /**
   * Informativo, no afecta `ok`: los flags por tenant son excepciones que el
   * admin concede a propósito por encima del plan (ver CLAUDE.md), así que una
   * diferencia es una decisión comercial, no una falla de alta.
   */
  moduleFlagsMatchPlan: boolean;
  withinBranchLimit: boolean;
  withinCashierLimit: boolean;
  withinProductLimit: boolean;
  /** Resumen de un vistazo: el negocio está listo para operar. */
  ok: boolean;
}

/**
 * Convierte el checklist manual de alta (docs/onboarding-cliente.md) en un
 * semáforo consultable desde /admin, en vez de tener que repasarlo a mano
 * cada vez que se da de alta un cliente.
 */
@Injectable()
export class GetTenantHealthUseCase {
  constructor(
    @Inject('BranchRepositoryPort')
    private readonly branchRepo: BranchRepositoryPort,
    @Inject('UserRepositoryPort')
    private readonly userRepo: UserRepositoryPort,
    @Inject('TenantRepositoryPort')
    private readonly tenantRepo: TenantRepositoryPort,
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepo: ProductRepositoryPort,
    private readonly planLimitService: PlanLimitService,
    private readonly planModules: PlanModulesService,
  ) {}

  async execute(tenantId: string): Promise<TenantHealthDto> {
    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant) throw new NotFoundException(`Tenant ${tenantId} no encontrado`);

    const [branchCount, users, productCount, plan] = await Promise.all([
      this.branchRepo.countByTenant(tenantId),
      this.userRepo.findAllByTenant(tenantId),
      this.productRepo.countByTenant(tenantId),
      this.planLimitService.getPlan(tenant.plan),
    ]);

    const hasActiveOwner = users.some((u) => u.role === UserRole.OWNER && u.isActive);
    const cashierCount   = users.filter((u) => u.role === UserRole.CASHIER && u.isActive).length;

    // Se compara contra lo que el plan realmente otorga (incluye los módulos
    // derivados, como branchesEnabled), no contra dos flags sueltos del plan.
    const base = this.planModules.baseModules(plan);
    const moduleFlagsMatchPlan = (Object.keys(base) as (keyof typeof base)[])
      .every((key) => tenant.modules[key] === base[key]);

    // Mismo criterio que usa el cambio de plan para detectar excesos.
    const withinBranchLimit  = this.planLimitService.fitsInPlan(plan, 'sucursales', branchCount);
    const withinCashierLimit = this.planLimitService.fitsInPlan(plan, 'cajeros',    cashierCount);
    const withinProductLimit = this.planLimitService.fitsInPlan(plan, 'productos',  productCount);

    const hasBranch    = branchCount > 0;
    const hasProducts  = productCount > 0;

    return {
      tenantId,
      isActive: tenant.isActive,
      hasBranch,
      hasActiveOwner,
      hasProducts,
      branchCount,
      cashierCount,
      productCount,
      moduleFlagsMatchPlan,
      withinBranchLimit,
      withinCashierLimit,
      withinProductLimit,
      // Quedan fuera de `ok` a propósito:
      //  - hasProducts: un negocio recién dado de alta todavía no cargó su
      //    catálogo, y eso no es una falla de alta.
      //  - moduleFlagsMatchPlan: los overrides del admin son deliberados.
      ok:
        tenant.isActive &&
        hasBranch &&
        hasActiveOwner &&
        withinBranchLimit &&
        withinCashierLimit &&
        withinProductLimit,
    };
  }
}
