import { BadRequestException, NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { OrderNumberResetPeriod, SaasPlan } from '@pos/shared';
import { UpdatePlanLimitsUseCase } from './update-plan-limits.use-case';
import { PlanRepositoryPort } from '../../../plans/domain/ports/plan-repository.port';
import { PlanModulesService } from '../../../plans/application/plan-modules.service';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { EventsService } from '../../../events/events.service';
import { Plan } from '../../../plans/domain/entities/plan.entity';
import { basicoPlan, negocioPlan, proPlan } from '../../../plans/domain/entities/plan.fixture';
import { Tenant } from '../../../tenant/domain/entities/tenant.entity';

const BASICO  = basicoPlan();
const PRO     = proPlan();
const NEGOCIO = negocioPlan();

describe('UpdatePlanLimitsUseCase', () => {
  let useCase: UpdatePlanLimitsUseCase;
  let planRepo: MockProxy<PlanRepositoryPort>;
  let tenantRepo: MockProxy<TenantRepositoryPort>;
  let eventsService: MockProxy<EventsService>;

  beforeEach(() => {
    planRepo      = mock<PlanRepositoryPort>();
    tenantRepo    = mock<TenantRepositoryPort>();
    eventsService = mock<EventsService>();
    useCase = new UpdatePlanLimitsUseCase(
      planRepo, tenantRepo, new PlanModulesService(), eventsService,
    );
    tenantRepo.findByPlan.mockResolvedValue([]);

    planRepo.findById.mockImplementation(async (id) =>
      ({ BASICO, PRO, NEGOCIO } as Record<string, Plan>)[id] ?? null,
    );
    planRepo.findAll.mockResolvedValue([BASICO, PRO, NEGOCIO]);
    planRepo.update.mockResolvedValue(PRO);
  });

  it('lanza NotFoundException si el plan no existe', async () => {
    planRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute(SaasPlan.PRO, { priceBs: 500 })).rejects.toThrow(NotFoundException);
  });

  it('acepta un cambio coherente', async () => {
    await expect(useCase.execute(SaasPlan.PRO, { priceBs: 450 })).resolves.toBeDefined();
    expect(planRepo.update).toHaveBeenCalled();
  });

  it('rechaza un límite en 0: eso no es un plan, es un negocio bloqueado', async () => {
    await expect(useCase.execute(SaasPlan.PRO, { maxProducts: 0 })).rejects.toThrow(BadRequestException);
    await expect(useCase.execute(SaasPlan.PRO, { maxProducts: 0 })).rejects.toThrow(/no puede ser 0/);
    expect(planRepo.update).not.toHaveBeenCalled();
  });

  // 0 días de historial deja al cliente sin ver ni el reporte de hoy, y 0 MB
  // le impide subir una sola foto: el plan quedaría vendido e inservible.
  it.each([
    ['reportHistoryDays' as const],
    ['maxStorageMb'      as const],
  ])('rechaza %s en 0', async (key) => {
    await expect(useCase.execute(SaasPlan.PRO, { [key]: 0 })).rejects.toThrow(BadRequestException);
    expect(planRepo.update).not.toHaveBeenCalled();
  });

  it('acepta -1 como "sin límite"', async () => {
    await expect(useCase.execute(SaasPlan.PRO, { maxBranches: -1 })).resolves.toBeDefined();
  });

  it('rechaza dejar un plan caro por debajo de uno más barato', async () => {
    // PRO con 1 sucursal quedaría igual que BASICO pero costando el doble.
    await expect(useCase.execute(SaasPlan.PRO, { maxBranches: 1 })).resolves.toBeDefined();
    await expect(useCase.execute(SaasPlan.PRO, { maxCashiers: 1 })).rejects.toThrow(BadRequestException);
  });

  it('rechaza dejar un plan barato por encima del siguiente', async () => {
    // BASICO con 10 cajeros superaría a PRO (8).
    await expect(useCase.execute(SaasPlan.BASICO, { maxCashiers: 10 })).rejects.toThrow(/no puede ofrecer menos/);
    expect(planRepo.update).not.toHaveBeenCalled();
  });

  it('rechaza dar "ilimitado" a un plan barato si el caro tiene un tope', async () => {
    await expect(useCase.execute(SaasPlan.BASICO, { maxBranches: -1 })).rejects.toThrow(BadRequestException);
  });

  it('el plan más caro puede subir sin restricción', async () => {
    await expect(useCase.execute(SaasPlan.NEGOCIO, { maxCashiers: -1 })).resolves.toBeDefined();
  });

  describe('resincronización de tenants', () => {
    it('recalcula los módulos de los tenants suscritos al plan editado', async () => {
      // Sin esto, editar el plan parecía no hacer nada hasta que algo no
      // relacionado volvía a tocar ese tenant.
      const tenant = Tenant.reconstitute({
    id: 't1', name: 'HamBurgos', slug: 'hamburgos', isActive: true, createdAt: new Date(),
    plan: SaasPlan.PRO,
    modules: {
      ordersEnabled: true, cashEnabled: true, teamEnabled: false,
      branchesEnabled: false, kitchenEnabled: false, rafflesEnabled: false,
      advancedReportsEnabled: false,
    },
    orderNumberResetPeriod: OrderNumberResetPeriod.DAILY,
    businessAddress: null, businessPhone: null, receiptSlogan: null,
    moduleOverrides: null,
  });
      tenantRepo.findByPlan.mockResolvedValue([tenant]);
      planRepo.update.mockResolvedValue(PRO);

      await useCase.execute(SaasPlan.PRO, { priceBs: 420 });

      expect(tenantRepo.applyModules).toHaveBeenCalledTimes(1);
      const [id, modules] = tenantRepo.applyModules.mock.calls[0];
      expect(id).toBe('t1');
      expect(modules).toMatchObject({ kitchenEnabled: true, teamEnabled: true });
      expect(eventsService.emitToTenant).toHaveBeenCalledWith('t1', 'tenant.modules.updated', {});
    });

    it('no toca nada si ningún tenant usa ese plan', async () => {
      await useCase.execute(SaasPlan.PRO, { priceBs: 420 });
      expect(tenantRepo.applyModules).not.toHaveBeenCalled();
    });
  });
});
