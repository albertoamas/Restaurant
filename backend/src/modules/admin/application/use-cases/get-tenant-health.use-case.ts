import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@pos/shared';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { UserRepositoryPort } from '../../../auth/domain/ports/user-repository.port';
import { BranchRepositoryPort } from '../../../branch/domain/ports/branch-repository.port';
import { PRODUCT_REPOSITORY_PORT, ProductRepositoryPort } from '../../../catalog/domain/ports/product-repository.port';
import { PlanLimitService } from '../../../plans/application/plan-limit.service';

export interface TenantHealthDto {
  tenantId: string;
  hasBranch: boolean;
  hasActiveOwner: boolean;
  hasProducts: boolean;
  branchCount: number;
  cashierCount: number;
  productCount: number;
  moduleFlagsMatchPlan: boolean;
  withinBranchLimit: boolean;
  withinCashierLimit: boolean;
  withinProductLimit: boolean;
  /** Resumen de un vistazo: todo lo anterior en orden. */
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

    const moduleFlagsMatchPlan =
      tenant.kitchenEnabled === plan.kitchenEnabled &&
      tenant.rafflesEnabled === plan.rafflesEnabled;

    const withinBranchLimit  = plan.maxBranches === -1 || branchCount  <= plan.maxBranches;
    const withinCashierLimit = plan.maxCashiers === -1 || cashierCount <= plan.maxCashiers;
    const withinProductLimit = plan.maxProducts === -1 || productCount <= plan.maxProducts;

    const hasBranch    = branchCount > 0;
    const hasProducts  = productCount > 0;

    return {
      tenantId,
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
      ok:
        hasBranch &&
        hasActiveOwner &&
        moduleFlagsMatchPlan &&
        withinBranchLimit &&
        withinCashierLimit &&
        withinProductLimit,
      // hasProducts se informa pero no se exige: un negocio recién dado de
      // alta todavía no cargó su catálogo, y eso no es una falla de alta.
    };
  }
}
