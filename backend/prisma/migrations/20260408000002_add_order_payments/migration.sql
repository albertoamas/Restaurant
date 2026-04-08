CREATE TABLE "order_payments" (
  "id"        TEXT           NOT NULL DEFAULT gen_random_uuid()::text,
  "order_id"  TEXT           NOT NULL,
  "tenant_id" TEXT           NOT NULL,
  "method"    TEXT           NOT NULL,
  "amount"    DECIMAL(10,2)  NOT NULL,

  CONSTRAINT "order_payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "order_payments_order_id_fkey"
    FOREIGN KEY ("order_id")  REFERENCES "orders"("id")  ON DELETE CASCADE,
  CONSTRAINT "order_payments_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
);

CREATE INDEX "order_payments_order_id_idx" ON "order_payments"("order_id");

-- Backfill: one row per existing order using its payment_method and total
INSERT INTO "order_payments" ("id", "order_id", "tenant_id", "method", "amount")
SELECT gen_random_uuid()::text, "id", "tenant_id", "payment_method", "total"
FROM "orders";
