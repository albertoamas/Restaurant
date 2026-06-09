-- Reactiva las categorías genéricas que fueron desactivadas por error
UPDATE expense_categories
SET is_active = true
WHERE name IN ('Insumos', 'Personal', 'Servicios', 'Transporte', 'Mantenimiento', 'Otro');

-- Inserta las que no existían en tenants que tampoco las tengan activas
INSERT INTO expense_categories (id, tenant_id, name, icon, is_active, track_quantity, sort_order, created_at)
SELECT gen_random_uuid(), t.id, 'Insumos', NULL, true, false, 5, NOW()
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM expense_categories ec WHERE ec.tenant_id = t.id AND ec.name = 'Insumos'
);

INSERT INTO expense_categories (id, tenant_id, name, icon, is_active, track_quantity, sort_order, created_at)
SELECT gen_random_uuid(), t.id, 'Personal', NULL, true, false, 15, NOW()
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM expense_categories ec WHERE ec.tenant_id = t.id AND ec.name = 'Personal'
);

INSERT INTO expense_categories (id, tenant_id, name, icon, is_active, track_quantity, sort_order, created_at)
SELECT gen_random_uuid(), t.id, 'Servicios', NULL, true, false, 25, NOW()
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM expense_categories ec WHERE ec.tenant_id = t.id AND ec.name = 'Servicios'
);

INSERT INTO expense_categories (id, tenant_id, name, icon, is_active, track_quantity, sort_order, created_at)
SELECT gen_random_uuid(), t.id, 'Transporte', NULL, true, false, 35, NOW()
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM expense_categories ec WHERE ec.tenant_id = t.id AND ec.name = 'Transporte'
);

INSERT INTO expense_categories (id, tenant_id, name, icon, is_active, track_quantity, sort_order, created_at)
SELECT gen_random_uuid(), t.id, 'Mantenimiento', NULL, true, false, 45, NOW()
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM expense_categories ec WHERE ec.tenant_id = t.id AND ec.name = 'Mantenimiento'
);

INSERT INTO expense_categories (id, tenant_id, name, icon, is_active, track_quantity, sort_order, created_at)
SELECT gen_random_uuid(), t.id, 'Otro', NULL, true, false, 99, NOW()
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM expense_categories ec WHERE ec.tenant_id = t.id AND ec.name = 'Otro'
);
