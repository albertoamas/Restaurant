-- Ampliar el CHECK constraint de orders.payment_method para incluir CORTESIA
ALTER TABLE orders DROP CONSTRAINT orders_payment_method_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_payment_method_check
  CHECK (
    payment_method IS NULL OR
    payment_method = ANY (ARRAY['CASH'::text, 'QR'::text, 'TRANSFER'::text, 'CORTESIA'::text])
  );
