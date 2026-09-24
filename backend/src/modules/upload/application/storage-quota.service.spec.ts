import { ForbiddenException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { OrderNumberResetPeriod, SaasPlan } from '@pos/shared';
import { StorageQuotaService } from './storage-quota.service';
import { TenantRepositoryPort } from '../../tenant/domain/ports/tenant-repository.port';
import { PlanRepositoryPort } from '../../plans/domain/ports/plan-repository.port';
import { Tenant } from '../../tenant/domain/entities/tenant.entity';
import { Plan } from '../../plans/domain/entities/plan.entity';
import { basicoPlan } from '../../plans/domain/entities/plan.fixture';

const TENANT_ID = 'tenant-1';
const MB = 1024 * 1024;

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

/** BASICO con cuota reducida para que el test no tenga que escribir 100 MB. */
function makePlan(maxStorageMb: number): Plan {
  return basicoPlan({ maxStorageMb });
}

describe('StorageQuotaService', () => {
  let service: StorageQuotaService;
  let tenantRepo: MockProxy<TenantRepositoryPort>;
  let planRepo: MockProxy<PlanRepositoryPort>;
  let sandbox: string;
  let cwdSpy: jest.SpyInstance;

  beforeEach(async () => {
    tenantRepo = mock<TenantRepositoryPort>();
    planRepo   = mock<PlanRepositoryPort>();
    service    = new StorageQuotaService(tenantRepo, planRepo);

    tenantRepo.findById.mockResolvedValue(makeTenant());
    planRepo.findById.mockResolvedValue(makePlan(1));

    // El servicio resuelve rutas desde process.cwd(); se apunta a un temporal
    // para no tocar la carpeta real de uploads.
    sandbox = join(tmpdir(), `quota-spec-${Date.now()}`);
    await mkdir(join(sandbox, 'uploads', TENANT_ID), { recursive: true });
    cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(sandbox);
  });

  afterEach(async () => {
    cwdSpy.mockRestore();
    await rm(sandbox, { recursive: true, force: true });
  });

  describe('usedBytes', () => {
    it('devuelve 0 si el tenant todavía no subió nada', async () => {
      await expect(service.usedBytes('tenant-sin-carpeta')).resolves.toBe(0);
    });

    it('suma el tamaño de los archivos del tenant', async () => {
      await writeFile(join(sandbox, 'uploads', TENANT_ID, 'a.webp'), Buffer.alloc(1000));
      await writeFile(join(sandbox, 'uploads', TENANT_ID, 'b.webp'), Buffer.alloc(2500));
      await expect(service.usedBytes(TENANT_ID)).resolves.toBe(3500);
    });

    it('no cuenta lo que hay en la carpeta de otro tenant', async () => {
      await mkdir(join(sandbox, 'uploads', 'otro'), { recursive: true });
      await writeFile(join(sandbox, 'uploads', 'otro', 'x.webp'), Buffer.alloc(5000));
      await expect(service.usedBytes(TENANT_ID)).resolves.toBe(0);
    });
  });

  describe('assertFits', () => {
    it('deja pasar si entra en la cuota', async () => {
      await expect(service.assertFits(TENANT_ID, 500)).resolves.toBeUndefined();
    });

    it('rechaza si el archivo nuevo excede la cuota', async () => {
      await expect(service.assertFits(TENANT_ID, 2 * MB)).rejects.toThrow(ForbiddenException);
    });

    it('cuenta lo ya usado, no solo el archivo entrante', async () => {
      await writeFile(join(sandbox, 'uploads', TENANT_ID, 'grande.webp'), Buffer.alloc(MB - 100));
      // 100 bytes libres: 500 no entran aunque por sí solos sean minúsculos.
      await expect(service.assertFits(TENANT_ID, 500)).rejects.toThrow(/ya usaste/);
    });

    it('-1 en el plan significa sin límite', async () => {
      planRepo.findById.mockResolvedValue(makePlan(-1));
      await expect(service.assertFits(TENANT_ID, 500 * MB)).resolves.toBeUndefined();
    });

    it('lanza si el tenant no existe', async () => {
      tenantRepo.findById.mockResolvedValue(null);
      await expect(service.assertFits(TENANT_ID, 1)).rejects.toThrow(ForbiddenException);
    });
  });
});
