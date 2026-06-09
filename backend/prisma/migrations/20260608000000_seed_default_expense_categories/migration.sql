-- Desactiva las categorías genéricas del sistema anterior (si existen)
UPDATE expense_categories
SET is_active = false
WHERE name IN ('Insumos', 'Personal', 'Servicios', 'Transporte', 'Mantenimiento', 'Otro');

-- Inserta las 4 categorías estándar para cada tenant que aún no las tenga
INSERT INTO expense_categories (id, tenant_id, name, icon, is_active, track_quantity, sort_order, created_at)
SELECT gen_random_uuid(), t.id, 'Gaseosas', NULL, true, true, 10, NOW()
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM expense_categories ec WHERE ec.tenant_id = t.id AND ec.name = 'Gaseosas'
);

INSERT INTO expense_categories (id, tenant_id, name, icon, is_active, track_quantity, sort_order, created_at)
SELECT gen_random_uuid(), t.id, 'Refrescos', NULL, true, true, 20, NOW()
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM expense_categories ec WHERE ec.tenant_id = t.id AND ec.name = 'Refrescos'
);

INSERT INTO expense_categories (id, tenant_id, name, icon, is_active, track_quantity, sort_order, created_at)
SELECT gen_random_uuid(), t.id, 'Operativos', NULL, true, false, 30, NOW()
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM expense_categories ec WHERE ec.tenant_id = t.id AND ec.name = 'Operativos'
);

INSERT INTO expense_categories (id, tenant_id, name, icon, is_active, track_quantity, sort_order, created_at)
SELECT gen_random_uuid(), t.id, 'Administrativos', NULL, true, false, 40, NOW()
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM expense_categories ec WHERE ec.tenant_id = t.id AND ec.name = 'Administrativos'
);
