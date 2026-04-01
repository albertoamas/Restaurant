-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "customer_id" TEXT;

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "points" INTEGER NOT NULL DEFAULT 0,
    "is_raffle_winner" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customers_tenant_id_name_idx" ON "customers"("tenant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenant_id_phone_key" ON "customers"("tenant_id", "phone");

-- CreateIndex
CREATE INDEX "orders_tenant_id_customer_id_idx" ON "orders"("tenant_id", "customer_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
