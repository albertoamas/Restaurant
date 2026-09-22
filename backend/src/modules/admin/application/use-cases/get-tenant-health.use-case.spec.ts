import { NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { OrderNumberResetPeriod, SaasPlan, UserRole } from '@pos/shared';
import { GetTenantHealthUseCase } from './get-tenant-health.use-case';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { UserRepositoryPort } from '../../../auth/domain/ports/user-repository.port';
import { BranchRepositoryPort } from '../../../branch/domain/ports/branch-repository.port';
import { ProductRepositoryPort } from '../../../catalog/domain/ports/product-repository.port';
import { PlanLimitService } from '../../../plans/application/plan-limit.service';
import { Tenant } from '../../../tenant/domain/entities/tenant.entity';
import { Plan } from '../../../plans/domain/entities/plan.entity';
import { User } from '../../../auth/domain/entities/user.entity';

const TENANT_ID = 'tenant-1';

function makeTenant(over: Partial<{ kitchenEnabled: boolean; rafflesEnabled: boolean }> = {}): Tenant {
  return new Tenant(
    TENANT_ID, 'HamBurgos', 'hamburgos', true, new Date(),
    SaasPlan.PRO,
    true, true, true, true,
    over.kitchenEnabled ?? true,
    over.rafflesEnabled ?? true,
    OrderNumberResetPeriod.DAILY, null, null, null,
  );
}

function makePlan(over: Partial<{ maxBranches: number; maxCashiers: number; maxProducts: number; kitchenEnabled: boolean; rafflesEnabled: boolean }> = {}): Plan {
  return new Plan(
    SaasPlan.PRO, 'Pro', 399,
    over.maxBranches ?? 3,
    over.maxCashiers ?? 8,
    over.maxProducts ?? -1,
    over.kitchenEnabled ?? true,
    over.rafflesEnabled ?? true,
  );
}

function makeUser(role: UserRole, isActive = true): User {
  const u = new User();
  u.id = 'user-' + role;
  u.tenantId = TENANT_ID;
  u.branchId = null;
  u.email = role + '@demo.com';
  u.passwordHash = 'hash';
  u.name = role;
  u.role = role;
  u.isActive = isActive;
  u.createdAt = new Date();
  return u;
}

describe('GetTenantHealthUseCase', () => {
  let useCase: GetTenantHealthUseCase;
  let branchRepo: MockProxy<BranchRepositoryPort>;
  let userRepo: MockProxy<UserRepositoryPort>;
  let tenantRepo: MockProxy<TenantRepositoryPort>;
  let productRepo: MockProxy<ProductRepositoryPort>;
  let planLimitService: MockProxy<PlanLimitService>;

  beforeEach(() => {
    branchRepo       = mock<BranchRepositoryPort>();
    userRepo         = mock<UserRepositoryPort>();
    tenantRepo       = mock<TenantRepositoryPort>();
    productRepo      = mock<ProductRepositoryPort>();
    planLimitService = mock<PlanLimitService>();
    useCase = new GetTenantHealthUseCase(branchRepo, userRepo, tenantRepo, productRepo, planLimitService);

    tenantRepo.findById.mockResolvedValue(makeTenant());
    planLimitService.getPlan.mockResolvedValue(makePlan());
    branchRepo.countByTenant.mockResolvedValue(1);
    productRepo.countByTenant.mockResolvedValue(10);
    userRepo.findAllByTenant.mockResolvedValue([makeUser(UserRole.OWNER), makeUser(UserRole.CASHIER)]);
  });

  it('lanza NotFoundException si el tenant no existe', async () => {
    tenantRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute(TENANT_ID)).rejects.toThrow(NotFoundException);
  });

  it('ok=true cuando todo está en orden', async () => {
    const result = await useCase.execute(TENANT_ID);
    expect(result.ok).toBe(true);
    expect(result.hasBranch).toBe(true);
    expect(result.hasActiveOwner).toBe(true);
    expect(result.hasProducts).toBe(true);
    expect(result.branchCount).toBe(1);
    expect(result.cashierCount).toBe(1);
    expect(result.productCount).toBe(10);
  });

  it('hasBranch=false y ok=false si no tiene ninguna sucursal', async () => {
    branchRepo.countByTenant.mockResolvedValue(0);
    const result = await useCase.execute(TENANT_ID);
    expect(result.hasBranch).toBe(false);
    expect(result.ok).toBe(false);
  });

  it('hasActiveOwner=false si el único OWNER está desactivado', async () => {
    userRepo.findAllByTenant.mockResolvedValue([makeUser(UserRole.OWNER, false)]);
    const result = await useCase.execute(TENANT_ID);
    expect(result.hasActiveOwner).toBe(false);
    expect(result.ok).toBe(false);
  });

  it('hasProducts=false no afecta ok: un negocio recién dado de alta aún no cargó catálogo', async () => {
    productRepo.countByTenant.mockResolvedValue(0);
    const result = await useCase.execute(TENANT_ID);
    expect(result.hasProducts).toBe(false);
    expect(result.ok).toBe(true);
  });

  it('moduleFlagsMatchPlan=false si los flags del tenant no coinciden con los del plan', async () => {
    tenantRepo.findById.mockResolvedValue(makeTenant({ kitchenEnabled: false }));
    const result = await useCase.execute(TENANT_ID);
    expect(result.moduleFlagsMatchPlan).toBe(false);
    expect(result.ok).toBe(false);
  });

  it('withinBranchLimit=false si ya superó el máximo del plan', async () => {
    branchRepo.countByTenant.mockResolvedValue(5);
    planLimitService.getPlan.mockResolvedValue(makePlan({ maxBranches: 3 }));
    const result = await useCase.execute(TENANT_ID);
    expect(result.withinBranchLimit).toBe(false);
    expect(result.ok).toBe(false);
  });

  it('-1 en el plan significa ilimitado: nunca marca el límite como superado', async () => {
    productRepo.countByTenant.mockResolvedValue(99999);
    planLimitService.getPlan.mockResolvedValue(makePlan({ maxProducts: -1 }));
    const result = await useCase.execute(TENANT_ID);
    expect(result.withinProductLimit).toBe(true);
  });

  it('cashierCount solo cuenta cajeros activos', async () => {
    userRepo.findAllByTenant.mockResolvedValue([
      makeUser(UserRole.OWNER),
      makeUser(UserRole.CASHIER, true),
      { ...makeUser(UserRole.CASHIER, false), id: 'user-cashier-2' },
    ]);
    const result = await useCase.execute(TENANT_ID);
    expect(result.cashierCount).toBe(1);
  });
});
