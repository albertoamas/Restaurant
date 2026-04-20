BEGIN;
ALTER TABLE "raffle_winners" ADD COLUMN "voided" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "raffle_winners" DROP CONSTRAINT "raffle_winners_ticket_id_key";
ALTER TABLE "raffle_winners" DROP CONSTRAINT "raffle_winners_raffle_id_position_key";
CREATE UNIQUE INDEX "raffle_winners_raffle_position_active" ON "raffle_winners"("raffle_id", "position") WHERE (voided = false);
CREATE UNIQUE INDEX "raffle_winners_ticket_active" ON "raffle_winners"("ticket_id") WHERE (voided = false);
COMMIT;
