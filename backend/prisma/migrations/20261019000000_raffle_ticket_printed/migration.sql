-- Ticket impreso para el ánfora. Solo EXPAND: columna nula, segura con el contenedor anterior
-- corriendo. delivered / delivered_at quedan sin uso y se eliminan en una migración posterior.
ALTER TABLE "raffle_tickets" ADD COLUMN "printed_at" TIMESTAMPTZ(3);

-- Lo que ya se entregó, y todo lo de sorteos que dejaron de estar abiertos, se da por impreso:
-- así no aparece como "pendiente de imprimir" lo que el negocio ya resolvió.
UPDATE "raffle_tickets" t
SET "printed_at" = COALESCE(t."delivered_at", t."created_at")
WHERE t."delivered" = TRUE
   OR EXISTS (SELECT 1 FROM "raffles" r WHERE r."id" = t."raffle_id" AND r."status" <> 'ACTIVE');
