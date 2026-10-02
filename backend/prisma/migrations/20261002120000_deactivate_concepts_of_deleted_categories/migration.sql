-- Desactiva los gastos predefinidos que siguen activos en una categoría eliminada.
--
-- POR QUE
-- Eliminar una categoría solo la marcaba inactiva: sus gastos quedaban activos pero ocultos
-- (la lista filtra por categoría activa) y su nombre seguía ocupado por el índice único
-- (tenant_id, name). Crear de nuevo un gasto con ese nombre respondía "Ya existe un gasto
-- predefinido llamado ...". Desde esta versión, eliminar una categoría desactiva también sus
-- gastos; esto alinea los datos ya existentes.
--
-- SEGURIDAD DE LOS DATOS
-- - Solo toca gastos predefinidos que hoy no se ven en ninguna pantalla.
-- - Es una baja lógica: los gastos registrados conservan su vínculo y su copia del nombre.
-- - Idempotente: volver a correrla no cambia nada.
UPDATE "expense_concepts" AS c
SET    "is_active" = false
FROM   "expense_categories" AS cat
WHERE  cat."id" = c."category_id"
  AND  cat."tenant_id" = c."tenant_id"
  AND  cat."is_active" = false
  AND  c."is_active" = true;
