-- ─────────────────────────────────────────────────────────────────────────────
-- M1: Integridad — CHECK constraints + FK plan + índices faltantes
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. CHECK constraints: orders ─────────────────────────────────────────────

ALTER TABLE orders
  ADD CONSTRAINT orders_type_check
  CHECK (type IN ('DINE_IN', 'TAKEOUT', 'DELIVERY'));

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('PENDING', 'PREPARING', 'DELIVERED', 'CANCELLED'));

ALTER TABLE orders
  ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IS NULL OR payment_method IN ('CASH', 'QR', 'TRANSFER'));

-- ── 2. CHECK constraints: users ──────────────────────────────────────────────

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('OWNER', 'CASHIER'));

-- ── 3. CHECK constraints: cash_sessions ──────────────────────────────────────

ALTER TABLE cash_sessions
  ADD CONSTRAINT cash_sessions_status_check
  CHECK (status IN ('OPEN', 'CLOSED'));

-- ── 4. CHECK constraints: expenses ───────────────────────────────────────────

ALTER TABLE expenses
  ADD CONSTRAINT expenses_category_check
  CHECK (category IN ('SUPPLIES', 'WAGES', 'UTILITIES', 'TRANSPORT', 'MAINTENANCE', 'OTHER'));

-- ── 5. FK: tenants.plan → plans(id) ──────────────────────────────────────────
-- La migración manual 20260409020000 no añadió este FK; lo agregamos ahora.
-- El bloque DO $$ es idempotente: si ya existe no falla.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'tenants'::regclass
      AND conname  = 'tenants_plan_fkey'
  ) THEN
    ALTER TABLE tenants
      ADD CONSTRAINT tenants_plan_fkey
      FOREIGN KEY (plan) REFERENCES plans(id);
  END IF;
END$$;

-- ── 6. Índices faltantes ──────────────────────────────────────────────────────

-- order_items: el FK order_id no tiene índice — cada JOIN de ítems hace full scan
CREATE INDEX IF NOT EXISTS order_items_order_id_idx
  ON order_items(order_id);

-- users: listados por tenant y por branch
CREATE INDEX IF NOT EXISTS users_tenant_id_idx
  ON users(tenant_id);

-- Partial index: solo los cashiers tienen branch_id asignado
CREATE INDEX IF NOT EXISTS users_branch_id_idx
  ON users(branch_id)
  WHERE branch_id IS NOT NULL;

-- branches: listado de locales por tenant
CREATE INDEX IF NOT EXISTS branches_tenant_id_idx
  ON branches(tenant_id);
