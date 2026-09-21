import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { ExpenseConceptDto } from '@pos/shared';
import { expensesApi } from '../../api/expenses.api';
import { useExpenseConcepts } from '../../hooks/useExpenses';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ConceptDraft, EMPTY_CONCEPT, ExpenseConceptFields, parseConceptPrice } from './ExpenseConceptFields';
import { handleApiError } from '../../utils/api-error';

/**
 * Alta de un gasto en la lista. Tras crearlo devuelve el concepto para
 * encadenar el registro del gasto sin pasos extra.
 */
export function NewConceptModal({
  isOpen, initialName = '', onClose, onCreated,
}: {
  isOpen: boolean;
  initialName?: string;
  onClose: () => void;
  onCreated: (concept: ExpenseConceptDto) => void;
}) {
  const { invalidate } = useExpenseConcepts();
  const [draft, setDraft] = useState<ConceptDraft>(EMPTY_CONCEPT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setDraft({ ...EMPTY_CONCEPT, name: initialName });
  }, [isOpen, initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.categoryId) { toast.error('Elige una categoría'); return; }
    if (!draft.name.trim()) { toast.error('Escribe el nombre del gasto'); return; }

    setSaving(true);
    try {
      const created = await expensesApi.createConcept({
        categoryId:       draft.categoryId,
        name:             draft.name.trim(),
        unit:             draft.unit.trim() || undefined,
        defaultUnitPrice: parseConceptPrice(draft.defaultUnitPrice),
      });
      invalidate();
      toast.success(`"${created.name}" agregado a tu lista`);
      onCreated(created);
    } catch (err) {
      handleApiError(err, 'No se pudo agregar el gasto a la lista');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar gasto a la lista" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="-mt-1 text-xs text-gray-500">
          Primero queda en tu lista; al guardarlo te pedimos el monto para registrarlo.
        </p>

        <ExpenseConceptFields value={draft} onChange={setDraft} autoFocusName={!initialName} />

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
          <Button type="submit" fullWidth loading={saving}>Agregar y registrar</Button>
        </div>
      </form>
    </Modal>
  );
}
