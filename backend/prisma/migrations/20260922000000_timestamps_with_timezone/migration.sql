-- Convierte todas las columnas de fecha a `timestamptz`.
--
-- POR QUÉ
-- Las columnas estaban declaradas como `timestamp` (sin zona) pero guardan UTC, porque
-- Prisma normaliza todo DateTime a UTC antes de escribir. El SQL crudo de los reportes,
-- en cambio, fue escrito asumiendo columnas con zona: expresiones como
-- `created_at::timestamptz AT TIME ZONE 'America/La_Paz'` solo dan el día boliviano si la
-- columna es `timestamptz`. Sobre una columna naive esa conversión es una operación nula,
-- y además cualquier `Date` de JS pasado como parámetro viajaba como `timestamptz` y
-- Postgres le restaba 4 horas al compararlo. Resultado: los reportes agrupaban por día UTC
-- en vez de día Bolivia, el mapa de horas salía corrido 4 h y el arqueo de caja sumaba las
-- ventas de las 4 horas previas a la apertura (faltantes fantasma).
--
-- Al declarar el tipo correcto, todo ese SQL pasa a funcionar como siempre se pretendió,
-- sin cambiar una sola consulta.
--
-- SEGURIDAD DE LOS DATOS
-- `USING <col> AT TIME ZONE 'UTC'` afirma que el valor naive almacenado es UTC y lo
-- convierte al instante equivalente. Se verificó antes de escribir esta migración que:
--   1. Prisma genera todos los DateTime en UTC del lado del cliente, incluso cuando el
--      campo no se pasa explícitamente (nunca se dispara el DEFAULT de la base).
--   2. La única escritura por SQL crudo de la aplicación (branch_order_sequences) no
--      toca ninguna columna de fecha.
-- Por lo tanto no existen filas con hora local. Ningún instante se altera: solo se declara
-- correctamente la zona que ya tenían. La conversión es además independiente de la zona
-- horaria de la sesión que ejecute la migración.
--
-- PRECISIÓN
-- Se unifica todo en (3) milisegundos, que es el mapeo por defecto de Prisma para DateTime.
-- Las columnas de `plans` y las dos de sorteos venían en (6) por migraciones escritas a
-- mano; bajar a milisegundos es irrelevante para esos datos y elimina la deriva de esquema.

-- ── Columnas naive que guardaban UTC ──────────────────────────────────────────
ALTER TABLE "branches"           ALTER COLUMN "created_at"   TYPE timestamptz(3) USING "created_at"   AT TIME ZONE 'UTC';
ALTER TABLE "cash_sessions"      ALTER COLUMN "opened_at"    TYPE timestamptz(3) USING "opened_at"    AT TIME ZONE 'UTC';
ALTER TABLE "cash_sessions"      ALTER COLUMN "closed_at"    TYPE timestamptz(3) USING "closed_at"    AT TIME ZONE 'UTC';
ALTER TABLE "customers"          ALTER COLUMN "created_at"   TYPE timestamptz(3) USING "created_at"   AT TIME ZONE 'UTC';
ALTER TABLE "customers"          ALTER COLUMN "updated_at"   TYPE timestamptz(3) USING "updated_at"   AT TIME ZONE 'UTC';
ALTER TABLE "expense_categories" ALTER COLUMN "created_at"   TYPE timestamptz(3) USING "created_at"   AT TIME ZONE 'UTC';
ALTER TABLE "expense_concepts"   ALTER COLUMN "created_at"   TYPE timestamptz(3) USING "created_at"   AT TIME ZONE 'UTC';
ALTER TABLE "expense_items"      ALTER COLUMN "created_at"   TYPE timestamptz(3) USING "created_at"   AT TIME ZONE 'UTC';
ALTER TABLE "expenses"           ALTER COLUMN "created_at"   TYPE timestamptz(3) USING "created_at"   AT TIME ZONE 'UTC';
ALTER TABLE "expenses"           ALTER COLUMN "expense_date" TYPE timestamptz(3) USING "expense_date" AT TIME ZONE 'UTC';
ALTER TABLE "expenses"           ALTER COLUMN "voided_at"    TYPE timestamptz(3) USING "voided_at"    AT TIME ZONE 'UTC';
ALTER TABLE "orders"             ALTER COLUMN "created_at"   TYPE timestamptz(3) USING "created_at"   AT TIME ZONE 'UTC';
ALTER TABLE "orders"             ALTER COLUMN "updated_at"   TYPE timestamptz(3) USING "updated_at"   AT TIME ZONE 'UTC';
ALTER TABLE "plans"              ALTER COLUMN "created_at"   TYPE timestamptz(3) USING "created_at"   AT TIME ZONE 'UTC';
ALTER TABLE "plans"              ALTER COLUMN "updated_at"   TYPE timestamptz(3) USING "updated_at"   AT TIME ZONE 'UTC';
ALTER TABLE "products"           ALTER COLUMN "created_at"   TYPE timestamptz(3) USING "created_at"   AT TIME ZONE 'UTC';
ALTER TABLE "raffle_tickets"     ALTER COLUMN "created_at"   TYPE timestamptz(3) USING "created_at"   AT TIME ZONE 'UTC';
ALTER TABLE "raffles"            ALTER COLUMN "created_at"   TYPE timestamptz(3) USING "created_at"   AT TIME ZONE 'UTC';
ALTER TABLE "raffles"            ALTER COLUMN "updated_at"   TYPE timestamptz(3) USING "updated_at"   AT TIME ZONE 'UTC';
ALTER TABLE "tenants"            ALTER COLUMN "created_at"   TYPE timestamptz(3) USING "created_at"   AT TIME ZONE 'UTC';
ALTER TABLE "users"              ALTER COLUMN "created_at"   TYPE timestamptz(3) USING "created_at"   AT TIME ZONE 'UTC';

-- ── Columnas que ya eran timestamptz: solo se normaliza la precisión ──────────
-- Sin USING: cambiar la precisión de un timestamptz no reinterpreta el valor.
ALTER TABLE "raffle_tickets"     ALTER COLUMN "delivered_at" TYPE timestamptz(3);
ALTER TABLE "raffle_winners"     ALTER COLUMN "drawn_at"     TYPE timestamptz(3);
