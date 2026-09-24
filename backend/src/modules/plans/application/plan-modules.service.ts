import { Injectable } from '@nestjs/common';
import { Plan } from '../domain/entities/plan.entity';
import { TenantModules } from '../../tenant/domain/entities/tenant.entity';

/**
 * Flags que el admin fijó a mano como excepción por encima del plan.
 * Solo aparecen las claves que tocó: el resto se deriva siempre del plan.
 */
export type ModuleOverrides = Partial<TenantModules>;

const OVERRIDABLE_MODULES = [
  'ordersEnabled',
  'cashEnabled',
  'teamEnabled',
  'branchesEnabled',
  'kitchenEnabled',
  'rafflesEnabled',
  'advancedReportsEnabled',
] as const satisfies readonly (keyof TenantModules)[];

/**
 * Un módulo que falte en la lista de arriba se ignoraría en silencio: el admin
 * guardaría su excepción y el sistema la descartaría al resolver. Esto rompe el
 * build nombrando el que falte.
 */
type ModulosSinCubrir = Exclude<keyof TenantModules, (typeof OVERRIDABLE_MODULES)[number]>;
const _todosLosModulosCubiertos: [ModulosSinCubrir] extends [never]
  ? true
  : ['Falta agregar estos módulos a OVERRIDABLE_MODULES:', ModulosSinCubrir] = true;
void _todosLosModulosCubiertos;

/**
 * El plan es la fuente de verdad de los módulos; los overrides son excepciones
 * que el admin concede por encima (una cortesía, una prueba, una negociación).
 *
 * Por qué importa: antes, cambiar el plan de un tenant pisaba los flags con los
 * valores del plan, así que una cortesía concedida a mano se perdía en silencio
 * en el siguiente cambio de plan. Separando "lo que da el plan" de "lo que
 * concedió el admin", ambas cosas conviven.
 */
@Injectable()
export class PlanModulesService {
  /** Lo que el plan otorga por sí solo, sin excepciones aplicadas. */
  baseModules(plan: Plan): TenantModules {
    return {
      // Núcleo del producto: un POS sin pedidos ni caja no es un POS. No se
      // venden por plan; siguen siendo apagables a mano como interruptor de
      // emergencia vía override.
      ordersEnabled:   true,
      cashEnabled:     true,
      // Se deriva del límite en vez de duplicarlo como flag: si el plan solo
      // permite una sucursal, la pantalla de sucursales no aporta nada.
      branchesEnabled: plan.maxBranches !== 1,
      teamEnabled:     plan.teamEnabled,
      kitchenEnabled:  plan.kitchenEnabled,
      rafflesEnabled:  plan.rafflesEnabled,
      advancedReportsEnabled: plan.advancedReports,
    };
  }

  /** Valor efectivo = lo que da el plan, con las excepciones del admin encima. */
  resolveModules(plan: Plan, overrides: ModuleOverrides | null | undefined): TenantModules {
    const base = this.baseModules(plan);
    if (!overrides) return base;

    const resolved = { ...base };
    for (const key of OVERRIDABLE_MODULES) {
      const value = overrides[key];
      if (typeof value === 'boolean') resolved[key] = value;
    }
    return resolved;
  }

  /**
   * Descarta las excepciones que ya coinciden con lo que da el plan.
   *
   * Una excepción solo significa algo mientras difiere del plan. Si se dejaran,
   * se acumularían para siempre: al subir de plan una excepción quedaría
   * redundante, y al bajar volvería a imponerse aunque el admin nunca la pidió
   * para ese plan.
   */
  pruneOverrides(plan: Plan, overrides: ModuleOverrides | null | undefined): ModuleOverrides {
    const base = this.baseModules(plan);
    const next: ModuleOverrides = {};

    for (const key of OVERRIDABLE_MODULES) {
      const value = overrides?.[key];
      if (typeof value === 'boolean' && value !== base[key]) next[key] = value;
    }
    return next;
  }

  /**
   * Traduce un cambio del admin a overrides persistibles: lo que coincide con
   * el plan deja de ser excepción y se borra, para que ese módulo vuelva a
   * seguir al plan en futuros cambios.
   */
  mergeOverrides(
    plan: Plan,
    current: ModuleOverrides | null | undefined,
    requested: Partial<TenantModules>,
  ): ModuleOverrides {
    const base = this.baseModules(plan);
    const next: ModuleOverrides = { ...(current ?? {}) };

    for (const key of OVERRIDABLE_MODULES) {
      const value = requested[key];
      if (typeof value !== 'boolean') continue;

      if (value === base[key]) delete next[key];
      else next[key] = value;
    }
    return next;
  }
}
