-- El módulo Equipo pasa a derivarse de `max_cashiers`, no de `plans.team_enabled`.
--
-- POR QUE
-- El plan BÁSICO vendía `max_cashiers = 2` y a la vez traía `team_enabled = false`.
-- Como `POST /auth/users` exige `@RequiresModule('teamEnabled')`, un cliente en
-- BÁSICO recibía 403 al intentar crear el primer cajero: el plan cobraba algo
-- que la app no dejaba usar. La palanca comercial real es CUÁNTOS cajeros
-- entran, no si la pantalla existe — mismo criterio que ya usa
-- `branchesEnabled`, que se deriva de `max_branches`.
--
-- SEGURIDAD DE LOS DATOS
-- Solo concede acceso, nunca lo quita. Y borra el override de `teamEnabled`
-- donde quedó registrado, porque ya no es una excepción: ahora es lo que el
-- plan otorga por sí solo. Dejarlo convertiría una regla general en una
-- cortesía individual que el próximo cambio de plan tendría que arrastrar.

-- 1. Los tres planes habilitan Equipo; el límite lo sigue poniendo max_cashiers.
UPDATE "plans" SET "team_enabled" = true WHERE "max_cashiers" <> 0;

-- 2. Valor efectivo en los tenants que hoy lo tienen apagado por su plan.
UPDATE "tenants" t
SET "team_enabled" = true
FROM "plans" p
WHERE p."id" = t."plan"
  AND p."max_cashiers" <> 0
  AND t."team_enabled" = false;

-- 3. El override de teamEnabled deja de tener sentido: coincide con el plan.
UPDATE "tenants"
SET "module_overrides" = NULLIF("module_overrides" - 'teamEnabled', '{}'::jsonb)
WHERE "module_overrides" ? 'teamEnabled';
