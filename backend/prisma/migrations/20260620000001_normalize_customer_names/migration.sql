-- Normalizar nombres de clientes a Title Case (ej: "ALBERTO AMAS" → "Alberto Amas")
-- initcap(lower(name)) es seguro con caracteres especiales del español (ñ, tildes)
-- Solo actualiza los registros que realmente necesitan corrección
UPDATE "customers"
SET
  name       = initcap(lower(name)),
  updated_at = NOW()
WHERE name != initcap(lower(name));
