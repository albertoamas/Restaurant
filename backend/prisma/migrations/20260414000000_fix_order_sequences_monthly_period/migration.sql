-- ─────────────────────────────────────────────────────────────────────────────
-- Fix: el backfill de branch_order_sequences usó siempre formato YYYY-MM-DD
-- sin respetar el orderNumberResetPeriod del tenant.
--
-- Para tenants MONTHLY, el código busca period 'YYYY-MM' pero el backfill
-- anterior creó entradas con 'YYYY-MM-DD', provocando que el primer día de
-- uso tras el backfill empiece desde #1 en lugar de continuar desde el máximo.
--
-- Esta migración:
--  1. Elimina las entradas diarias incorrectas para tenants MONTHLY
--  2. Reinserta las entradas en formato mensual con el MAX correcto
--     usando GREATEST para no perder números ya generados hoy.
-- ─────────────────────────────────────────────────────────────────────────────

-- Paso 1: borrar entradas diarias (YYYY-MM-DD) de tenants MONTHLY
DELETE FROM branch_order_sequences bos
WHERE LENGTH(bos.period) = 10   -- formato YYYY-MM-DD
  AND EXISTS (
    SELECT 1 FROM tenants t
    WHERE t.id = bos.tenant_id
      AND t.order_number_reset_period = 'MONTHLY'
  );

-- Paso 2: insertar/actualizar entradas mensuales correctas
INSERT INTO branch_order_sequences (tenant_id, branch_id, period, last_number)
SELECT
  o.tenant_id,
  o.branch_id,
  TO_CHAR(DATE(o.created_at AT TIME ZONE 'America/La_Paz'), 'YYYY-MM') AS period,
  MAX(o.order_number) AS last_number
FROM orders o
JOIN tenants t ON t.id = o.tenant_id
WHERE t.order_number_reset_period = 'MONTHLY'
GROUP BY
  o.tenant_id,
  o.branch_id,
  TO_CHAR(DATE(o.created_at AT TIME ZONE 'America/La_Paz'), 'YYYY-MM')
ON CONFLICT (tenant_id, branch_id, period) DO UPDATE
  SET last_number = GREATEST(EXCLUDED.last_number, branch_order_sequences.last_number);
