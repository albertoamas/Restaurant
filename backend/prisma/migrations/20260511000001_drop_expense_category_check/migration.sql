-- Drop the hardcoded enum CHECK constraint so category accepts any string value.
-- Required after migrating from fixed ExpenseCategory enum to dynamic expense_categories table.
ALTER TABLE "expenses" DROP CONSTRAINT IF EXISTS "expenses_category_check";
