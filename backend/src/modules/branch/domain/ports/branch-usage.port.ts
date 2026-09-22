export const BRANCH_USAGE_PORT = 'BranchUsagePort';

/**
 * Lecturas de otros agregados que la sucursal necesita para decidir si puede
 * desactivarse.
 *
 * Vive como puerto propio de BranchModule en lugar de inyectar
 * `UserRepositoryPort` / `CashSessionRepositoryPort`: esos módulos ya importan
 * BranchModule (para validar la sucursal), así que traerlos acá crearía una
 * dependencia circular de módulos.
 */
export interface BranchUsagePort {
  /** Cajeros activos asignados a esta sucursal. */
  countActiveCashiers(tenantId: string, branchId: string): Promise<number>;

  /** ¿Hay una sesión de caja abierta en esta sucursal? */
  hasOpenCashSession(tenantId: string, branchId: string): Promise<boolean>;
}
