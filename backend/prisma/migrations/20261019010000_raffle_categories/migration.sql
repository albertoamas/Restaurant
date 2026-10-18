-- Sorteos por categorías. Solo EXPAND: tabla nueva; los sorteos por producto existentes no cambian.
CREATE TABLE "raffle_categories" (
  "raffle_id"   TEXT NOT NULL,
  "category_id" TEXT NOT NULL,
  "tenant_id"   TEXT NOT NULL,

  CONSTRAINT "raffle_categories_pkey" PRIMARY KEY ("raffle_id", "category_id")
);

CREATE INDEX "raffle_categories_tenant_id_category_id_idx"
  ON "raffle_categories"("tenant_id", "category_id");

ALTER TABLE "raffle_categories"
  ADD CONSTRAINT "raffle_categories_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "raffle_categories_raffle_id_fkey"
    FOREIGN KEY ("raffle_id") REFERENCES "raffles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "raffle_categories_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
