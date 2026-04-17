-- AlterTable: add product_id to raffles
ALTER TABLE "raffles" ADD COLUMN IF NOT EXISTS "product_id" TEXT;

-- AddForeignKey
ALTER TABLE "raffles" ADD CONSTRAINT "raffles_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "raffles_tenant_id_product_id_idx" ON "raffles"("tenant_id", "product_id");
