import { useEffect, useId, useState } from 'react';
import toast from 'react-hot-toast';
import type { ExpenseDto } from '@pos/shared';
import { expensesApi } from '../../api/expenses.api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Input } from '../ui/Input';
import { handleApiError } from '../../utils/api-error';
import { toBoliviaDateString } from '../../utils/timezone';
import { expenseCategoryLabel } from '../../utils/expense-labels';

/**
 * Edición de un gasto ya registrado: importes, fecha y datos de respaldo.
 * Qué gasto es (nombre, categoría, unidad) se define en la lista, no aquí: para cambiarlo hay
 * que anularlo y registrarlo de nuevo.
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
  const formId = useId();

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
    <Modal
      isOpen
      onClose={onClose}
      title="Editar gasto"
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
          <Button type="submit" form={formId} fullWidth loading={saving}>Guardar cambios</Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-card border border-line bg-surface-2 px-3 py-2.5">
          <p className="text-body font-semibold text-main">{label}</p>
          <p className="text-label text-soft">{categoryName}</p>
        </div>

        {rest.length > 0 && (
          <p className="text-label text-soft">
            Este gasto tiene {rest.length + 1} productos. Aquí editas el primero; el resto se conserva igual.
          </p>
        )}

        {tracksQuantity ? (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`Cantidad (${unit})`}
              autoFocus
              type="number" inputMode="decimal" min="0.001" step="0.001"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
            <Input
              label={`Precio por ${unit}`}
              type="number" inputMode="decimal" min="0.01" step="0.01"
              leftAddon="Bs"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
        ) : (
          <Input
            label="Monto"
            autoFocus
            type="number" inputMode="decimal" min="0.01" step="0.01"
            leftAddon="Bs"
            inputSize="lg"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        )}

        {tracksQuantity && (
          <div className="flex items-baseline justify-between rounded-card border border-line bg-surface-2 px-4 py-3">
            <span className="text-body font-semibold text-main">Total</span>
            <span className="text-heading font-bold text-main tabular-nums">Bs {total.toFixed(2)}</span>
          </div>
        )}

        <Input type="date" label="Fecha del gasto" required value={expenseDate} onChange={(e) => setDate(e.target.value)} />

        <Input
          label="Nota (opcional)"
          placeholder="Ej.: compra de la semana"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {showExtra ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Proveedor" value={supplierName} onChange={(e) => setSupplier(e.target.value)} placeholder="Ej.: Mercado central" maxLength={150} />
            <Input label="Comprobante" value={documentNumber} onChange={(e) => setDocument(e.target.value)} placeholder="Número de factura o recibo" maxLength={80} />
          </div>
        ) : (
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowExtra(true)}>
            <Icon name="plus" size={14} />
            Agregar proveedor o comprobante
          </Button>
        )}
      </form>
    </Modal>
  );
}
