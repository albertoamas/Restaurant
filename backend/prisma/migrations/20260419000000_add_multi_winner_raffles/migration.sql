-- Migration: add_multi_winner_raffles
-- Replaces single-winner model with multiple winners per raffle.
-- Safe: no raffle rows exist in production (only customers and orders).

-- 1. Remove old single-winner columns from raffles.
--    Dropping a column auto-drops its FK constraints in PostgreSQL.
ALTER TABLE raffles DROP COLUMN IF EXISTS prize_description;
ALTER TABLE raffles DROP COLUMN IF EXISTS winner_customer_id;
ALTER TABLE raffles DROP COLUMN IF EXISTS winner_ticket_id;
ALTER TABLE raffles DROP COLUMN IF EXISTS drawn_at;

-- 2. Add number_of_winners (how many positions this raffle will draw).
ALTER TABLE raffles ADD COLUMN number_of_winners INTEGER NOT NULL DEFAULT 1;

-- 3. raffle_prizes: one row per position per raffle, defined at creation time.
CREATE TABLE raffle_prizes (
  id               VARCHAR(36)  NOT NULL,
  raffle_id        VARCHAR(36)  NOT NULL,
  position         INTEGER      NOT NULL,
  prize_description VARCHAR(500) NOT NULL,
  CONSTRAINT raffle_prizes_pkey PRIMARY KEY (id),
  CONSTRAINT raffle_prizes_raffle_id_fkey
    FOREIGN KEY (raffle_id) REFERENCES raffles(id) ON DELETE CASCADE,
  CONSTRAINT raffle_prizes_raffle_id_position_key
    UNIQUE (raffle_id, position)
);

-- 4. raffle_winners: one row per drawn position per raffle.
--    ticket_id is UNIQUE globally: a ticket can only win once across all raffles.
--    (raffle_id, position) is UNIQUE: each place is awarded exactly once.
CREATE TABLE raffle_winners (
  id               VARCHAR(36)  NOT NULL,
  tenant_id        VARCHAR(36)  NOT NULL,
  raffle_id        VARCHAR(36)  NOT NULL,
  customer_id      VARCHAR(36)  NOT NULL,
  ticket_id        VARCHAR(36)  NOT NULL,
  position         INTEGER      NOT NULL,
  prize_description VARCHAR(500),
  drawn_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT raffle_winners_pkey PRIMARY KEY (id),
  CONSTRAINT raffle_winners_ticket_id_key
    UNIQUE (ticket_id),
  CONSTRAINT raffle_winners_raffle_id_position_key
    UNIQUE (raffle_id, position),
  CONSTRAINT raffle_winners_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT raffle_winners_raffle_id_fkey
    FOREIGN KEY (raffle_id) REFERENCES raffles(id) ON DELETE CASCADE,
  CONSTRAINT raffle_winners_customer_id_fkey
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT raffle_winners_ticket_id_fkey
    FOREIGN KEY (ticket_id) REFERENCES raffle_tickets(id) ON DELETE CASCADE
);

CREATE INDEX raffle_winners_tenant_id_raffle_id_idx
  ON raffle_winners(tenant_id, raffle_id);
