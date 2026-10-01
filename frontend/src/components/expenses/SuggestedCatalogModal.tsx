import { useState } from 'react';
import toast from 'react-hot-toast';
import { SUGGESTED_EXPENSE_CATALOG } from '@pos/shared';
import { expensesApi } from '../../api/expenses.api';
import { useExpenseCategories, useExpenseConcepts } from '../../hooks/useExpenses';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { handleApiError } from '../../utils/api-error';

/**
 * Catálogo sugerido: el dueño marca qué categorías quiere y se crean con sus gastos. Reemplaza la
 * siembra automática, que llenaba la lista de un negocio nuevo con gastos que quizá no usa.
 */
export function SuggestedCatalogModal({ onClose }: { onClose: () => void }) {
  const { categories } = useExpenseCategories();
  const { invalidate } = useExpenseConcepts();
  const have = new Set(categories.map((c) => c.name.toLowerCase()));
  const available = SUGGESTED_EXPENSE_CATALOG.filter((g) => !have.has(g.name.toLowerCase()));
  const [selected, setSelected] = useState<Set<string>>(() => new Set(available.map((g) => g.name)));
  const [saving, setSaving] = useState(false);

  const toggle = (name: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(name)) next.delete(name); else next.add(name);
    return next;
  });

  const load = async () => {
    setSaving(true);
    try {
      const result = await expensesApi.loadSuggestedCatalog([...selected]);
      invalidate();
      toast.success(`Listo: ${result.categories === 1 ? '1 categoría' : `${result.categories} categorías`} y ${result.concepts === 1 ? '1 gasto' : `${result.concepts} gastos`} en tu lista`);
      onClose();
    } catch (err) {
      handleApiError(err, 'No se pudo cargar el catálogo sugerido');
    } finally {
      setSaving(false);
    }
  };

  const n = selected.size;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Catálogo sugerido"
      size="md"
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="button" fullWidth loading={saving} disabled={n === 0} onClick={load}>
            {n === 0 ? 'Elige al menos una' : n === 1 ? 'Agregar 1 categoría' : `Agregar ${n} categorías`}
          </Button>
        </div>
      }
    >
      <p className="mb-4 text-label text-soft">
        Marca las que te sirven. Después puedes renombrar, quitar o agregar gastos desde la pestaña Lista.
      </p>
      {available.length === 0 ? (
        <p className="rounded-card border border-dashed border-line px-4 py-6 text-center text-label text-soft">
          Ya tienes todas las categorías sugeridas.
        </p>
      ) : (
        <ul className="space-y-2">
          {available.map((group) => {
            const on = selected.has(group.name);
            return (
              <li key={group.name}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(group.name)}
                  className={`flex w-full items-start gap-3 rounded-card border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 ${
                    on ? 'border-primary-500/60 bg-primary-500/8' : 'border-line bg-surface-card hover:border-line-strong'
                  }`}
                >
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    on ? 'border-primary-600 bg-primary-600 text-white' : 'border-line-strong bg-surface-card'
                  }`} aria-hidden>
                    {on && <Icon name="check" size={14} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-body font-semibold text-main">{group.name}</span>
                    <span className="block text-label text-soft">{group.concepts.map(([name]) => name).join(', ')}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
