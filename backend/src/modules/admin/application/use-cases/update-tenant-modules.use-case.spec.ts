import { NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { OrderNumberResetPeriod, SaasPlan } from '@pos/shared';
import { UpdateTenantModulesUseCase } from './update-tenant-modules.use-case';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { PlanRepositoryPort } from '../../../plans/domain/ports/plan-repository.port';
import { PlanModulesService } from '../../../plans/application/plan-modules.service';
import { EventsService } from '../../../events/events.service';
import { Tenant, TenantModules } from '../../../tenant/domain/entities/tenant.entity';
import { Plan } from '../../../plans/domain/entities/plan.entity';

const TENANT_ID = 'tenant-1';
const BASICO = new Plan(SaasPlan.BASICO, 'Básico', 220, 1, 2, 80, false, false, false, false, 90, 100);

function makeTenant(overrides: Partial<TenantModules> | null = null): Tenant {
  return Tenant.reconstitute({
    id: TENANT_ID, name: 'HamBurgos', slug: 'hamburgos', isActive: true, createdAt: new Date(),
    plan: SaasPlan.BASICO,
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

describe('UpdateTenantModulesUseCase', () => {
  let useCase: UpdateTenantModulesUseCase;
  let tenantRepo: MockProxy<TenantRepositoryPort>;
  let planRepo: MockProxy<PlanRepositoryPort>;
  let eventsService: MockProxy<EventsService>;

  beforeEach(() => {
    tenantRepo    = mock<TenantRepositoryPort>();
    planRepo      = mock<PlanRepositoryPort>();
    eventsService = mock<EventsService>();
    useCase = new UpdateTenantModulesUseCase(
      tenantRepo, planRepo, new PlanModulesService(), eventsService,
    );

    tenantRepo.findById.mockResolvedValue(makeTenant());
    planRepo.findById.mockResolvedValue(BASICO);
    tenantRepo.applyModules.mockResolvedValue(makeTenant());
  });

  it('lanza NotFoundException si el tenant no existe', async () => {
    tenantRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute(TENANT_ID, { rafflesEnabled: true })).rejects.toThrow(NotFoundException);
  });

  it('lanza NotFoundException si el plan del tenant no existe', async () => {
    planRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute(TENANT_ID, { rafflesEnabled: true })).rejects.toThrow(NotFoundException);
  });

  it('conceder algo que el plan no da lo registra como excepción', async () => {
    await useCase.execute(TENANT_ID, { rafflesEnabled: true });

    const [, modules, overrides] = tenantRepo.applyModules.mock.calls[0];
    expect(modules.rafflesEnabled).toBe(true);
    expect(overrides).toEqual({ rafflesEnabled: true });
  });

  it('volver al valor del plan borra la excepción', async () => {
    tenantRepo.findById.mockResolvedValue(makeTenant({ rafflesEnabled: true }));

    await useCase.execute(TENANT_ID, { rafflesEnabled: false });

    const [, modules, overrides] = tenantRepo.applyModules.mock.calls[0];
    expect(modules.rafflesEnabled).toBe(false);
    expect(overrides).toEqual({});
  });

  it('no pisa las excepciones que el cambio no menciona', async () => {
    tenantRepo.findById.mockResolvedValue(makeTenant({ rafflesEnabled: true }));

    await useCase.execute(TENANT_ID, { kitchenEnabled: true });

    const [, , overrides] = tenantRepo.applyModules.mock.calls[0];
    expect(overrides).toEqual({ rafflesEnabled: true, kitchenEnabled: true });
  });

  it('emite el evento de módulos actualizados', async () => {
    await useCase.execute(TENANT_ID, { rafflesEnabled: true });
    expect(eventsService.emitToTenant).toHaveBeenCalledWith(TENANT_ID, 'tenant.modules.updated', {});
  });
});
