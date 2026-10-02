import { SaasPlan, isUnlimited, type PlanDto } from '@pos/shared';
import type { TenantModules } from '../../api/admin.api';
import { Badge } from '../ui/Badge';

/** "-1 = sin límite" vive en @pos/shared; aquí solo se le da formato. */
export function limitLabel(n: number): string {
  return isUnlimited(n) ? 'Sin límite' : String(n);
}

/** Espacio en MB con la unidad que se lee mejor: "100 MB", "1 GB", "5 GB". */
export function storageLabel(mb: number): string {
  if (isUnlimited(mb)) return 'Sin límite';
  return mb >= 1024 && mb % 1024 === 0 ? `${mb / 1024} GB` : `${mb} MB`;
}

export const PLAN_ORDER: SaasPlan[] = [SaasPlan.BASICO, SaasPlan.PRO, SaasPlan.NEGOCIO];

const PLAN_LABEL: Record<SaasPlan, string> = {
  [SaasPlan.BASICO]:  'Básico',
  [SaasPlan.PRO]:     'Pro',
  [SaasPlan.NEGOCIO]: 'Negocio',
};

/** Básico neutro, Pro y Negocio con el color de marca (Negocio con punto: el nivel más alto). */
export function PlanBadge({ plan }: { plan: SaasPlan }) {
  return (
    <Badge variant={plan === SaasPlan.BASICO ? 'neutral' : 'info'} dot={plan === SaasPlan.NEGOCIO}>
      {PLAN_LABEL[plan] ?? plan}
    </Badge>
  );
}

export const MODULE_DEFS: { key: keyof TenantModules; label: string; description: string }[] = [
  { key: 'ordersEnabled',          label: 'Pedidos',            description: 'Pantalla de pedidos y sus estados' },
  { key: 'cashEnabled',            label: 'Caja',               description: 'Abrir y cerrar caja con el efectivo esperado' },
  { key: 'teamEnabled',            label: 'Equipo',             description: 'Cajeros y la sucursal de cada uno' },
  { key: 'branchesEnabled',        label: 'Sucursales',         description: 'Administrar varios locales' },
  { key: 'kitchenEnabled',         label: 'Cocina',             description: 'Pantalla de pedidos para la cocina' },
  { key: 'rafflesEnabled',         label: 'Sorteos',            description: 'Sorteos y tickets para clientes' },
  { key: 'advancedReportsEnabled', label: 'Reportes avanzados', description: 'Caja, productos y clientes en reportes' },
];

/**
 * Lo que el plan trae por sí solo. Misma regla que `PlanModulesService.baseModules` del backend:
 * pedidos y caja siempre; sucursales y equipo según sus límites; el resto, sus flags.
 */
export function planModules(plan: PlanDto): TenantModules {
  return {
    ordersEnabled:          true,
    cashEnabled:            true,
    branchesEnabled:        plan.maxBranches !== 1,
    teamEnabled:            plan.maxCashiers !== 0,
    kitchenEnabled:         plan.kitchenEnabled,
    rafflesEnabled:         plan.rafflesEnabled,
    advancedReportsEnabled: plan.advancedReports,
  };
}
