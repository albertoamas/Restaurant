ALTER TABLE "expense_categories" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

UPDATE expense_categories SET sort_order = CASE name
  WHEN 'Insumos'    THEN 10
  WHEN 'Personal'   THEN 20
  WHEN 'Servicios'  THEN 30
  WHEN 'Transporte' THEN 40
  WHEN 'Otro'       THEN 99
  ELSE 50
END;
