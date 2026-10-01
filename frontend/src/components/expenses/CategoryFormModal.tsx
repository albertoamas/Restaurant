import { useId, useState } from 'react';
import toast from 'react-hot-toast';
import type { ExpenseCategoryDto } from '@pos/shared';
import { expensesApi } from '../../api/expenses.api';
import { useExpenseConcepts } from '../../hooks/useExpenses';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { handleApiError } from '../../utils/api-error';

/** Crear una categoría (`category` null) o renombrar una existente. Se monta al abrir. */
export function CategoryFormModal({ category, onClose }: {
  category: ExpenseCategoryDto | null;
  onClose: () => void;
}) {
  const formId = useId();
  // Refresca categorías y gastos juntos (cada gasto lleva el nombre de su categoría).
  const { invalidate } = useExpenseConcepts();
  const [name, setName]     = useState(category?.name ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = name.trim();
    if (!value) return;
    setSaving(true);
    try {
      if (category) await expensesApi.updateCategory(category.id, { name: value });
      else          await expensesApi.createCategory({ name: value });
      toast.success(category ? 'Categoría renombrada' : `Categoría "${value}" creada`);
      invalidate();
      onClose();
    } catch (err) {
      handleApiError(err, category ? 'No se pudo renombrar la categoría' : 'No se pudo crear la categoría');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={category ? `Renombrar "${category.name}"` : 'Nueva categoría'}
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" form={formId} fullWidth loading={saving} disabled={!name.trim()}>
            {category ? 'Guardar' : 'Crear categoría'}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit}>
        <Input
          label="Nombre de la categoría"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej.: delivery"
          maxLength={100}
          hint="Agrupa tus gastos en la lista, los filtros y los reportes."
        />
      </form>
    </Modal>
  );
}
