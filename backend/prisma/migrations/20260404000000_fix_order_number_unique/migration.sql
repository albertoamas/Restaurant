-- Drop the unique constraint on (tenant_id, order_number) that prevented
-- daily order number resets per branch. Order numbers are sequential per
-- branch per day and do not need global uniqueness across the tenant.
DROP INDEX IF EXISTS "orders_tenant_id_order_number_key";

-- Replace with a plain index for query performance
CREATE INDEX IF NOT EXISTS "orders_tenant_id_order_number_idx" ON "orders"("tenant_id", "order_number");
