-- Add module flags to tenants table
-- Controlled exclusively by the SaaS admin from the /admin panel

ALTER TABLE "tenants"
  ADD COLUMN IF NOT EXISTS "orders_enabled"   BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "cash_enabled"     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "team_enabled"     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "branches_enabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "kitchen_enabled"  BOOLEAN NOT NULL DEFAULT false;
