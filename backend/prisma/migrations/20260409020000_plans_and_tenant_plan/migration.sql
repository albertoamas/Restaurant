-- Create plans table (editable by admin)
CREATE TABLE IF NOT EXISTS plans (
  id              TEXT        PRIMARY KEY,
  display_name    TEXT        NOT NULL,
  price_bs        DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_branches    INTEGER     NOT NULL DEFAULT 1,
  max_cashiers    INTEGER     NOT NULL DEFAULT 2,
  max_products    INTEGER     NOT NULL DEFAULT 80,
  kitchen_enabled BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Seed default plans (idempotent)
INSERT INTO plans (id, display_name, price_bs, max_branches, max_cashiers, max_products, kitchen_enabled)
VALUES
  ('BASICO',  'Básico',  220,  1,   2,   80, false),
  ('PRO',     'Pro',     399,  3,   8,   -1, true),
  ('NEGOCIO', 'Negocio', 790, -1,  -1,   -1, true)
ON CONFLICT (id) DO NOTHING;

-- Add plan column to tenants (default BASICO for all existing tenants)
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'BASICO';
