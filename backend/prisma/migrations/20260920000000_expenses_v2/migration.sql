-- Expenses V2 is deliberately additive. Existing rows and relationships are preserved.
ALTER TABLE "expenses"
  ADD COLUMN "expense_date" TIMESTAMP(3),
  ADD COLUMN "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "payment_method" VARCHAR(30),
  ADD COLUMN "supplier_name" VARCHAR(150),
  ADD COLUMN "document_number" VARCHAR(80),
  ADD COLUMN "voided_at" TIMESTAMP(3),
  ADD COLUMN "voided_by" TEXT,
  ADD COLUMN "void_reason" VARCHAR(255);

-- Preserve the operational date of every historical expense.
UPDATE "expenses" SET "expense_date" = "created_at" WHERE "expense_date" IS NULL;
ALTER TABLE "expenses" ALTER COLUMN "expense_date" SET NOT NULL;
ALTER TABLE "expenses" ALTER COLUMN "expense_date" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "expense_items" ADD COLUMN "unit" VARCHAR(20);

CREATE INDEX "expenses_tenant_id_branch_id_expense_date_idx"
  ON "expenses"("tenant_id", "branch_id", "expense_date");
CREATE INDEX "expenses_tenant_id_status_expense_date_idx"
  ON "expenses"("tenant_id", "status", "expense_date");
