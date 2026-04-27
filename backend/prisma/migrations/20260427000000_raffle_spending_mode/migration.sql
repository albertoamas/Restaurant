-- Fase 1: Modo de asignación de tickets y umbral de gasto acumulativo
-- Todos los sorteos existentes quedan con ticket_mode = 'PRODUCT_MATCH' por el DEFAULT.
-- spending_threshold es NULL para sorteos existentes — no los afecta.

ALTER TABLE raffles
  ADD COLUMN IF NOT EXISTS ticket_mode        TEXT NOT NULL DEFAULT 'PRODUCT_MATCH',
  ADD COLUMN IF NOT EXISTS spending_threshold INTEGER;

-- Tabla de seguimiento del gasto acumulado por cliente por sorteo.
-- Un registro por par (raffle_id, customer_id); se actualiza por upsert.
CREATE TABLE IF NOT EXISTS customer_raffle_spending (
  id           TEXT          NOT NULL,
  tenant_id    TEXT          NOT NULL,
  raffle_id    TEXT          NOT NULL,
  customer_id  TEXT          NOT NULL,
  total_spent  DECIMAL(10,2) NOT NULL DEFAULT 0,

  CONSTRAINT pk_customer_raffle_spending
    PRIMARY KEY (id),

  CONSTRAINT uq_customer_raffle_spending
    UNIQUE (raffle_id, customer_id),

  CONSTRAINT fk_crs_tenant
    FOREIGN KEY (tenant_id)  REFERENCES tenants(id)    ON DELETE CASCADE,

  CONSTRAINT fk_crs_raffle
    FOREIGN KEY (raffle_id)  REFERENCES raffles(id)    ON DELETE CASCADE,

  CONSTRAINT fk_crs_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_crs_tenant_raffle
  ON customer_raffle_spending (tenant_id, raffle_id);
