-- Índice compuesto para reportes filtrados por sucursal + fecha
-- Cubre: getDailyReport, getReportByRange, getTopProducts, getTopCustomers con branchId
CREATE INDEX IF NOT EXISTS "orders_tenant_branch_created_idx"
  ON "orders" ("tenant_id", "branch_id", "created_at");

-- Índice en order_items.order_id para acelerar los JOINs al cargar ítems de una orden
-- (PostgreSQL no crea índices automáticamente para FKs, a diferencia de MySQL)
CREATE INDEX IF NOT EXISTS "order_items_order_id_idx"
  ON "order_items" ("order_id");
