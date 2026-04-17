-- Remove denormalized ticket counter from customers.
-- The count is now computed via COUNT on raffle_tickets at query time.
ALTER TABLE "customers" DROP COLUMN IF EXISTS "total_tickets";

-- Add referential integrity for the winner ticket pointer on raffles.
ALTER TABLE "raffles" ADD CONSTRAINT "raffles_winner_ticket_id_fkey"
  FOREIGN KEY ("winner_ticket_id") REFERENCES "raffle_tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
