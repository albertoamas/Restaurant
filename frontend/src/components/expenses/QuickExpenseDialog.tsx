import { useId, useState } from 'react';
import toast from 'react-hot-toast';
import type { ExpenseConceptDto } from '@pos/shared';
import { bs } from '../report';
import { expensesApi } from '../../api/expenses.api';
import { useAuth } from '../../context/auth.context';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Input } from '../ui/Input';
import { handleApiError } from '../../utils/api-error';
import { formatDayRange, today } from '../../utils/date';

/** Registro de un gasto de la lista: el monto (o cantidad y precio) y, si hace falta, la fecha. */
export function QuickExpenseDialog({
  concept, onClose, onSaved,
}: {
  concept: ExpenseConceptDto;
  onClose: () => void;
  onSaved: () => void;
}) {
  const formId = useId();
  const { currentBranchId } = useAuth();
  const tracksQuantity = !!concept.unit;

  const [quantity, setQuantity] = useState('1');
  const [price, setPrice]       = useState(concept.defaultUnitPrice ? String(concept.defaultUnitPrice) : '');
  const [expenseDate, setDate]  = useState(today());
  const [showDate, setShowDate] = useState(false);
  const [saving, setSaving]     = useState(false);

  const qty   = parseFloat(quantity) || 0;
  const unit  = parseFloat(price)    || 0;
  const total = Math.round(qty * unit * 100) / 100;
  const valid = qty > 0 && unit > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    // Un gasto siempre es de una sucursal: en la vista consolidada no hay a cuál imputarlo.
    if (!currentBranchId) {
      toast.error('Elige una sucursal antes de registrar un gasto');
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
        branchId: currentBranchId,
      });
      toast.success(`${concept.name}: ${bs(total)}`);
      onSaved();
    } catch (err) {
      handleApiError(err, 'Error al registrar el gasto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={concept.name}
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form={formId} fullWidth loading={saving} disabled={!valid}>Registrar</Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <p className="-mt-1 text-label text-soft">{concept.categoryName}</p>

        {tracksQuantity ? (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`Cantidad (${concept.unit})`}
              autoFocus
              type="number" inputMode="decimal" min="0.001" step="0.001"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
            <Input
              label={`Precio por ${concept.unit}`}
              type="number" inputMode="decimal" min="0.01" step="0.01"
              placeholder="0.00"
              leftAddon="Bs"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
        ) : (
          <Input
            label="Monto"
            autoFocus
            type="number" inputMode="decimal" min="0.01" step="0.01"
            placeholder="0.00"
            leftAddon="Bs"
            inputSize="lg"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        )}

        {tracksQuantity && (
          <div className="flex items-baseline justify-between rounded-card border border-line bg-surface-2 px-4 py-3">
            <span className="text-body font-semibold text-main">Total</span>
            <span className="text-heading font-bold text-main tabular-nums">{bs(total)}</span>
          </div>
        )}

        {showDate ? (
          <Input type="date" label="Fecha del gasto" max={today()} value={expenseDate} onChange={(e) => setDate(e.target.value)} required />
        ) : (
          <div className="flex items-center justify-between gap-3 text-label">
            <span className="inline-flex items-center gap-1.5 text-soft">
              <Icon name="clock" size={14} />
              Fecha: hoy, {formatDayRange(expenseDate, expenseDate)}
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowDate(true)}>Cambiar</Button>
          </div>
        )}
      </form>
    </Modal>
  );
}
