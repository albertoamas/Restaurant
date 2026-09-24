import { NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { OrderNumberResetPeriod, SaasPlan, UserRole } from '@pos/shared';
import { GetProfileUseCase } from './get-profile.use-case';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { PlanLimitService } from '../../../plans/application/plan-limit.service';
import { User } from '../../domain/entities/user.entity';
import { Tenant } from '../../../tenant/domain/entities/tenant.entity';
import { Plan } from '../../../plans/domain/entities/plan.entity';

function makeUser(): User {
  const user = new User();
  user.id        = 'user-1';
  user.tenantId  = 'tenant-1';
  user.branchId  = null;
  user.email     = 'admin@hamburgos.com';
  user.name      = 'Admin';
  user.role      = UserRole.OWNER;
  user.isActive  = true;
  user.createdAt = new Date();
  return user;
}

function makeTenant(): Tenant {
  return Tenant.reconstitute({
    id: 'tenant-1', name: 'HamBurgos', slug: 'hamburgos', isActive: true, createdAt: new Date(),
    plan: SaasPlan.PRO,
    modules: {
      ordersEnabled: true, cashEnabled: true, teamEnabled: true,
      branchesEnabled: true, kitchenEnabled: true, rafflesEnabled: true,
      advancedReportsEnabled: true,
    },
    orderNumberResetPeriod: OrderNumberResetPeriod.MONTHLY,
  });
}

describe('GetProfileUseCase', () => {
  let useCase: GetProfileUseCase;
  let userRepo: MockProxy<UserRepositoryPort>;
  let tenantRepo: MockProxy<TenantRepositoryPort>;
  let planLimitService: MockProxy<PlanLimitService>;

  beforeEach(() => {
    userRepo         = mock<UserRepositoryPort>();
    tenantRepo       = mock<TenantRepositoryPort>();
    planLimitService = mock<PlanLimitService>();
    useCase          = new GetProfileUseCase(userRepo, tenantRepo, planLimitService);

    userRepo.findById.mockResolvedValue(makeUser());
    tenantRepo.findById.mockResolvedValue(makeTenant());
    planLimitService.getPlan.mockResolvedValue({
      id: SaasPlan.PRO,
      displayName: 'Pro',
      limits: { maxBranches: 3, maxCashiers: 8, maxProducts: -1, kitchenEnabled: true },
    } as Plan);
  });

  it('lanza NotFoundException si el usuario no existe', async () => {
    userRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute('user-1', 'tenant-1')).rejects.toThrow(NotFoundException);
  });

  // Mismo contrato que el login: el frontend apaga rutas y pestañas con estos
  // flags, y `?? false` convierte un flag ausente en un módulo perdido.
  it('devuelve todos los módulos del tenant, sin omitir ninguno', async () => {
    const tenant = makeTenant();
    const result = await useCase.execute('user-1', 'tenant-1');

    expect(result.modules).toEqual({
      ...tenant.modules,
      orderNumberResetPeriod: OrderNumberResetPeriod.MONTHLY,
    });
  });

  it('sin tenant no explota: cae a los módulos por defecto', async () => {
    tenantRepo.findById.mockResolvedValue(null);
    planLimitService.getPlan.mockResolvedValue({
      id: SaasPlan.BASICO,
      displayName: 'Básico',
      limits: { maxBranches: 1, maxCashiers: 2, maxProducts: 80, kitchenEnabled: false },
    } as Plan);

    const result = await useCase.execute('user-1', 'tenant-1');

    expect(result.modules.advancedReportsEnabled).toBe(false);
    expect(result.modules.orderNumberResetPeriod).toBe(OrderNumberResetPeriod.DAILY);
    expect(result.tenantName).toBe('');
  });
});
