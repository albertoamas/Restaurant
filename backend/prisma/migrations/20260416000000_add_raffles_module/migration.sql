-- AlterTable: rename tickets_delivered to total_tickets on customers
ALTER TABLE "customers" RENAME COLUMN "tickets_delivered" TO "total_tickets";

-- AlterTable: add raffles_enabled to plans
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "raffles_enabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: add raffles_enabled to tenants
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "raffles_enabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: raffles
CREATE TABLE IF NOT EXISTS "raffles" (
    "id"                 TEXT         NOT NULL,
    "tenant_id"          TEXT         NOT NULL,
    "name"               VARCHAR(255) NOT NULL,
    "description"        VARCHAR(500),
    "status"             TEXT         NOT NULL DEFAULT 'ACTIVE',
    "prize_description"  VARCHAR(500),
    "winner_customer_id" TEXT,
    "drawn_at"           TIMESTAMP(3),
    "created_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "raffles_pkey" PRIMARY KEY ("id")
);

-- CreateTable: raffle_tickets
CREATE TABLE IF NOT EXISTS "raffle_tickets" (
    "id"            TEXT         NOT NULL,
    "tenant_id"     TEXT         NOT NULL,
    "raffle_id"     TEXT         NOT NULL,
    "customer_id"   TEXT         NOT NULL,
    "ticket_number" INTEGER      NOT NULL,
    "order_id"      TEXT,
    "is_delivered"  BOOLEAN      NOT NULL DEFAULT false,
    "delivered_at"  TIMESTAMP(3),
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "raffle_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "raffles_tenant_id_status_idx" ON "raffles"("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "raffle_tickets_tenant_id_raffle_id_idx" ON "raffle_tickets"("tenant_id", "raffle_id");
CREATE INDEX IF NOT EXISTS "raffle_tickets_tenant_id_customer_id_idx" ON "raffle_tickets"("tenant_id", "customer_id");
CREATE UNIQUE INDEX IF NOT EXISTS "raffle_tickets_raffle_id_ticket_number_key" ON "raffle_tickets"("raffle_id", "ticket_number");

-- AddForeignKey
ALTER TABLE "raffles" ADD CONSTRAINT "raffles_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "raffles" ADD CONSTRAINT "raffles_winner_customer_id_fkey"
    FOREIGN KEY ("winner_customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "raffle_tickets" ADD CONSTRAINT "raffle_tickets_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "raffle_tickets" ADD CONSTRAINT "raffle_tickets_raffle_id_fkey"
    FOREIGN KEY ("raffle_id") REFERENCES "raffles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "raffle_tickets" ADD CONSTRAINT "raffle_tickets_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "raffle_tickets" ADD CONSTRAINT "raffle_tickets_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
