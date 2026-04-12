-- ─────────────────────────────────────────────────────────────────────────────
-- M2: Secuencias atómicas de número de orden por branch/periodo
--
-- Reemplaza el patrón MAX(order_number)+1 que tiene race condition.
-- La columna `period` almacena:
--   - 'YYYY-MM-DD'  cuando resetPeriod = DAILY
--   - 'YYYY-MM'     cuando resetPeriod = MONTHLY
--
-- El INSERT ... ON CONFLICT DO UPDATE ... RETURNING es atómico en PostgreSQL:
-- garantiza que dos requests concurrentes nunca obtengan el mismo número.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE branch_order_sequences (
  tenant_id   TEXT    NOT NULL,
  branch_id   TEXT    NOT NULL,
  period      TEXT    NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT branch_order_sequences_pkey
    PRIMARY KEY (tenant_id, branch_id, period),

  CONSTRAINT branch_order_sequences_tenant_fkey
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Backfill: poblar desde las órdenes existentes.
-- Para cada combinación tenant/branch/día-Bolivia calculamos el MAX order_number.
-- Esto garantiza que el próximo número generado sea mayor que cualquier existente.

INSERT INTO branch_order_sequences (tenant_id, branch_id, period, last_number)
SELECT
  tenant_id,
  branch_id,
  DATE(created_at AT TIME ZONE 'America/La_Paz')::text AS period,
  MAX(order_number)                                     AS last_number
FROM orders
GROUP BY
  tenant_id,
  branch_id,
  DATE(created_at AT TIME ZONE 'America/La_Paz')
ON CONFLICT (tenant_id, branch_id, period) DO UPDATE
  SET last_number = EXCLUDED.last_number;
