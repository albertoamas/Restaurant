-- Add voided column
ALTER TABLE "raffle_winners" ADD COLUMN "voided" BOOLEAN NOT NULL DEFAULT FALSE;

-- Drop old unique constraints (replaced by partial indexes below)
ALTER TABLE "raffle_winners" DROP CONSTRAINT IF EXISTS "raffle_winners_ticket_id_key";
ALTER TABLE "raffle_winners" DROP CONSTRAINT IF EXISTS "raffle_winners_raffle_id_position_key";

-- Partial unique indexes: only one active (non-voided) winner per position per raffle,
-- and only one active winner per ticket.
CREATE UNIQUE INDEX "raffle_winners_raffle_position_active"
  ON "raffle_winners"("raffle_id", "position") WHERE (voided = false);

CREATE UNIQUE INDEX "raffle_winners_ticket_active"
  ON "raffle_winners"("ticket_id") WHERE (voided = false);
