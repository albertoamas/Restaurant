import { useState } from 'react';
import toast from 'react-hot-toast';
import type { ExpenseConceptDto } from '@pos/shared';
import { expensesApi } from '../../api/expenses.api';
import { useAuth } from '../../context/auth.context';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { FIELD } from './ExpenseField';
import { handleApiError } from '../../utils/api-error';
import { today } from '../../utils/date';

/** Diálogo compacto: cantidad/precio (o monto) y listo. */
export function QuickExpenseDialog({
  concept, onClose, onSaved,
}: {
  concept: ExpenseConceptDto;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { currentBranchId } = useAuth();
  const tracksQuantity = !!concept.unit;

  const [quantity, setQuantity]   = useState('1');
  const [price, setPrice]         = useState(concept.defaultUnitPrice ? String(concept.defaultUnitPrice) : '');
  const [expenseDate, setDate]    = useState(today());
  const [showDate, setShowDate]   = useState(false);
  const [saving, setSaving]       = useState(false);

  const qty   = parseFloat(quantity) || 0;
  const unit  = parseFloat(price)    || 0;
  const total = Math.round(qty * unit * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qty <= 0)  { toast.error('La cantidad debe ser mayor a 0'); return; }
    if (unit <= 0) { toast.error('El monto debe ser mayor a 0');    return; }
    // Un gasto siempre pertenece a una sucursal: en la vista consolidada no hay
    // ninguna a la que imputarlo.
    if (!currentBranchId) {
      toast.error('Selecciona una sucursal antes de registrar un gasto');
      return;
    }

    setSaving(true);
    try {
      await expensesApi.create({
        items: [{
          conceptId:  concept.id,
          categoryId: concept.categoryId,
          name:       concept.name,
          unit:       concept.unit ?? undefined,
          quantity:   qty,
          unitPrice:  unit,
        }],
        expenseDate,
        branchId: currentBranchId ?? undefined,
      });
      toast.success(`${concept.name}: Bs ${total.toFixed(2)}`);
      onSaved();
    } catch (err) {
      handleApiError(err, 'Error al registrar el gasto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={concept.name} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="-mt-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
          {concept.categoryName}
        </p>

        {tracksQuantity ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Cantidad ({concept.unit})
              </span>
              <input
                autoFocus
                type="number" inputMode="decimal" min="0.001" step="0.001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={`${FIELD} text-right tabular-nums`}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Precio por {concept.unit}
              </span>
              <input
                type="number" inputMode="decimal" min="0.01" step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={`${FIELD} text-right tabular-nums`}
                required
              />
            </label>
          </div>
        ) : (
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">Monto</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-400">Bs</span>
              <input
                autoFocus
                type="number" inputMode="decimal" min="0.01" step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={`${FIELD} text-right text-lg font-bold tabular-nums`}
                required
              />
            </div>
          </label>
        )}

        <div className="flex items-center justify-between rounded-xl border border-line bg-surface-2 px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total</span>
          <span className="font-heading text-xl font-black tabular-nums text-gray-900">
            Bs {total.toFixed(2)}
          </span>
        </div>

        {showDate ? (
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">Fecha</span>
            <input type="date" value={expenseDate} onChange={(e) => setDate(e.target.value)} className={FIELD} required />
          </label>
        ) : (
          <button
            type="button"
            onClick={() => setShowDate(true)}
            className="flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-primary-600"
          >
            <Icon name="clock" size={13} />
            Hoy (cambiar fecha)
          </button>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
          <Button type="submit" fullWidth loading={saving}>Registrar</Button>
        </div>
      </form>
    </Modal>
  );
}
