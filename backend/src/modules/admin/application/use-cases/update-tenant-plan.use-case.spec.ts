import { NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { OrderNumberResetPeriod, SaasPlan } from '@pos/shared';
import { UpdateTenantPlanUseCase } from './update-tenant-plan.use-case';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { PlanRepositoryPort } from '../../../plans/domain/ports/plan-repository.port';
import { BranchRepositoryPort } from '../../../branch/domain/ports/branch-repository.port';
import { UserRepositoryPort } from '../../../auth/domain/ports/user-repository.port';
import { ProductRepositoryPort } from '../../../catalog/domain/ports/product-repository.port';
import { PlanModulesService } from '../../../plans/application/plan-modules.service';
import { EventsService } from '../../../events/events.service';
import { Tenant, TenantModules } from '../../../tenant/domain/entities/tenant.entity';
import { Plan } from '../../../plans/domain/entities/plan.entity';

const TENANT_ID = 'tenant-1';

const BASICO = new Plan(SaasPlan.BASICO, 'Básico', 220, 1, 2, 80, false, false, false, false, 90, 100);
const PRO    = new Plan(SaasPlan.PRO,    'Pro',    399, 3, 8, -1, true,  true,  true,  true,  365, 1024);

function makeTenant(overrides: Partial<TenantModules> | null = null, plan = SaasPlan.BASICO): Tenant {
  return Tenant.reconstitute({
    id: TENANT_ID, name: 'HamBurgos', slug: 'hamburgos', isActive: true, createdAt: new Date(),
    plan: plan,
    modules: {
      ordersEnabled: true, cashEnabled: true, teamEnabled: false,
      branchesEnabled: false, kitchenEnabled: false, rafflesEnabled: false,
      advancedReportsEnabled: false,
    },
    orderNumberResetPeriod: OrderNumberResetPeriod.DAILY,
    businessAddress: null, businessPhone: null, receiptSlogan: null,
    moduleOverrides: overrides,
  });
}

describe('UpdateTenantPlanUseCase', () => {
  let useCase: UpdateTenantPlanUseCase;
  let tenantRepo: MockProxy<TenantRepositoryPort>;
  let planRepo: MockProxy<PlanRepositoryPort>;
  let branchRepo: MockProxy<BranchRepositoryPort>;
  let userRepo: MockProxy<UserRepositoryPort>;
  let productRepo: MockProxy<ProductRepositoryPort>;
  let eventsService: MockProxy<EventsService>;

  beforeEach(() => {
    tenantRepo    = mock<TenantRepositoryPort>();
    planRepo      = mock<PlanRepositoryPort>();
    branchRepo    = mock<BranchRepositoryPort>();
    userRepo      = mock<UserRepositoryPort>();
    productRepo   = mock<ProductRepositoryPort>();
    eventsService = mock<EventsService>();
    useCase = new UpdateTenantPlanUseCase(
      tenantRepo, planRepo, branchRepo, userRepo, productRepo,
      new PlanModulesService(), eventsService,
    );

    tenantRepo.findById.mockResolvedValue(makeTenant());
    planRepo.findById.mockResolvedValue(PRO);
    tenantRepo.applyModules.mockResolvedValue(makeTenant());
    branchRepo.countByTenant.mockResolvedValue(1);
    userRepo.countCashiersByTenant.mockResolvedValue(1);
    productRepo.countByTenant.mockResolvedValue(10);
  });

  it('lanza NotFoundException si el tenant no existe', async () => {
    tenantRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute(TENANT_ID, SaasPlan.PRO)).rejects.toThrow(NotFoundException);
  });

  it('lanza NotFoundException si el plan no existe', async () => {
    planRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute(TENANT_ID, SaasPlan.PRO)).rejects.toThrow(NotFoundException);
  });

  it('subir de plan habilita los módulos del plan nuevo', async () => {
    await useCase.execute(TENANT_ID, SaasPlan.PRO);

    const [, modules] = tenantRepo.applyModules.mock.calls[0];
    expect(modules).toMatchObject({
      kitchenEnabled:  true,
      rafflesEnabled:  true,
      teamEnabled:     true,
      branchesEnabled: true,
    });
  });

  it('una cortesía concedida a mano SOBREVIVE al cambio de plan', async () => {
    // Antes, cambiar de plan pisaba los flags con los del plan y la cortesía
    // se perdía en silencio.
    tenantRepo.findById.mockResolvedValue(makeTenant({ rafflesEnabled: true }));
    planRepo.findById.mockResolvedValue(BASICO); // BASICO no da sorteos

    await useCase.execute(TENANT_ID, SaasPlan.BASICO);

    const [, modules, overrides] = tenantRepo.applyModules.mock.calls[0];
    expect(modules.rafflesEnabled).toBe(true);
    expect(overrides).toEqual({ rafflesEnabled: true });
  });

  it('emite el evento para que los clientes abiertos refresquen sus módulos', async () => {
    await useCase.execute(TENANT_ID, SaasPlan.PRO);
    expect(eventsService.emitToTenant).toHaveBeenCalledWith(
      TENANT_ID, 'tenant.modules.updated', {},
    );
  });

  describe('excesos tras un downgrade', () => {
    it('no informa excesos si todo entra en el plan nuevo', async () => {
      const { excess } = await useCase.execute(TENANT_ID, SaasPlan.PRO);
      expect(excess).toEqual([]);
    });

    it('informa qué recursos quedaron por encima, sin destruir nada', async () => {
      planRepo.findById.mockResolvedValue(BASICO); // 1 sucursal, 2 cajeros, 80 productos
      branchRepo.countByTenant.mockResolvedValue(3);
      userRepo.countCashiersByTenant.mockResolvedValue(5);
      productRepo.countByTenant.mockResolvedValue(10);

      const { excess } = await useCase.execute(TENANT_ID, SaasPlan.BASICO);

      expect(excess).toEqual([
        { resource: 'sucursales', current: 3, max: 1 },
        { resource: 'cajeros',    current: 5, max: 2 },
      ]);
    });

    it('-1 en el plan nunca cuenta como exceso', async () => {
      productRepo.countByTenant.mockResolvedValue(99999);
      const { excess } = await useCase.execute(TENANT_ID, SaasPlan.PRO); // maxProducts = -1
      expect(excess.some((e) => e.resource === 'productos')).toBe(false);
    });
  });
});
