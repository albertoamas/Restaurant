import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { ExpenseDto } from '@pos/shared';
import { expensesApi } from '../../api/expenses.api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { FIELD, Field } from './ExpenseField';
import { handleApiError } from '../../utils/api-error';
import { toBoliviaDateString } from '../../utils/timezone';
import { expenseCategoryLabel } from '../../utils/expense-labels';

/**
 * Edición de un gasto ya registrado: importes, fecha y datos de respaldo.
 * Qué gasto es (nombre, categoría, unidad) se define en la lista, no acá —
 * para cambiarlo hay que anularlo y registrarlo de nuevo.
 */
export function ExpenseEditModal({
  expense, onClose, onSaved,
}: {
  expense: ExpenseDto | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [quantity, setQuantity]   = useState('1');
  const [amount, setAmount]       = useState('');
  const [expenseDate, setDate]    = useState('');
  const [notes, setNotes]         = useState('');
  const [supplierName, setSupplier]   = useState('');
  const [documentNumber, setDocument] = useState('');
  const [showExtra, setShowExtra] = useState(false);
  const [saving, setSaving]       = useState(false);

  const first = expense?.items[0];
  const rest  = expense?.items.slice(1) ?? [];
  const unit  = first?.unit ?? '';
  const tracksQuantity = unit.length > 0;

  const qty   = parseFloat(quantity) || 0;
  const price = parseFloat(amount)   || 0;
  const total = tracksQuantity ? Math.round(qty * price * 100) / 100 : price;

  useEffect(() => {
    if (!expense) return;
    if (first) {
      setQuantity(String(first.quantity));
      setAmount(first.unit ? String(first.unitPrice) : String(first.totalPrice));
    } else {
      setQuantity('1');
      setAmount(String(expense.amount));
    }
    setDate(toBoliviaDateString(new Date(expense.expenseDate)));
    setNotes(expense.description ?? '');
    setSupplier(expense.supplierName ?? '');
    setDocument(expense.documentNumber ?? '');
    setShowExtra(!!(expense.supplierName || expense.documentNumber));
  }, [expense]);

  if (!expense) return null;

  const label = first?.name ?? expense.description ?? 'Gasto';
  const categoryName = first?.categoryName ?? expenseCategoryLabel(expense);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tracksQuantity && qty <= 0) { toast.error('La cantidad debe ser mayor a 0'); return; }
    if (price <= 0) { toast.error('El monto debe ser mayor a 0'); return; }

    // Se conserva la identidad del gasto (concepto, categoría, nombre, unidad);
    // aquí solo cambian los importes y los datos de respaldo.
    const mainItem = {
      conceptId:  first?.conceptId ?? undefined,
      categoryId: first?.categoryId ?? undefined,
      name:       label,
      unit:       unit || undefined,
      quantity:   tracksQuantity ? qty : 1,
      unitPrice:  price,
    };
    const legacyItems = rest.map((it) => ({
      conceptId:  it.conceptId ?? undefined,
      categoryId: it.categoryId ?? undefined,
      name:       it.name,
      unit:       it.unit ?? undefined,
      quantity:   it.quantity,
      unitPrice:  it.unitPrice,
    }));

    setSaving(true);
    try {
      await expensesApi.update(expense.id, {
        items: [mainItem, ...legacyItems],
        description:    notes.trim() || undefined,
        expenseDate,
        supplierName:   supplierName.trim() || undefined,
        documentNumber: documentNumber.trim() || undefined,
      });
      toast.success('Gasto actualizado');
      onSaved();
      onClose();
    } catch (err) {
      handleApiError(err, 'Error al actualizar el gasto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Editar gasto" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface-2)] px-3 py-2.5">
          <p className="text-sm font-bold text-gray-800">{label}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{categoryName}</p>
        </div>

        {rest.length > 0 && (
          <p className="rounded-xl bg-[var(--color-surface-2)] px-3 py-2 text-xs text-gray-500">
            Este gasto tiene {rest.length + 1} productos. Aquí editas el primero; el resto se conserva igual.
          </p>
        )}

        {tracksQuantity ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Cantidad (${unit})`}>
              <input
                autoFocus
                type="number" inputMode="decimal" min="0.001" step="0.001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={`${FIELD} text-right tabular-nums`}
                required
              />
            </Field>
            <Field label={`Precio por ${unit}`}>
              <input
                type="number" inputMode="decimal" min="0.01" step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`${FIELD} text-right tabular-nums`}
                required
              />
            </Field>
          </div>
        ) : (
          <Field label="Monto">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-400">Bs</span>
              <input
                autoFocus
                type="number" inputMode="decimal" min="0.01" step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`${FIELD} text-right text-lg font-bold tabular-nums`}
                required
              />
            </div>
          </Field>
        )}

        <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface-2)] px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total</span>
          <span className="font-heading text-xl font-black tabular-nums text-gray-900">
            Bs {total.toFixed(2)}
          </span>
        </div>

        <Field label="Fecha">
          <input type="date" required value={expenseDate} onChange={(e) => setDate(e.target.value)} className={FIELD} />
        </Field>

        <Field label="Nota" optional>
          <input
            placeholder="Ej: Compra de la semana"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={FIELD}
          />
        </Field>

        {showExtra ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Proveedor">
              <input value={supplierName} onChange={(e) => setSupplier(e.target.value)} placeholder="Ej. Mercado central" maxLength={150} className={FIELD} />
            </Field>
            <Field label="Comprobante">
              <input value={documentNumber} onChange={(e) => setDocument(e.target.value)} placeholder="Nº factura o recibo" maxLength={80} className={FIELD} />
            </Field>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowExtra(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-primary-600"
          >
            <Icon name="plus" size={13} strokeWidth={2.2} /> Proveedor o comprobante
          </button>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
          <Button type="submit" fullWidth loading={saving}>Guardar cambios</Button>
        </div>
      </form>
    </Modal>
  );
}
