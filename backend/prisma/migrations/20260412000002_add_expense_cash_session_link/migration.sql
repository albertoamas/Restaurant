-- ─────────────────────────────────────────────────────────────────────────────
-- M3: Vincular expenses a cash_sessions formalmente
--
-- Antes: el vínculo expense ↔ sesión era implícito (branch_id + rango fechas).
-- Ahora: FK explícita. Si la sesión se elimina, cash_session_id queda NULL
--        (ON DELETE SET NULL) — el gasto sigue existiendo, solo pierde el link.
--
-- Nullable: si no hay sesión abierta cuando se crea el gasto (ej. fuera de
-- horario), se guarda con cash_session_id = NULL. No se bloquea la operación.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE expenses
  ADD COLUMN cash_session_id TEXT NULL;

ALTER TABLE expenses
  ADD CONSTRAINT expenses_cash_session_id_fkey
  FOREIGN KEY (cash_session_id) REFERENCES cash_sessions(id) ON DELETE SET NULL;

-- Partial index: solo las filas con sesión asignada — evita indexar NULLs
CREATE INDEX expenses_cash_session_id_idx
  ON expenses(cash_session_id)
  WHERE cash_session_id IS NOT NULL;

-- ── Backfill ──────────────────────────────────────────────────────────────────
-- Asocia cada gasto existente a la sesión de caja de su branch que estaba
-- abierta en el momento en que se creó el gasto.
-- Criterio: misma tenant + mismo branch + opened_at ≤ created_at ≤ closed_at
-- (o sesión aún abierta: closed_at IS NULL).
-- Si hubiera solapamiento de sesiones (no debería ocurrir), toma la más reciente.

UPDATE expenses e
SET cash_session_id = (
  SELECT cs.id
  FROM cash_sessions cs
  WHERE cs.tenant_id = e.tenant_id
    AND cs.branch_id = e.branch_id
    AND cs.opened_at <= e.created_at
    AND (cs.closed_at IS NULL OR cs.closed_at >= e.created_at)
  ORDER BY cs.opened_at DESC
  LIMIT 1
);
