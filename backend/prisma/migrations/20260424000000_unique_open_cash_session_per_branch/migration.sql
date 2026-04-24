-- Garantiza que solo puede existir una caja abierta por sucursal en un momento dado.
-- Un índice PARCIAL (WHERE status = 'OPEN') ignora las filas cerradas, permitiendo
-- que una sucursal tenga múltiples sesiones históricas sin violar la restricción.
-- Esta es la defensa definitiva contra la race condition en OpenCashSessionUseCase:
-- incluso si dos requests pasan el check en la aplicación de forma simultánea,
-- solo el primer INSERT tiene éxito; el segundo recibe P2002 (unique violation).
CREATE UNIQUE INDEX "uq_one_open_session_per_branch"
  ON "cash_sessions" ("tenant_id", "branch_id")
  WHERE "status" = 'OPEN';
