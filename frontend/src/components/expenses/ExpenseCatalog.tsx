import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { EXPENSE_CATALOG_LIMITS, SUGGESTED_EXPENSE_CATALOG } from '@pos/shared';
import type { ExpenseCategoryDto, ExpenseConceptDto } from '@pos/shared';
import { expensesApi } from '../../api/expenses.api';
import { useExpenseCategories, useExpenseConcepts } from '../../hooks/useExpenses';
import { ActionMenu } from '../ui/ActionMenu';
import { Button } from '../ui/Button';
import { ConfirmModal } from '../ui/ConfirmModal';
import { EmptyState } from '../ui/EmptyState';
import { Icon } from '../ui/Icon';
import { Input } from '../ui/Input';
import { Skeleton } from '../ui/Skeleton';
import { ConceptFormModal, type ConceptFormTarget } from './ConceptFormModal';
import { CategoryFormModal } from './CategoryFormModal';
import { SuggestedCatalogModal } from './SuggestedCatalogModal';
import { handleApiError } from '../../utils/api-error';

type Removing =
  | { kind: 'concept'; concept: ExpenseConceptDto }
  | { kind: 'category'; category: ExpenseCategoryDto; count: number };

const conceptDetail = (c: ExpenseConceptDto) =>
  `${c.unit ? `Por ${c.unit}` : 'Monto libre'}${c.defaultUnitPrice ? `, habitual Bs ${c.defaultUnitPrice.toFixed(2)}` : ''}`;

/**
 * La lista de gastos, a pantalla completa: qué gastos existen, agrupados por su categoría. Las
 * categorías se administran desde el encabezado de su grupo. Aquí no se registra nada.
 */
