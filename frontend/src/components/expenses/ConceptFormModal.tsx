import { useEffect, useId, useState } from 'react';
import toast from 'react-hot-toast';
import type { ExpenseConceptDto } from '@pos/shared';
import { expensesApi } from '../../api/expenses.api';
import { useExpenseConcepts } from '../../hooks/useExpenses';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ConceptDraft, EMPTY_CONCEPT, ExpenseConceptFields, parseConceptPrice } from './ExpenseConceptFields';
import { handleApiError } from '../../utils/api-error';

/** Qué se abre: un gasto nuevo (con nombre o categoría ya puestos) o uno existente para editar. */
export type ConceptFormTarget =
  | { mode: 'create'; name?: string; categoryId?: string; /** Tras crearlo se registra: cambia el texto del botón. */ thenRegister?: boolean }
  | { mode: 'edit'; concept: ExpenseConceptDto };

/**
 * Único formulario de un gasto de la lista, para crear y para editar. Lo usan la pestaña Lista y
 * Registrar (cuando la búsqueda no encuentra el gasto: se agrega y se registra enseguida).
 */
export function ConceptFormModal({ target, onClose, onSaved }: {
  target: ConceptFormTarget | null;
  onClose: () => void;
  onSaved?: (concept: ExpenseConceptDto) => void;
}) {
  const formId = useId();
  const { invalidate } = useExpenseConcepts();
  const [draft, setDraft]   = useState<ConceptDraft>(EMPTY_CONCEPT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!target) return;
    if (target.mode === 'edit') {
      const c = target.concept;
      setDraft({
        categoryId:       c.categoryId,
        name:             c.name,
        unit:             c.unit ?? '',
        defaultUnitPrice: c.defaultUnitPrice ? String(c.defaultUnitPrice) : '',
      });
    } else {
      setDraft({ ...EMPTY_CONCEPT, name: target.name ?? '', categoryId: target.categoryId ?? '' });
    }
  }, [target]);

  if (!target) return null;
  const editing = target.mode === 'edit';
  const valid = draft.categoryId !== '' && draft.name.trim() !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      const saved = editing
        ? await expensesApi.updateConcept(target.concept.id, {
            categoryId:       draft.categoryId,
            name:             draft.name.trim(),
            unit:             draft.unit.trim() || null,
            defaultUnitPrice: parseConceptPrice(draft.defaultUnitPrice),
          })
        : await expensesApi.createConcept({
            categoryId:       draft.categoryId,
            name:             draft.name.trim(),
            unit:             draft.unit.trim() || undefined,
            defaultUnitPrice: parseConceptPrice(draft.defaultUnitPrice),
          });
      invalidate();
      toast.success(editing ? 'Gasto actualizado' : `"${saved.name}" agregado a tu lista`);
      onSaved?.(saved);
      onClose();
    } catch (err) {
      handleApiError(err, editing ? 'No se pudo actualizar el gasto' : 'No se pudo agregar a la lista');
    } finally {
      setSaving(false);
    }
  };

  const submitLabel = editing ? 'Guardar cambios' : target.thenRegister ? 'Agregar y registrar' : 'Agregar a la lista';

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editing ? `Editar "${target.concept.name}"` : 'Nuevo gasto en la lista'}
      size="lg"
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
          <Button type="submit" form={formId} fullWidth loading={saving} disabled={!valid}>{submitLabel}</Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <p className="-mt-1 text-label text-soft">
          {editing
            ? 'Los cambios valen para los próximos registros. Lo ya registrado no cambia.'
            : 'Queda en tu lista para registrarlo con un toque la próxima vez.'}
        </p>
        <ExpenseConceptFields value={draft} onChange={setDraft} autoFocusName={!editing && !(target.name)} />
      </form>
    </Modal>
  );
}
