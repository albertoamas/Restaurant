import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { OrderNumberResetPeriod, SaasPlan } from '@pos/shared';
import { ReportHistoryGuard } from './report-history.guard';
import { TenantRepositoryPort } from '../../modules/tenant/domain/ports/tenant-repository.port';
import { PlanRepositoryPort } from '../../modules/plans/domain/ports/plan-repository.port';
import { Tenant } from '../../modules/tenant/domain/entities/tenant.entity';
import { Plan } from '../../modules/plans/domain/entities/plan.entity';
import { basicoPlan } from '../../modules/plans/domain/entities/plan.fixture';

const TENANT_ID = 'tenant-1';

function makeTenant(): Tenant {
  return Tenant.reconstitute({
    id: TENANT_ID, name: 'HamBurgos', slug: 'hamburgos', isActive: true, createdAt: new Date(),
    plan: SaasPlan.BASICO,
    modules: {
      ordersEnabled: true, cashEnabled: true, teamEnabled: false,
      branchesEnabled: false, kitchenEnabled: false, rafflesEnabled: false,
      advancedReportsEnabled: false,
    },
    orderNumberResetPeriod: OrderNumberResetPeriod.DAILY,
  });
}

function makePlan(reportHistoryDays: number): Plan {
  return basicoPlan({ reportHistoryDays });
}

/** ISO de hace N días, que es como llegan los `from` del frontend. */
function daysAgoIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function makeCtx(query: Record<string, string>): ExecutionContext {
  const ctx = mock<ExecutionContext>();
  ctx.switchToHttp.mockReturnValue({
    getRequest: () => ({ query, user: { tenantId: TENANT_ID } }),
  } as ReturnType<ExecutionContext['switchToHttp']>);
  return ctx;
}

describe('ReportHistoryGuard', () => {
  let guard: ReportHistoryGuard;
  let tenantRepo: MockProxy<TenantRepositoryPort>;
  let planRepo: MockProxy<PlanRepositoryPort>;

  beforeEach(() => {
    tenantRepo = mock<TenantRepositoryPort>();
    planRepo   = mock<PlanRepositoryPort>();
    guard      = new ReportHistoryGuard(tenantRepo, planRepo);

    tenantRepo.findById.mockResolvedValue(makeTenant());
    planRepo.findById.mockResolvedValue(makePlan(90));
  });

  it('deja pasar si no se pidió ninguna fecha (el use-case usa hoy)', async () => {
    await expect(guard.canActivate(makeCtx({}))).resolves.toBe(true);
    expect(tenantRepo.findById).not.toHaveBeenCalled();
  });

  it('deja pasar un rango dentro del historial del plan', async () => {
    await expect(guard.canActivate(makeCtx({ from: daysAgoIso(30) }))).resolves.toBe(true);
  });

  it('rechaza un rango más viejo que lo que permite el plan', async () => {
    await expect(guard.canActivate(makeCtx({ from: daysAgoIso(200) })))
      .rejects.toThrow(ForbiddenException);
  });

  it('el mensaje dice cuántos días incluye el plan, no devuelve un reporte vacío', async () => {
    await expect(guard.canActivate(makeCtx({ from: daysAgoIso(200) })))
      .rejects.toThrow(/últimos 90 días/);
  });

  it('también valida el parámetro `date` de los reportes diarios', async () => {
    await expect(guard.canActivate(makeCtx({ date: daysAgoIso(200) })))
      .rejects.toThrow(ForbiddenException);
  });

  // Una fecha rota es un 400 del endpoint, no un límite de plan: si el guard
  // la tratara como "antiquísima", el cliente vería "tu plan solo permite N
  // días" ante un simple typo.
  it('deja pasar una fecha ilegible para que la valide el endpoint', async () => {
    await expect(guard.canActivate(makeCtx({ from: 'no-es-una-fecha' }))).resolves.toBe(true);
  });

  it('-1 en el plan significa historial completo', async () => {
    planRepo.findById.mockResolvedValue(makePlan(-1));
    await expect(guard.canActivate(makeCtx({ from: daysAgoIso(5000) }))).resolves.toBe(true);
  });
});
