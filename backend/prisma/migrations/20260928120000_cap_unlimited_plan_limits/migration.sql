-- Reemplaza "sin límite" por topes reales en los límites que consumen recursos.
--
-- POR QUE
-- `-1` en productos, sucursales y cajeros dejaba dos riesgos abiertos:
--  - Técnico: el POS carga el catálogo entero en la pantalla del cajero. Miles
--    de productos degradan la operación antes que la base de datos.
--  - Comercial: una cadena de 40 locales pagaría lo mismo que una de 4.
-- Los topes son generosos para el cliente típico y cierran ambos casos.
--
-- `report_history_days` sigue en -1 para NEGOCIO: son los datos del propio
-- cliente y consultarlos no compromete a nadie más. `max_storage_mb` ya tenía
-- topes reales en los tres planes.
--
-- SEGURIDAD DE LOS DATOS
-- - Solo cambia valores que siguen en -1. Si el admin ya ajustó alguno a mano
--   desde /admin, se respeta.
-- - No toca ningún dato de tenants. Un cliente que hoy supere un tope conserva
--   todo lo que tiene; PlanLimitService solo le impide crear más, que es la
--   política de downgrade de siempre.
-- - Idempotente: correrla dos veces no cambia nada.

UPDATE "plans" SET "max_products" = 500
WHERE "id" = 'PRO' AND "max_products" = -1;

UPDATE "plans" SET "max_branches" = 10
WHERE "id" = 'NEGOCIO' AND "max_branches" = -1;

UPDATE "plans" SET "max_cashiers" = 30
WHERE "id" = 'NEGOCIO' AND "max_cashiers" = -1;

UPDATE "plans" SET "max_products" = 2000
WHERE "id" = 'NEGOCIO' AND "max_products" = -1;
