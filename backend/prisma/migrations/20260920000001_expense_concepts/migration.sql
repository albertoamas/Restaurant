CREATE TABLE "expense_concepts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "unit" VARCHAR(20),
    "default_unit_price" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expense_concepts_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "expense_items" ADD COLUMN "concept_id" TEXT;

CREATE UNIQUE INDEX "expense_concepts_tenant_id_name_key" ON "expense_concepts"("tenant_id", "name");
CREATE INDEX "expense_concepts_tenant_id_category_id_is_active_idx" ON "expense_concepts"("tenant_id", "category_id", "is_active");
CREATE INDEX "expense_items_concept_id_idx" ON "expense_items"("concept_id");

ALTER TABLE "expense_concepts" ADD CONSTRAINT "expense_concepts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "expense_concepts" ADD CONSTRAINT "expense_concepts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "expense_items" ADD CONSTRAINT "expense_items_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "expense_concepts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