export function ExpenseCatalog() {
  const { categories, loading: catLoading, reload } = useExpenseCategories();
  const { concepts, loading, invalidate } = useExpenseConcepts();
  const [query, setQuery]               = useState('');
  const [conceptForm, setConceptForm]   = useState<ConceptFormTarget | null>(null);
  const [categoryForm, setCategoryForm] = useState<{ open: boolean; category: ExpenseCategoryDto | null }>({ open: false, category: null });
  const [removing, setRemoving]         = useState<Removing | null>(null);
  const [busy, setBusy]                 = useState(false);
  const [suggested, setSuggested]       = useState(false);

  const q = query.trim().toLowerCase();
  const groups = useMemo(() => {
    const byCategory = new Map<string, ExpenseConceptDto[]>();
    for (const c of concepts) {
      if (q && !c.name.toLowerCase().includes(q)) continue;
      byCategory.set(c.categoryId, [...(byCategory.get(c.categoryId) ?? []), c]);
    }
    return [...categories]
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
      .map((category) => ({
        category,
        items: (byCategory.get(category.id) ?? []).sort((a, b) => a.name.localeCompare(b.name, 'es')),
      }))
      // Buscando, solo los grupos con resultados; sin buscar, también las categorías vacías.
      .filter((g) => !q || g.items.length > 0);
  }, [categories, concepts, q]);

  // Topes de la lista (el servidor también los aplica): al llegar, crear se deshabilita y se explica.
  const conceptsFull   = concepts.length >= EXPENSE_CATALOG_LIMITS.concepts;
  const categoriesFull = categories.length >= EXPENSE_CATALOG_LIMITS.categories;

  // Categorías sugeridas que todavía no tiene: se pueden sumar después, no solo con la lista vacía.
  const have = new Set(categories.map((c) => c.name.toLowerCase()));
  const suggestionsLeft = SUGGESTED_EXPENSE_CATALOG.some((g) => !have.has(g.name.toLowerCase()));

  const countIn = (categoryId: string) => concepts.filter((c) => c.categoryId === categoryId).length;

  const handleRemove = async () => {
    if (!removing) return;
    setBusy(true);
    try {
      if (removing.kind === 'concept') {
        await expensesApi.deleteConcept(removing.concept.id);
        toast.success(`"${removing.concept.name}" quitado de tu lista`);
      } else {
        await expensesApi.deleteCategory(removing.category.id);
        toast.success(`Categoría "${removing.category.name}" eliminada`);
        await reload();
      }
      invalidate();
      setRemoving(null);
    } catch (err) {
      handleApiError(err, 'No se pudo quitar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <Input
            aria-label="Buscar en la lista"
            placeholder="Buscar en tu lista"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftAddon={<Icon name="search" size={18} />}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1 sm:flex-none" disabled={categoriesFull} onClick={() => setCategoryForm({ open: true, category: null })}>
            <Icon name="plus" size={18} />
            <span className="sm:hidden">Categoría</span>
            <span className="hidden sm:inline">Nueva categoría</span>
          </Button>
          <Button className="flex-1 sm:flex-none" disabled={conceptsFull} onClick={() => setConceptForm({ mode: 'create' })}>
            <Icon name="plus" size={18} />
            Nuevo gasto
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-label text-soft">
          Aquí defines qué gastos existen. Cambiar o quitar uno no afecta lo ya registrado.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="text-label text-muted tabular-nums">
            {concepts.length} de {EXPENSE_CATALOG_LIMITS.concepts} gastos. {categories.length} de {EXPENSE_CATALOG_LIMITS.categories} categorías.
          </p>
          {categories.length > 0 && suggestionsLeft && !categoriesFull && (
            <Button variant="ghost" size="sm" onClick={() => setSuggested(true)}>Agregar del catálogo sugerido</Button>
          )}
        </div>
        {(conceptsFull || categoriesFull) && (
          <p className="flex items-start gap-2 rounded-control border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-label text-amber-800 dark:text-amber-300">
            <Icon name="warning" size={16} className="mt-0.5 shrink-0" />
            {conceptsFull && categoriesFull
              ? 'Llegaste al máximo de gastos y de categorías. Quita los que ya no uses para agregar otros.'
              : conceptsFull
                ? `Llegaste al máximo de ${EXPENSE_CATALOG_LIMITS.concepts} gastos. Quita los que ya no uses para agregar otros.`
                : `Llegaste al máximo de ${EXPENSE_CATALOG_LIMITS.categories} categorías. Elimina las que ya no uses para crear otra.`}
          </p>
        )}
      </div>

      {loading || catLoading ? (
        <div className="grid gap-4 lg:grid-cols-2"><Skeleton variant="card" /><Skeleton variant="card" /></div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon="receipt"
          title={q ? `Nada con "${query.trim()}" en tu lista` : 'Tu lista está vacía'}
          description={q
            ? 'Prueba con otro nombre o agrégalo como gasto nuevo.'
            : 'Empieza con el catálogo sugerido (eliges qué categorías) o crea las tuyas desde cero.'}
          action={q ? undefined : (
            <Button onClick={() => setSuggested(true)}>
              <Icon name="plus" size={18} />
              Ver catálogo sugerido
            </Button>
          )}
        />
      ) : (
        // En columnas y no en grilla: con alturas distintas, la grilla dejaba huecos debajo de
        // las tarjetas cortas. Aquí cada tarjeta sigue a la anterior en su columna.
        <div className="columns-1 lg:columns-2 gap-4">
          {groups.map(({ category, items }) => (
            <section key={category.id} aria-label={category.name} className="mb-4 break-inside-avoid overflow-hidden rounded-card border border-line bg-surface-card shadow-raised">
              <div className="flex items-center gap-3 border-b border-line bg-surface-2 px-4 py-2">
                <h3 className="min-w-0 flex-1 truncate text-body font-semibold text-main">
                  {category.name}
                  <span className="ml-2 text-label font-normal text-muted">
                    {items.length === 1 ? '1 gasto' : `${items.length} gastos`}
                  </span>
                </h3>
                <ActionMenu
                  label={`Más acciones de la categoría ${category.name}`}
                  items={[
                    ...(conceptsFull ? [] : [{ label: 'Agregar gasto aquí', icon: 'plus' as const, onSelect: () => setConceptForm({ mode: 'create', categoryId: category.id }) }]),
                    { label: 'Renombrar', icon: 'edit', onSelect: () => setCategoryForm({ open: true, category }) },
                    { label: 'Eliminar categoría', icon: 'trash', danger: true, onSelect: () => setRemoving({ kind: 'category', category, count: countIn(category.id) }) },
                  ]}
                />
              </div>
              {items.length === 0 ? (
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <p className="text-label text-muted">Todavía sin gastos.</p>
                  <Button variant="ghost" size="sm" disabled={conceptsFull} onClick={() => setConceptForm({ mode: 'create', categoryId: category.id })}>
                    <Icon name="plus" size={14} />
                    Agregar
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {items.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 px-4 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-body font-medium text-main">{c.name}</p>
                        <p className="text-caption text-muted">{conceptDetail(c)}</p>
                      </div>
                      <ActionMenu
                        label={`Más acciones de ${c.name}`}
                        items={[
                          { label: 'Editar', icon: 'edit', onSelect: () => setConceptForm({ mode: 'edit', concept: c }) },
                          { label: 'Quitar de la lista', icon: 'trash', danger: true, onSelect: () => setRemoving({ kind: 'concept', concept: c }) },
                        ]}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      <ConceptFormModal target={conceptForm} onClose={() => setConceptForm(null)} />
      <CategoryFormModal
        isOpen={categoryForm.open}
        category={categoryForm.category}
        onClose={() => setCategoryForm({ open: false, category: null })}
      />
      {suggested && <SuggestedCatalogModal onClose={() => setSuggested(false)} />}

      <ConfirmModal
        isOpen={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={handleRemove}
        loading={busy}
        variant="danger"
        title={removing?.kind === 'category' ? `Eliminar la categoría "${removing.category.name}"` : `Quitar "${removing?.kind === 'concept' ? removing.concept.name : ''}"`}
        message={
          removing?.kind === 'category'
            ? removing.count > 0
              ? `Sus ${removing.count} gastos dejan de ofrecerse para registrar. Lo ya registrado no cambia.`
              : 'La categoría deja de aparecer. Lo ya registrado no cambia.'
            : 'Deja de ofrecerse para registrar. Lo ya registrado no cambia.'
        }
        confirmLabel={removing?.kind === 'category' ? 'Eliminar categoría' : 'Quitar de la lista'}
        cancelLabel="Volver"
      />
    </div>
  );
}
