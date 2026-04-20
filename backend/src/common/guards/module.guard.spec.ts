import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { mock, MockProxy } from 'jest-mock-extended';
import { ModuleGuard } from './module.guard';
import { TenantRepositoryPort } from '../../modules/tenant/domain/ports/tenant-repository.port';
import { Tenant } from '../../modules/tenant/domain/entities/tenant.entity';
import { MODULE_FLAGS_KEY } from '../decorators/module-flags.decorator';
import { SaasPlan, OrderNumberResetPeriod } from '@pos/shared';

function makeTenant(rafflesEnabled = false, ordersEnabled = true): Tenant {
  return new Tenant(
    'tenant-1', 'Test', 'test', true, new Date(), SaasPlan.BASICO,
    ordersEnabled, true, true, true, false, rafflesEnabled,
    OrderNumberResetPeriod.DAILY, null, null, null, null,
  );
}

function makeCtx(flags: string[] | undefined, tenantId = 'tenant-1'): ExecutionContext {
  const ctx = mock<ExecutionContext>();
  ctx.getHandler.mockReturnValue(() => {});
  ctx.getClass.mockReturnValue(class {});
  ctx.switchToHttp.mockReturnValue({
    getRequest: () => ({ user: { tenantId } }),
  } as any);
  return ctx;
}

describe('ModuleGuard', () => {
  let guard: ModuleGuard;
  let reflector: MockProxy<Reflector>;
  let tenantRepo: MockProxy<TenantRepositoryPort>;

  beforeEach(() => {
    reflector   = mock<Reflector>();
    tenantRepo  = mock<TenantRepositoryPort>();
    guard       = new ModuleGuard(reflector, tenantRepo);
  });

  it('pasa cuando no hay metadata @RequiresModule', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = makeCtx(undefined);

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(tenantRepo.findById).not.toHaveBeenCalled();
  });

  it('pasa cuando el array de flags está vacío', async () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    const ctx = makeCtx([]);

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(tenantRepo.findById).not.toHaveBeenCalled();
  });

  it('pasa cuando el flag requerido está activo en el tenant', async () => {
    reflector.getAllAndOverride.mockReturnValue(['ordersEnabled']);
    tenantRepo.findById.mockResolvedValue(makeTenant(false, true));
    const ctx = makeCtx(['ordersEnabled']);

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('lanza ForbiddenException cuando el flag está desactivado', async () => {
    reflector.getAllAndOverride.mockReturnValue(['rafflesEnabled']);
    tenantRepo.findById.mockResolvedValue(makeTenant(false)); // rafflesEnabled=false
    const ctx = makeCtx(['rafflesEnabled']);

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('lanza ForbiddenException cuando el tenant no existe en DB', async () => {
    reflector.getAllAndOverride.mockReturnValue(['ordersEnabled']);
    tenantRepo.findById.mockResolvedValue(null);
    const ctx = makeCtx(['ordersEnabled']);

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });
});
