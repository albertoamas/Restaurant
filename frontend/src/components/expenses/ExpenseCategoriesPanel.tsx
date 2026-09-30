import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { ExpenseCategoryDto, ExpenseConceptDto } from '@pos/shared';
import { expensesApi } from '../../api/expenses.api';
import { useExpenseCategories, useExpenseConcepts } from '../../hooks/useExpenses';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Input } from '../ui/Input';
import { IconAction } from './IconAction';
import { handleApiError } from '../../utils/api-error';

/**
 * Administración de categorías de gasto. Borrar es baja lógica: los gastos
 * de esa categoría dejan de ofrecerse, pero el historial no cambia.
 */
export function ExpenseCategoriesPanel() {
  const { categories, loading, reload } = useExpenseCategories();
  const { concepts, invalidate } = useExpenseConcepts();

  const [newName, setNewName]     = useState('');
  const [editingId, setEditing]   = useState<string | null>(null);
  const [editName, setEditName]   = useState('');
  const [confirmId, setConfirm]   = useState<string | null>(null);
  const [busy, setBusy]           = useState(false);

  // Un solo recorrido de `concepts` por cambio de lista, en vez de uno por
  // categoría en cada render (incluido cada tecla tipeada en los inputs).
  const countByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const concept of concepts as ExpenseConceptDto[]) {
      counts.set(concept.categoryId, (counts.get(concept.categoryId) ?? 0) + 1);
    }
    return counts;
  }, [concepts]);

  const refresh = async () => {
    await reload();
    invalidate();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) { toast.error('Escribe el nombre de la categoría'); return; }
    setBusy(true);
    try {
      const created = await expensesApi.createCategory({ name: newName.trim() });
      toast.success(`Categoría "${created.name}" creada`);
      setNewName('');
      await refresh();
    } catch (err) {
      handleApiError(err, 'No se pudo crear la categoría');
    } finally {
      setBusy(false);
    }
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) { toast.error('El nombre no puede quedar vacío'); return; }
    setBusy(true);
    try {
      await expensesApi.updateCategory(id, { name: editName.trim() });
      toast.success('Categoría actualizada');
      setEditing(null);
      await refresh();
    } catch (err) {
      handleApiError(err, 'No se pudo actualizar la categoría');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    setBusy(true);
    try {
      await expensesApi.deleteCategory(id);
      toast.success('Categoría eliminada');
      setConfirm(null);
      await refresh();
    } catch (err) {
      handleApiError(err, 'No se pudo eliminar la categoría');
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (category: ExpenseCategoryDto) => {
    setConfirm(null);
    setEditing(category.id);
    setEditName(category.name);
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2.5 rounded-control border border-line bg-surface-2 px-3 py-2.5">
        <Icon name="warning" size={16} className="mt-0.5 shrink-0 text-muted" />
        <p className="text-label text-soft">
          Las categorías agrupan tus gastos en los reportes y en los filtros.
          Al eliminar una, sus gastos dejan de aparecer en la lista. El historial no cambia.
        </p>
      </div>

      <form onSubmit={handleCreate} className="flex items-end gap-2 rounded-card border border-line bg-surface-2 p-4">
        <div className="flex-1">
          <Input label="Nueva categoría" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ej.: delivery" maxLength={100} />
        </div>
        <Button type="submit" loading={busy}>Agregar</Button>
      </form>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-control bg-surface-2" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <p className="py-8 text-center text-body text-soft">Todavía no hay categorías.</p>
      ) : (
        <div className="space-y-2">
          {categories.map((category) => {
            const count = countByCategory.get(category.id) ?? 0;
            return editingId === category.id ? (
              <div
                key={category.id}
                className="flex gap-2 rounded-control border border-primary-500/30 p-3"
                
              >
                <div className="flex-1">
                  <Input
                    aria-label="Nombre de la categoría"
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleRename(category.id); }
                      if (e.key === 'Escape') { e.preventDefault(); setEditing(null); }
                    }}
                    maxLength={100}
                  />
                </div>
                <Button type="button" size="sm" loading={busy} onClick={() => handleRename(category.id)}>Guardar</Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(null)}>Cancelar</Button>
              </div>
            ) : (
              <div
                key={category.id}
                className="flex items-center gap-3 rounded-control border border-line px-3 py-2.5"
                
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-semibold text-main">{category.name}</p>
                  <p className="text-caption text-muted">
                    {count === 0 ? 'Sin gastos' : `${count} gasto${count !== 1 ? 's' : ''} en la lista`}
                  </p>
                </div>
                {confirmId === category.id ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-label text-soft">
                      {count > 0 ? `¿Eliminar y ocultar sus ${count} gastos?` : '¿Eliminar?'}
                    </span>
                    <IconAction icon="check" label="Confirmar" tone="danger" onClick={() => handleDelete(category.id)} />
                    <IconAction icon="x" label="Cancelar" onClick={() => setConfirm(null)} />
                  </div>
                ) : (
                  <div className="flex shrink-0 items-center gap-1">
                    <IconAction icon="edit" label="Renombrar" onClick={() => startEdit(category)} />
                    <IconAction icon="trash" label="Eliminar" onClick={() => setConfirm(category.id)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
