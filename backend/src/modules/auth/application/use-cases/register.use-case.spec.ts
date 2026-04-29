import { ConflictException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import * as bcrypt from 'bcryptjs';
import { RegisterUseCase } from './register.use-case';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { User } from '../../domain/entities/user.entity';
import { Tenant } from '../../../tenant/domain/entities/tenant.entity';

const DTO = {
  email: 'owner@empresa.com',
  password: 'secret123',
  ownerName: 'Juan Pérez',
  businessName: 'Mi Restaurante',
};

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let userRepo: MockProxy<UserRepositoryPort>;
  let tenantRepo: MockProxy<TenantRepositoryPort>;

  beforeEach(() => {
    userRepo   = mock<UserRepositoryPort>();
    tenantRepo = mock<TenantRepositoryPort>();
    useCase    = new RegisterUseCase(userRepo, tenantRepo);

    userRepo.findByEmailGlobal.mockResolvedValue(null);
    userRepo.save.mockResolvedValue({} as User);
    tenantRepo.save.mockResolvedValue({} as Tenant);
  });

  it('crea tenant y usuario correctamente', async () => {
    const result = await useCase.execute(DTO);
    expect(tenantRepo.save).toHaveBeenCalledTimes(1);
    expect(userRepo.save).toHaveBeenCalledTimes(1);
    expect(result.message).toContain('creado');
  });

  it('retorna el tenantId en la respuesta', async () => {
    const result = await useCase.execute(DTO);
    expect(result.tenantId).toBeDefined();
    expect(typeof result.tenantId).toBe('string');
  });

  it('lanza ConflictException si el email ya está en uso', async () => {
    userRepo.findByEmailGlobal.mockResolvedValue({} as User);
    await expect(useCase.execute(DTO)).rejects.toThrow(ConflictException);
    expect(tenantRepo.save).not.toHaveBeenCalled();
    expect(userRepo.save).not.toHaveBeenCalled();
  });

  it('el password se hashea antes de guardarse (no en claro)', async () => {
    await useCase.execute(DTO);
    const savedUser: User = userRepo.save.mock.calls[0][0];
    expect(savedUser.passwordHash).not.toBe(DTO.password);
    const matches = await bcrypt.compare(DTO.password, savedUser.passwordHash);
    expect(matches).toBe(true);
  });

  it('con startActive=true crea el tenant activo', async () => {
    await useCase.execute(DTO, true);
    const savedTenant: Tenant = tenantRepo.save.mock.calls[0][0];
    expect(savedTenant.isActive).toBe(true);
  });

  it('sin startActive el tenant se crea inactivo por defecto', async () => {
    await useCase.execute(DTO);
    const savedTenant: Tenant = tenantRepo.save.mock.calls[0][0];
    expect(savedTenant.isActive).toBe(false);
  });
});
