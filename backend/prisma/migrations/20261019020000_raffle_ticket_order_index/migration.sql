-- Cada conciliación de un pedido (crear, agregar productos, cambiar cliente, cancelar) busca sus
-- tickets por negocio y pedido. Sin este índice la búsqueda recorre todos los tickets del negocio.
-- Solo EXPAND: un índice no cambia datos ni rompe al contenedor anterior.
CREATE INDEX IF NOT EXISTS "raffle_tickets_tenant_id_order_id_idx" ON "raffle_tickets"("tenant_id", "order_id");
