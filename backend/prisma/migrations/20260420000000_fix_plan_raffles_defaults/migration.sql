-- PRO and NEGOCIO are premium tiers that include raffle functionality.
-- Fix: set raffles_enabled = true for these plans so that plan-to-tenant
-- sync (UpdateTenantPlanUseCase) correctly activates the module on upgrade.
UPDATE "plans" SET "raffles_enabled" = true WHERE id IN ('PRO', 'NEGOCIO');
