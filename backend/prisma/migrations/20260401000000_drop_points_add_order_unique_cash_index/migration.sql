-- AlterTable
ALTER TABLE "customers" DROP COLUMN "points";

-- CreateIndex
CREATE INDEX "cash_sessions_tenant_id_branch_id_idx" ON "cash_sessions"("tenant_id", "branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_tenant_id_order_number_key" ON "orders"("tenant_id", "order_number");
