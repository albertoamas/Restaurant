import { ConflictException, ForbiddenException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { UserRole, SaasPlan, OrderNumberResetPeriod } from '@pos/shared';
import { CreateCashierUseCase } from './create-cashier.use-case';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { PlanLimitService } from '../../../plans/application/plan-limit.service';
import { User } from '../../domain/entities/user.entity';
import { Tenant } from '../../../tenant/domain/entities/tenant.entity';
import { Plan } from '../../../plans/domain/entities/plan.entity';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-1';

function makeTenant(): Tenant {
  return new Tenant(
    TENANT_ID, 'HamBurgos', 'hamburgos', true, new Date(),
    SaasPlan.BASICO, true, true, true, true, true, false,
    OrderNumberResetPeriod.DAILY, null,
  );
}

function makePlan(maxCashiers = 3): Plan {
  return {
    id:          SaasPlan.BASICO,
    displayName: 'Básico',
    maxBranches: 1,
    maxCashiers,
    maxProducts: 80,
    kitchenEnabled: false,
    rafflesEnabled: false,
    limits: { maxBranches: 1, maxCashiers, maxProducts: 80, kitchenEnabled: false },
  } as unknown as Plan;
}

function makeSavedUser(): User {
  const u = new User();
  u.id = 'user-new';
  u.tenantId = TENANT_ID;
  u.branchId = null;
  u.email = 'cajero@demo.com';
  u.passwordHash = 'hashed';
  u.name = 'Nuevo Cajero';
  u.role = UserRole.CASHIER;
  u.isActive = true;
  u.createdAt = new Date();
  return u;
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('CreateCashierUseCase', () => {
  let useCase: CreateCashierUseCase;
  let userRepo: MockProxy<UserRepositoryPort>;
  let tenantRepo: MockProxy<TenantRepositoryPort>;
  let planLimitService: MockProxy<PlanLimitService>;

  beforeEach(() => {
    userRepo         = mock<UserRepositoryPort>();
    tenantRepo       = mock<TenantRepositoryPort>();
    planLimitService = mock<PlanLimitService>();
    useCase = new CreateCashierUseCase(userRepo, tenantRepo, planLimitService);

    // Happy-path defaults
    tenantRepo.findById.mockResolvedValue(makeTenant());
    planLimitService.getPlan.mockResolvedValue(makePlan());
    userRepo.countCashiersByTenant.mockResolvedValue(0);
    planLimitService.assertWithinLimit.mockReturnValue(undefined);
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.save.mockResolvedValue(makeSavedUser());
  });

  it('crea un cajero y retorna los datos básicos del usuario', async () => {
    const result = await useCase.execute(TENANT_ID, {
      email: 'cajero@demo.com',
      password: 'pass123',
      name: 'Nuevo Cajero',
    });

    expect(result).toMatchObject({
      email:    'cajero@demo.com',
      name:     'Nuevo Cajero',
      role:     UserRole.CASHIER,
      isActive: true,
    });
    expect(userRepo.save).toHaveBeenCalledTimes(1);
  });

  it('verifica el límite del plan antes de crear', async () => {
    userRepo.countCashiersByTenant.mockResolvedValue(2);

    await useCase.execute(TENANT_ID, {
      email: 'cajero@demo.com',
      password: 'pass123',
      name: 'Cajero',
    });

    expect(planLimitService.assertWithinLimit).toHaveBeenCalledWith(
      'cajeros',
      expect.anything(),
      2,
    );
  });

  it('lanza ForbiddenException si el plan ha alcanzado el límite de cajeros', async () => {
    planLimitService.assertWithinLimit.mockImplementation(() => {
      throw new ForbiddenException('Límite de cajeros alcanzado');
    });

    await expect(
      useCase.execute(TENANT_ID, { email: 'cajero@demo.com', password: 'pass123', name: 'Cajero' }),
    ).rejects.toThrow(ForbiddenException);

    expect(userRepo.save).not.toHaveBeenCalled();
  });

  it('lanza ConflictException si el email ya está en uso en el tenant', async () => {
    userRepo.findByEmail.mockResolvedValue(makeSavedUser());

    await expect(
      useCase.execute(TENANT_ID, { email: 'cajero@demo.com', password: 'pass123', name: 'Cajero' }),
    ).rejects.toThrow(ConflictException);

    expect(userRepo.save).not.toHaveBeenCalled();
  });

  it('omite la verificación del plan si el tenant no existe', async () => {
    tenantRepo.findById.mockResolvedValue(null);

    await useCase.execute(TENANT_ID, {
      email: 'cajero@demo.com',
      password: 'pass123',
      name: 'Cajero',
    });

    expect(planLimitService.getPlan).not.toHaveBeenCalled();
    expect(planLimitService.assertWithinLimit).not.toHaveBeenCalled();
    expect(userRepo.save).toHaveBeenCalledTimes(1);
  });

  it('asigna el branchId si se proporciona en el DTO', async () => {
    const savedWithBranch = Object.assign(makeSavedUser(), { branchId: 'branch-1' });
    userRepo.save.mockResolvedValue(savedWithBranch);

    const result = await useCase.execute(TENANT_ID, {
      email: 'cajero@demo.com',
      password: 'pass123',
      name: 'Cajero',
      branchId: 'branch-1',
    });

    expect(result.branchId).toBe('branch-1');
  });
});
