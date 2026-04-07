-- AlterTable
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "tickets_delivered" INTEGER NOT NULL DEFAULT 0;
