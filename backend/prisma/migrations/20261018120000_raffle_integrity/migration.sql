-- Integridad de sorteos. Solo EXPAND: columnas nulas y una tabla nueva, seguro de correr sobre datos
-- de producción y compatible con el contenedor anterior durante el deploy.

-- 1. Auditoría de la anulación de ganadores (quién, cuándo y por qué).
ALTER TABLE "raffle_winners"
  ADD COLUMN "voided_at"   TIMESTAMPTZ(3),
  ADD COLUMN "voided_by"   TEXT,
  ADD COLUMN "void_reason" VARCHAR(500);

-- 2. Aporte de cada pedido al gasto acumulado de un sorteo SPENDING_THRESHOLD.
--    Los acumulados ya existentes en customer_raffle_spending no se reconstruyen: sus pedidos no
--    tienen fila aquí y, al cancelarse, ya no restan gasto (antes restaban aunque nunca hubieran sumado).
CREATE TABLE "raffle_order_spending" (
  "id"          TEXT           NOT NULL,
  "tenant_id"   TEXT           NOT NULL,
  "raffle_id"   TEXT           NOT NULL,
  "customer_id" TEXT           NOT NULL,
  "order_id"    TEXT           NOT NULL,
  "amount"      DECIMAL(10,2)  NOT NULL,
  "created_at"  TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "raffle_order_spending_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "raffle_order_spending_raffle_id_order_id_key"
  ON "raffle_order_spending"("raffle_id", "order_id");

CREATE INDEX "raffle_order_spending_tenant_id_order_id_idx"
  ON "raffle_order_spending"("tenant_id", "order_id");

ALTER TABLE "raffle_order_spending"
  ADD CONSTRAINT "raffle_order_spending_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "raffle_order_spending_raffle_id_fkey"
    FOREIGN KEY ("raffle_id") REFERENCES "raffles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "raffle_order_spending_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "raffle_order_spending_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
