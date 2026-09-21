import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { ExpenseConceptDto } from '@pos/shared';
import { expensesApi } from '../../api/expenses.api';
import { useExpenseConcepts } from '../../hooks/useExpenses';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ConceptDraft, EMPTY_CONCEPT, ExpenseConceptFields, parseConceptPrice } from './ExpenseConceptFields';
import { IconAction } from './IconAction';
import { handleApiError } from '../../utils/api-error';

/**
 * Mantenimiento de la lista de gastos: qué gastos existen y con qué valores
 * vienen precargados. No registra gastos — eso pasa al tocarlos en el panel.
 * Quitar es baja lógica: lo ya registrado no cambia.
 */
export function ExpenseConceptsPanel() {
  const { concepts, loading, invalidate } = useExpenseConcepts();

  const [draft, setDraft]         = useState<ConceptDraft>(EMPTY_CONCEPT);
  const [editingId, setEditing]   = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ConceptDraft>(EMPTY_CONCEPT);
  const [busy, setBusy]           = useState(false);
  const [confirmId, setConfirm]   = useState<string | null>(null);
  const [showAdd, setShowAdd]     = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, ExpenseConceptDto[]>();
    for (const concept of concepts) {
      const list = map.get(concept.categoryName) ?? [];
      list.push(concept);
      map.set(concept.categoryName, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'));
  }, [concepts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.categoryId) { toast.error('Elige una categoría'); return; }
    if (!draft.name.trim()) { toast.error('Escribe el nombre del gasto'); return; }

    setBusy(true);
    try {
      await expensesApi.createConcept({
        categoryId:       draft.categoryId,
        name:             draft.name.trim(),
        unit:             draft.unit.trim() || undefined,
        defaultUnitPrice: parseConceptPrice(draft.defaultUnitPrice),
      });
      toast.success(`"${draft.name.trim()}" agregado a tu lista`);
      setDraft({ ...EMPTY_CONCEPT, categoryId: draft.categoryId });
      invalidate();
    } catch (err) {
      handleApiError(err, 'No se pudo agregar a la lista');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editDraft.categoryId) { toast.error('Elige una categoría'); return; }
    if (!editDraft.name.trim()) { toast.error('El nombre no puede quedar vacío'); return; }
    setBusy(true);
    try {
      await expensesApi.updateConcept(id, {
        categoryId:       editDraft.categoryId,
        name:             editDraft.name.trim(),
        unit:             editDraft.unit.trim() || null,
        defaultUnitPrice: parseConceptPrice(editDraft.defaultUnitPrice),
      });
      toast.success('Gasto actualizado');
      setEditing(null);
      invalidate();
    } catch (err) {
      handleApiError(err, 'No se pudo actualizar');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    setBusy(true);
    try {
      await expensesApi.deleteConcept(id);
      toast.success('Quitado de tu lista');
      setConfirm(null);
      invalidate();
    } catch (err) {
      handleApiError(err, 'No se pudo quitar');
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (concept: ExpenseConceptDto) => {
    setConfirm(null);
    setEditing(concept.id);
    setEditDraft({
      categoryId:       concept.categoryId,
      name:             concept.name,
      unit:             concept.unit ?? '',
      defaultUnitPrice: concept.defaultUnitPrice ? String(concept.defaultUnitPrice) : '',
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface-2)] px-3 py-2.5">
        <Icon name="warning" size={15} className="mt-0.5 shrink-0 text-gray-400" />
        <p className="text-xs text-gray-500">
          Acá defines <strong className="font-bold text-gray-700">qué gastos existen</strong>, no registras ninguno.
          Para registrar, tócalo en «Registrar gasto». Editar la lista no afecta a lo ya registrado.
        </p>
      </div>

      {showAdd ? (
        <form onSubmit={handleCreate} className="space-y-3 rounded-2xl border border-primary-500/30 bg-[var(--color-surface-2)] p-4">
          <p className="text-xs font-bold text-gray-700">Nuevo gasto en la lista</p>
          <ExpenseConceptFields value={draft} onChange={setDraft} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => { setShowAdd(false); setDraft(EMPTY_CONCEPT); }}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" loading={busy}>Agregar a la lista</Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="secondary" size="sm" onClick={() => setShowAdd(true)}>
          <span className="flex items-center gap-1.5">
            <Icon name="plus" size={14} strokeWidth={2.2} /> Agregar gasto
          </span>
        </Button>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--color-surface-2)]" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">Tu lista de gastos está vacía.</p>
      ) : (
        <div className="max-h-[46vh] space-y-4 overflow-y-auto pr-1">
          {grouped.map(([categoryName, list]) => (
            <div key={categoryName}>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                {categoryName}
              </p>
              <div className="space-y-2">
                {list.map((concept) => (
                  editingId === concept.id ? (
                    <div
                      key={concept.id}
                      className="space-y-3 rounded-xl border border-primary-500/30 p-3"
                      style={{ background: 'var(--color-surface-card)' }}
                    >
                      <ExpenseConceptFields value={editDraft} onChange={setEditDraft} />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(null)}>Cancelar</Button>
                        <Button type="button" size="sm" loading={busy} onClick={() => handleSaveEdit(concept.id)}>Guardar</Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={concept.id}
                      className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] px-3 py-2.5"
                      style={{ background: 'var(--color-surface-card)' }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-800">{concept.name}</p>
                        <p className="text-xs text-gray-400">
                          {concept.unit ? `Por ${concept.unit}` : 'Monto libre'}
                          {concept.defaultUnitPrice ? ` · Bs ${concept.defaultUnitPrice.toFixed(2)} habitual` : ''}
                        </p>
                      </div>
                      {confirmId === concept.id ? (
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-[11px] font-semibold text-gray-500">¿Quitar?</span>
                          <IconAction icon="check" label="Confirmar" tone="danger" onClick={() => handleDelete(concept.id)} />
                          <IconAction icon="x" label="Cancelar" onClick={() => setConfirm(null)} />
                        </div>
                      ) : (
                        <div className="flex shrink-0 items-center gap-1">
                          <IconAction icon="edit" label="Editar" onClick={() => startEdit(concept)} />
                          <IconAction icon="trash" label="Quitar" onClick={() => setConfirm(concept.id)} />
                        </div>
                      )}
                    </div>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
