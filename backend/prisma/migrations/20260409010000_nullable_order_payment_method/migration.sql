-- Make payment_method nullable to support deferred payment ("cobrar después")
ALTER TABLE orders ALTER COLUMN payment_method DROP NOT NULL;
