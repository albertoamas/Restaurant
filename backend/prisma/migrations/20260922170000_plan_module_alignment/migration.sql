-- Alinea los modulos del tenant con su plan.
--
-- POR QUE
-- Habia dos sistemas de permisos que no se hablaban: el plan (tabla `plans`) definia
-- limites y un par de flags que ningun guard leia, y los 6 flags de `tenants` decidian
-- el acceso real. Cambiar de plan no daba ni quitaba acceso de forma consistente, y una
-- cortesia concedida a mano (p.ej. sorteos en BASICO) se perdia en el siguiente cambio
-- de plan, porque se sobreescribia con el valor del plan.
--
-- DISENO
-- Las 6 columnas booleanas de `tenants` siguen siendo el valor EFECTIVO: el ModuleGuard
-- y el login las leen igual que antes, asi que el camino caliente de lectura no cambia
-- y esta migracion no puede romper el acceso de nadie.
-- Lo nuevo es `module_overrides`: registra SOLO los flags que el admin fijo a mano como
-- excepcion. Al cambiar de plan se recalcula `efectivo = plan + overrides`, de modo que
-- las cortesias sobreviven y el resto sigue al plan.
--
-- SEGURIDAD DE LOS DATOS
-- El backfill del final compara el estado actual de cada tenant contra lo que su plan
-- le daria y guarda las diferencias como override. Es decir: ningun cliente existente
-- gana ni pierde un modulo por esta migracion; solo se deja registrado cuales de sus
-- valores actuales fueron una decision explicita.

-- ── 1. Dimensiones nuevas del plan ────────────────────────────────────────────
-- Los DEFAULT dejan a los planes existentes en un estado permisivo (nada se apaga)
-- hasta que el UPDATE del paso 2 les asigne su valor real.
ALTER TABLE "plans"
  ADD COLUMN IF NOT EXISTS "team_enabled"        BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "advanced_reports"    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "report_history_days" INTEGER NOT NULL DEFAULT -1,
  ADD COLUMN IF NOT EXISTS "max_storage_mb"      INTEGER NOT NULL DEFAULT -1;

-- ── 2. Valores por plan ───────────────────────────────────────────────────────
-- Solo se tocan las columnas NUEVAS. `max_branches`, `max_cashiers`, `max_products`,
-- `kitchen_enabled` y `raffles_enabled` se dejan como estan: el admin pudo haberlos
-- ajustado desde /admin y esta migracion no debe pisar esa decision.
UPDATE "plans" SET "team_enabled" = false, "advanced_reports" = false, "report_history_days" = 90,  "max_storage_mb" = 100  WHERE "id" = 'BASICO';
UPDATE "plans" SET "team_enabled" = true,  "advanced_reports" = true,  "report_history_days" = 365, "max_storage_mb" = 1024 WHERE "id" = 'PRO';
UPDATE "plans" SET "team_enabled" = true,  "advanced_reports" = true,  "report_history_days" = -1,  "max_storage_mb" = 5120 WHERE "id" = 'NEGOCIO';

-- ── 3. Overrides por tenant ───────────────────────────────────────────────────
ALTER TABLE "tenants"
  ADD COLUMN IF NOT EXISTS "module_overrides" JSONB;

-- ── 4. Backfill: preservar el acceso actual de cada cliente ───────────────────
-- Para cada tenant se calcula lo que su plan le daria y se guarda como override todo
-- flag cuyo valor actual difiera. Un tenant que ya coincide con su plan queda en NULL.
-- La base que se compara debe ser identica a PlanModulesService.resolveModules():
--   ordersEnabled / cashEnabled -> siempre true (nucleo del producto)
--   branchesEnabled             -> el plan permite mas de una sucursal
--   teamEnabled / kitchenEnabled / rafflesEnabled -> del plan
UPDATE "tenants" t
SET "module_overrides" = src."overrides"
FROM (
  SELECT
    t2."id",
    jsonb_strip_nulls(jsonb_build_object(
      'ordersEnabled',   CASE WHEN t2."orders_enabled"   IS DISTINCT FROM true                     THEN to_jsonb(t2."orders_enabled")   END,
      'cashEnabled',     CASE WHEN t2."cash_enabled"     IS DISTINCT FROM true                     THEN to_jsonb(t2."cash_enabled")     END,
      'branchesEnabled', CASE WHEN t2."branches_enabled" IS DISTINCT FROM (p."max_branches" <> 1)  THEN to_jsonb(t2."branches_enabled") END,
      'teamEnabled',     CASE WHEN t2."team_enabled"     IS DISTINCT FROM p."team_enabled"         THEN to_jsonb(t2."team_enabled")     END,
      'kitchenEnabled',  CASE WHEN t2."kitchen_enabled"  IS DISTINCT FROM p."kitchen_enabled"      THEN to_jsonb(t2."kitchen_enabled")  END,
      'rafflesEnabled',  CASE WHEN t2."raffles_enabled"  IS DISTINCT FROM p."raffles_enabled"      THEN to_jsonb(t2."raffles_enabled")  END
    )) AS "overrides"
  FROM "tenants" t2
  JOIN "plans" p ON p."id" = t2."plan"
) src
WHERE t."id" = src."id"
  AND src."overrides" <> '{}'::jsonb;
