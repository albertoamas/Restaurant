import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UpdateModulesDto } from './update-modules.dto';
import { Tenant, TenantModules } from '../../../tenant/domain/entities/tenant.entity';
import { OrderNumberResetPeriod, SaasPlan } from '@pos/shared';

/**
 * El ValidationPipe global corre con `forbidNonWhitelisted`, así que un módulo
 * que exista en el dominio pero falte en el DTO hace que `PATCH
 * /admin/tenants/:id/modules` responda 400 al intentar tocarlo — con el toggle
 * ya visible en el panel de admin. El guard de tipos de `update-modules.dto.ts`
 * lo detecta en compilación; esto lo verifica en runtime.
 */
function allModuleKeys(): (keyof TenantModules)[] {
  const tenant = Tenant.reconstitute({
    id: 't', name: 'T', slug: 't', isActive: true, createdAt: new Date(),
    plan: SaasPlan.BASICO,
    modules: {
      ordersEnabled: true, cashEnabled: true, teamEnabled: true,
      branchesEnabled: true, kitchenEnabled: true, rafflesEnabled: true,
      advancedReportsEnabled: true,
    },
    orderNumberResetPeriod: OrderNumberResetPeriod.DAILY,
  });
  return Object.keys(tenant.modules) as (keyof TenantModules)[];
}

describe('UpdateModulesDto', () => {
  it('acepta todos los módulos del dominio, uno por uno', () => {
    for (const key of allModuleKeys()) {
      const dto = plainToInstance(UpdateModulesDto, { [key]: true });
      expect({ key, errors: validateSync(dto) }).toEqual({ key, errors: [] });
      expect(dto[key]).toBe(true);
    }
  });

  it('rechaza un valor que no sea booleano', () => {
    const dto = plainToInstance(UpdateModulesDto, { rafflesEnabled: 'sí' });
    expect(validateSync(dto)).not.toHaveLength(0);
  });

  it('acepta un body vacío (todos los campos son opcionales)', () => {
    expect(validateSync(plainToInstance(UpdateModulesDto, {}))).toEqual([]);
  });
});
