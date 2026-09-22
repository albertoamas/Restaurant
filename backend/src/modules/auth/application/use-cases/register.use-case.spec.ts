import { ConflictException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import * as bcrypt from 'bcryptjs';
import { RegisterUseCase, slugify } from './register.use-case';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { TenantRepositoryPort } from '../../../tenant/domain/ports/tenant-repository.port';
import { User } from '../../domain/entities/user.entity';
import { Tenant } from '../../../tenant/domain/entities/tenant.entity';
import { PlanRepositoryPort } from '../../../plans/domain/ports/plan-repository.port';
import { PlanModulesService } from '../../../plans/application/plan-modules.service';
import { Plan } from '../../../plans/domain/entities/plan.entity';
import { SaasPlan } from '@pos/shared';

const DTO = {
  email: 'owner@empresa.com',
  password: 'secret123',
  ownerName: 'Juan Pérez',
  businessName: 'Mi Restaurante',
};

// ── slugify ──────────────────────────────────────────────────────────────────

describe('slugify', () => {
  it('convierte a minúsculas y separa palabras con guiones', () => {
    expect(slugify('Mi Restaurante')).toBe('mi-restaurante');
  });

  it('translitera acentos y eñes en vez de eliminarlos', () => {
    expect(slugify('Café Ñandú')).toBe('cafe-nandu');
  });

  it('elimina emojis y símbolos sin dejar guiones colgando', () => {
    expect(slugify('Pollos 🍗🔥')).toBe('pollos');
  });

  it('cae al fallback "negocio" si no queda ningún caracter latino', () => {
    expect(slugify('🍗🔥🎉')).toBe('negocio');
  });

  it('colapsa espacios múltiples y guiones repetidos', () => {
    expect(slugify('Mi   Restaurante -- Favorito')).toBe('mi-restaurante-favorito');
  });

  it('recorta guiones al principio y al final', () => {
    expect(slugify('  -Pollos-  ')).toBe('pollos');
  });
});

// ── RegisterUseCase ──────────────────────────────────────────────────────────

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let userRepo: MockProxy<UserRepositoryPort>;
  let tenantRepo: MockProxy<TenantRepositoryPort>;
  let planRepo: MockProxy<PlanRepositoryPort>;

  beforeEach(() => {
    userRepo   = mock<UserRepositoryPort>();
    tenantRepo = mock<TenantRepositoryPort>();
    planRepo   = mock<PlanRepositoryPort>();
    // PlanModulesService es lógica pura sin dependencias: se usa la real para
    // que el test cubra de verdad la derivación de módulos desde el plan.
    useCase    = new RegisterUseCase(userRepo, tenantRepo, planRepo, new PlanModulesService());

    planRepo.findById.mockResolvedValue(
      new Plan(SaasPlan.BASICO, 'Básico', 220, 1, 2, 80, false, false, false, false, 90, 100),
    );
    userRepo.findByEmailGlobal.mockResolvedValue(null);
    tenantRepo.findBySlug.mockResolvedValue(null); // slug libre por defecto
    tenantRepo.createTenantWithOwner.mockResolvedValue({} as Tenant);
  });

  it('crea el tenant, el dueño y la sucursal en una sola llamada transaccional', async () => {
    const result = await useCase.execute(DTO);

    expect(tenantRepo.createTenantWithOwner).toHaveBeenCalledTimes(1);
    expect(result.message).toContain('creado');
    expect(result.tenantId).toEqual(expect.any(String));
  });

  it('lanza ConflictException si el email ya está en uso', async () => {
    userRepo.findByEmailGlobal.mockResolvedValue({} as User);
    await expect(useCase.execute(DTO)).rejects.toThrow(ConflictException);
    expect(tenantRepo.createTenantWithOwner).not.toHaveBeenCalled();
  });

  it('el password se hashea antes de guardarse (no en claro)', async () => {
    await useCase.execute(DTO);
    const [, owner] = tenantRepo.createTenantWithOwner.mock.calls[0];
    expect(owner.passwordHash).not.toBe(DTO.password);
    expect(await bcrypt.compare(DTO.password, owner.passwordHash)).toBe(true);
  });

  it('con startActive=true crea el tenant activo', async () => {
    await useCase.execute(DTO, true);
    const [tenant] = tenantRepo.createTenantWithOwner.mock.calls[0];
    expect(tenant.isActive).toBe(true);
  });

  it('sin startActive el tenant se crea inactivo por defecto', async () => {
    await useCase.execute(DTO);
    const [tenant] = tenantRepo.createTenantWithOwner.mock.calls[0];
    expect(tenant.isActive).toBe(false);
  });

  it('usa "Principal" como nombre de sucursal si no se especifica', async () => {
    await useCase.execute(DTO);
    const [, , branchName] = tenantRepo.createTenantWithOwner.mock.calls[0];
    expect(branchName).toBe('Principal');
  });

  it('usa "Principal" si branchName llega vacío o solo con espacios', async () => {
    await useCase.execute({ ...DTO, branchName: '   ' });
    const [, , branchName] = tenantRepo.createTenantWithOwner.mock.calls[0];
    expect(branchName).toBe('Principal');
  });

  it('respeta el branchName dado, recortando espacios', async () => {
    await useCase.execute({ ...DTO, branchName: '  Sucursal Centro  ' });
    const [, , branchName] = tenantRepo.createTenantWithOwner.mock.calls[0];
    expect(branchName).toBe('Sucursal Centro');
  });

  it('los módulos del tenant nuevo salen del plan, no de constantes fijas', async () => {
    // BASICO: sin equipo, sin cocina, sin sorteos, y una sola sucursal.
    await useCase.execute(DTO);

    const [tenant] = tenantRepo.createTenantWithOwner.mock.calls[0];
    expect(tenant.modules).toEqual({
      ordersEnabled:   true,
      cashEnabled:     true,
      branchesEnabled: false, // maxBranches = 1
      teamEnabled:     false,
      kitchenEnabled:  false,
      rafflesEnabled:  false,
    });
    expect(tenant.moduleOverrides).toBeNull();
  });

  it('un plan más generoso da más módulos al tenant nuevo', async () => {
    planRepo.findById.mockResolvedValue(
      new Plan(SaasPlan.PRO, 'Pro', 399, 3, 8, -1, true, true, true, true, 365, 1024),
    );

    await useCase.execute(DTO);

    const [tenant] = tenantRepo.createTenantWithOwner.mock.calls[0];
    expect(tenant.modules).toMatchObject({
      branchesEnabled: true,
      teamEnabled:     true,
      kitchenEnabled:  true,
      rafflesEnabled:  true,
    });
  });

  it('usa el slug base cuando está libre', async () => {
    await useCase.execute(DTO);
    const [tenant] = tenantRepo.createTenantWithOwner.mock.calls[0];
    expect(tenant.slug).toBe('mi-restaurante');
  });

  it('agrega sufijo -2 si el slug base ya existe', async () => {
    tenantRepo.findBySlug.mockImplementation(async (slug) =>
      slug === 'mi-restaurante' ? ({} as Tenant) : null,
    );

    await useCase.execute(DTO);

    const [tenant] = tenantRepo.createTenantWithOwner.mock.calls[0];
    expect(tenant.slug).toBe('mi-restaurante-2');
  });

  it('agrega sufijo -3 si el slug base y -2 ya existen (colisión doble)', async () => {
    const taken = new Set(['mi-restaurante', 'mi-restaurante-2']);
    tenantRepo.findBySlug.mockImplementation(async (slug) =>
      taken.has(slug) ? ({} as Tenant) : null,
    );

    await useCase.execute(DTO);

    const [tenant] = tenantRepo.createTenantWithOwner.mock.calls[0];
    expect(tenant.slug).toBe('mi-restaurante-3');
  });

  it('reintenta con un slug nuevo si createTenantWithOwner falla por P2002 (carrera)', async () => {
    // findBySlug ve "mi-restaurante" libre y arranca la transacción, pero otra
    // alta lo tomó justo antes del INSERT -> la BD responde P2002. Al reintentar,
    // findBySlug ya lo ve tomado (se simula agregándolo al set al fallar) y
    // resuelve el siguiente sufijo libre.
    const taken = new Set<string>();
    tenantRepo.findBySlug.mockImplementation(async (slug) => (taken.has(slug) ? ({} as Tenant) : null));

    let createCalls = 0;
    tenantRepo.createTenantWithOwner.mockImplementation(async (tenant) => {
      createCalls++;
      if (createCalls === 1) {
        taken.add(tenant.slug); // la otra alta gana la carrera y confirma su INSERT
        const err = new Error('Unique constraint failed on the fields: (`slug`)');
        (err as unknown as { code: string }).code = 'P2002';
        throw err;
      }
      return {} as Tenant;
    });

    const result = await useCase.execute(DTO);

    expect(createCalls).toBe(2);
    const [finalTenant] = tenantRepo.createTenantWithOwner.mock.calls[1];
    expect(finalTenant.slug).toBe('mi-restaurante-2');
    expect(result.message).toContain('creado');
  });

  it('relanza el error tal cual si no es una colisión de slug (P2002)', async () => {
    tenantRepo.createTenantWithOwner.mockRejectedValue(new Error('DB caída'));
    await expect(useCase.execute(DTO)).rejects.toThrow('DB caída');
    expect(tenantRepo.createTenantWithOwner).toHaveBeenCalledTimes(1);
  });

  it('agotados los reintentos lanza ConflictException en español, no el P2002 crudo', async () => {
    // HttpExceptionFilter solo atrapa HttpException: si escapara el P2002 de
    // Prisma, el cliente vería un 500 sin mensaje útil.
    const p2002 = new Error('Unique constraint failed on the fields: (`slug`)');
    (p2002 as unknown as { code: string }).code = 'P2002';
    tenantRepo.createTenantWithOwner.mockRejectedValue(p2002);

    await expect(useCase.execute(DTO)).rejects.toThrow(ConflictException);
    await expect(useCase.execute(DTO)).rejects.toThrow(/identificador único/);
    expect(tenantRepo.createTenantWithOwner).toHaveBeenCalledTimes(6); // 3 intentos x 2 llamadas
  });
});
