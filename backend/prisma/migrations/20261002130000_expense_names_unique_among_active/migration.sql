-- El nombre de una categoría o de un gasto predefinido es único solo entre los activos.
--
-- POR QUE
-- Eliminar es una baja lógica (is_active = false) y la fila sigue ocupando su nombre: renombrar
-- "Gastos operativos" a "Operativos" respondía "Ya existe una categoría con el nombre
-- Operativos" cuando esa "Operativos" estaba eliminada. Crear sí funcionaba (reactiva la fila
-- eliminada), renombrar no tenía salida.
--
-- Mismo patrón que raffle_winners (índice parcial WHERE voided = false). Prisma no representa
-- índices parciales: en schema.prisma queda un @@index normal y un comentario.
--
-- SEGURIDAD DE LOS DATOS
-- - No cambia ninguna fila. Hoy no hay duplicados (el índice anterior los impedía), así que los
--   índices nuevos se crean sin conflicto.
-- - Los gastos registrados apuntan a su categoría por id, no por nombre: no se ven afectados.

DROP INDEX IF EXISTS "expense_categories_tenant_id_name_key";
DROP INDEX IF EXISTS "expense_concepts_tenant_id_name_key";

CREATE UNIQUE INDEX "expense_categories_tenant_name_active"
  ON "expense_categories"("tenant_id", "name") WHERE ("is_active" = true);
CREATE UNIQUE INDEX "expense_concepts_tenant_name_active"
  ON "expense_concepts"("tenant_id", "name") WHERE ("is_active" = true);

-- Búsqueda por nombre (incluye eliminados, para reactivarlos al crear).
CREATE INDEX "expense_categories_tenant_id_name_idx" ON "expense_categories"("tenant_id", "name");
CREATE INDEX "expense_concepts_tenant_id_name_idx" ON "expense_concepts"("tenant_id", "name");
