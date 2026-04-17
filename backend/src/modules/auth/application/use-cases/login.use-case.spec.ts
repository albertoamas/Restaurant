import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { mock, MockProxy } from 'jest-mock-extended';
import * as bcrypt from 'bcryptjs';
import { UserRole, SaasPlan, OrderNumberResetPeriod } from '@pos/shared';
import { LoginUseCase } from './login.use-case';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { PlanLimitService } from '../../../plans/application/plan-limit.service';
import { User } from '../../domain/entities/user.entity';
import { Tenant } from '../../../tenant/domain/entities/tenant.entity';
import { Plan } from '../../../plans/domain/entities/plan.entity';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const PASSWORD      = 'demo123';
const PASSWORD_HASH = bcrypt.hashSync(PASSWORD, 10);

function makeUser(overrides: Partial<User> = {}): User {
  const user  = new User();
  user.id           = 'user-1';
  user.tenantId     = 'tenant-1';
  user.branchId     = null;
  user.email        = 'admin@hamburgos.com';
  user.passwordHash = PASSWORD_HASH;
  user.name         = 'Admin';
  user.role         = UserRole.OWNER;
  user.isActive     = true;
  user.createdAt    = new Date();
  return Object.assign(user, overrides);
}

function makeTenant(overrides: Partial<{ isActive: boolean }> = {}): Tenant {
  return new Tenant(
    'tenant-1', 'HamBurgos', 'hamburgos',
    overrides.isActive ?? true,
    new Date(), SaasPlan.BASICO,
    true, true, true, true, true,
    false,
    OrderNumberResetPeriod.DAILY, null,
  );
}

function makePlan(): Plan {
  return {
    id:          SaasPlan.BASICO,
    displayName: 'Básico',
    limits: { maxBranches: 1, maxCashiers: 2, maxProducts: 50, kitchenEnabled: false },
  } as Plan;
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userRepo: MockProxy<UserRepositoryPort>;
  let tenantRepo: MockProxy<TenantRepositoryPort>;
  let planLimitService: MockProxy<PlanLimitService>;
  let jwtService: MockProxy<JwtService>;

  beforeEach(() => {
    userRepo         = mock<UserRepositoryPort>();
    tenantRepo       = mock<TenantRepositoryPort>();
    planLimitService = mock<PlanLimitService>();
    jwtService       = mock<JwtService>();
    useCase          = new LoginUseCase(userRepo, tenantRepo, planLimitService, jwtService);

    // Happy-path defaults
    userRepo.findByEmailGlobal.mockResolvedValue(makeUser());
    tenantRepo.findById.mockResolvedValue(makeTenant());
    planLimitService.getPlan.mockResolvedValue(makePlan());
    jwtService.sign.mockReturnValue('signed-token');
  });

  it('devuelve accessToken con credenciales correctas', async () => {
    const result = await useCase.execute({ email: 'admin@hamburgos.com', password: PASSWORD });
    expect(result.accessToken).toBe('signed-token');
  });

  it('lanza UnauthorizedException con contraseña incorrecta', async () => {
    await expect(useCase.execute({ email: 'admin@hamburgos.com', password: 'wrong' }))
      .rejects.toThrow(UnauthorizedException);
  });

  it('lanza UnauthorizedException si el usuario está inactivo', async () => {
    userRepo.findByEmailGlobal.mockResolvedValue(makeUser({ isActive: false }));
    await expect(useCase.execute({ email: 'admin@hamburgos.com', password: PASSWORD }))
      .rejects.toThrow(UnauthorizedException);
  });

  it('lanza ForbiddenException si el tenant está inactivo', async () => {
    tenantRepo.findById.mockResolvedValue(makeTenant({ isActive: false }));
    await expect(useCase.execute({ email: 'admin@hamburgos.com', password: PASSWORD }))
      .rejects.toThrow(ForbiddenException);
  });

  it('el payload del JWT contiene sub, tenantId, branchId y role', async () => {
    await useCase.execute({ email: 'admin@hamburgos.com', password: PASSWORD });
    expect(jwtService.sign).toHaveBeenCalledWith(expect.objectContaining({
      sub:      'user-1',
      tenantId: 'tenant-1',
      branchId: null,
      role:     UserRole.OWNER,
    }));
  });
});
