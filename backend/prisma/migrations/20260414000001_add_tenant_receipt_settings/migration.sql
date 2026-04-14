-- Add receipt/contact settings to tenants table.
-- These fields replace the localStorage-only approach in the frontend,
-- allowing settings to sync across devices on login.

ALTER TABLE tenants
  ADD COLUMN business_address VARCHAR(255),
  ADD COLUMN business_phone   VARCHAR(50),
  ADD COLUMN receipt_slogan   VARCHAR(255);
