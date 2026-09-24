import { SaasPlan } from '@pos/shared';
import { Plan, PlanProps } from './plan.entity';

/**
 * SOLO PARA SPECS. No importar desde código de producción: los planes reales
 * viven en la tabla `plans` y los lee `PlanRepository`.
 *
 * Existe porque los mismos tres planes se construían a mano en seis specs, y
 * cada campo nuevo obligaba a editarlos todos. Los valores siguen a los del
 * seed para que los tests razonen sobre los planes que el cliente ve.
 */
const BASE: Record<SaasPlan, PlanProps> = {
  [SaasPlan.BASICO]: {
    displayName: 'Básico', priceBs: 220,
    maxBranches: 1, maxCashiers: 2, maxProducts: 80,
    kitchenEnabled: false, rafflesEnabled: false, teamEnabled: false,
    advancedReports: false, reportHistoryDays: 90, maxStorageMb: 100,
  },
  [SaasPlan.PRO]: {
    displayName: 'Pro', priceBs: 399,
    maxBranches: 3, maxCashiers: 8, maxProducts: -1,
    kitchenEnabled: true, rafflesEnabled: true, teamEnabled: true,
    advancedReports: true, reportHistoryDays: 365, maxStorageMb: 1024,
  },
  [SaasPlan.NEGOCIO]: {
    displayName: 'Negocio', priceBs: 790,
    maxBranches: -1, maxCashiers: -1, maxProducts: -1,
    kitchenEnabled: true, rafflesEnabled: true, teamEnabled: true,
    advancedReports: true, reportHistoryDays: -1, maxStorageMb: 5120,
  },
};

/** Un plan del catálogo, con los campos que el test necesite cambiar. */
export function makePlan(id: SaasPlan, overrides: Partial<PlanProps> = {}): Plan {
  return new Plan(id, { ...BASE[id], ...overrides });
}

export const basicoPlan  = (o: Partial<PlanProps> = {}) => makePlan(SaasPlan.BASICO, o);
export const proPlan     = (o: Partial<PlanProps> = {}) => makePlan(SaasPlan.PRO, o);
export const negocioPlan = (o: Partial<PlanProps> = {}) => makePlan(SaasPlan.NEGOCIO, o);
