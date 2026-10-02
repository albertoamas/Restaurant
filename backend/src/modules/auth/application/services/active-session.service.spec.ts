import { UnauthorizedException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { ActiveSessionService } from './active-session.service';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { Tenant } from '../../../tenant/domain/entities/tenant.entity';
import { User } from '../../domain/entities/user.entity';

const payload = { sub: 'u1', tenantId: 't1', branchId: 'branch-del-token', role: 'CASHIER' };

describe('ActiveSessionService', () => {
  let service: ActiveSessionService;
  let tenantRepo: MockProxy<TenantRepositoryPort>;
  let userRepo: MockProxy<UserRepositoryPort>;

  const tenant = (isActive: boolean) => ({ isActive } as Tenant);
  const user = (isActive: boolean, branchId: string | null = 'branch-bd') => ({ isActive, branchId } as User);

  beforeEach(() => {
    tenantRepo = mock<TenantRepositoryPort>();
    userRepo   = mock<UserRepositoryPort>();
    service    = new ActiveSessionService(tenantRepo, userRepo);
    tenantRepo.findById.mockResolvedValue(tenant(true));
    userRepo.findById.mockResolvedValue(user(true));
  });

  it('toma la sucursal de la BD, no la del token', async () => {
    await expect(service.resolve(payload)).resolves.toMatchObject({ sub: 'u1', branchId: 'branch-bd' });
  });

  it('rechaza un negocio suspendido', async () => {
    tenantRepo.findById.mockResolvedValue(tenant(false));
    await expect(service.resolve(payload)).rejects.toThrow(new UnauthorizedException('Cuenta suspendida'));
  });

  it('rechaza un usuario inactivo o borrado', async () => {
    userRepo.findById.mockResolvedValue(null);
    await expect(service.resolve(payload)).rejects.toThrow(new UnauthorizedException('Usuario inactivo'));
  });

  it('usa la caché dentro de los 60 s', async () => {
    await service.resolve(payload);
    await service.resolve(payload);
    expect(tenantRepo.findById).toHaveBeenCalledTimes(1);
    expect(userRepo.findById).toHaveBeenCalledTimes(1);
  });

  it('forgetUser hace que una desactivación rija al instante', async () => {
    await service.resolve(payload);
    userRepo.findById.mockResolvedValue(user(false));
    service.forgetUser('u1');
    await expect(service.resolve(payload)).rejects.toThrow(UnauthorizedException);
  });

  it('forgetTenant hace que una suspensión rija al instante', async () => {
    await service.resolve(payload);
    tenantRepo.findById.mockResolvedValue(tenant(false));
    service.forgetTenant('t1');
    await expect(service.resolve(payload)).rejects.toThrow(UnauthorizedException);
  });
});
