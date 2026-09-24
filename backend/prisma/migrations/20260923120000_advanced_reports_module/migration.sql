-- Convierte los reportes avanzados en un módulo gobernado por el plan.
--
-- POR QUE
-- `plans.advanced_reports` ya existía desde la Fase 4 pero no lo leía ningún
-- guard: era una columna editable que no hacía cumplir nada. Para aplicarla hace
-- falta el flag efectivo a nivel tenant, igual que cocina o sorteos, para que
-- ModuleGuard lo lea sin calcular y el admin pueda conceder excepciones.
--
-- SEGURIDAD DE LOS DATOS
-- Hoy TODOS los tenants ven todas las pestañas de reportes. Si se derivara del
-- plan sin más, los BASICO perderían el acceso de golpe. El backfill de abajo
-- registra el acceso actual como excepción del admin, igual que hizo la
-- migración de la Fase 4: ningún cliente existente pierde nada, y el cambio
-- comercial se aplica solo a los negocios nuevos.
-- Para empezar a cobrarlo a un cliente existente, basta con revocarle la
-- excepción desde /admin (o borrar su clave del JSON).

ALTER TABLE "tenants"
  ADD COLUMN IF NOT EXISTS "advanced_reports_enabled" BOOLEAN NOT NULL DEFAULT false;

-- Estado efectivo actual: todos tenían reportes completos.
UPDATE "tenants" SET "advanced_reports_enabled" = true;

-- Y se deja registrado como excepción en los planes que no lo incluyen, para que
-- un resync posterior no se lo quite.
UPDATE "tenants" t
SET "module_overrides" =
      COALESCE(t."module_overrides", '{}'::jsonb) || '{"advancedReportsEnabled": true}'::jsonb
FROM "plans" p
WHERE p."id" = t."plan"
  AND p."advanced_reports" = false;
