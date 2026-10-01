import { useMemo, useState } from 'react';
import { EXPENSE_CATALOG_LIMITS } from '@pos/shared';
import type { ExpenseConceptDto } from '@pos/shared';
import { useExpenseCategories, useExpenseConcepts } from '../../hooks/useExpenses';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Input, Select } from '../ui/Input';
import { Skeleton } from '../ui/Skeleton';
import { SuggestedCatalogModal } from './SuggestedCatalogModal';

interface ExpensePickerProps {
  /** Tocar un gasto de la lista: se abre el registro con su monto. */
  onPick: (concept: ExpenseConceptDto) => void;
  /** La búsqueda no encontró el gasto: agregarlo a la lista y registrarlo enseguida. */
  onAdd: (name: string) => void;
}

const GRID = 'grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';

function chipClass(active: boolean) {
  return [
    'inline-flex items-center min-h-9 rounded-full border px-3.5 text-label font-semibold whitespace-nowrap transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60',
    active ? 'border-primary-600 bg-primary-600 text-white' : 'border-line bg-surface-card text-soft hover:text-main hover:border-line-strong',
  ].join(' ');
}

function Tile({ concept, onPick }: { concept: ExpenseConceptDto; onPick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        className="flex h-full min-h-16 w-full flex-col items-start justify-between gap-1 rounded-control border border-line bg-surface-card px-3 py-2.5 text-left transition-colors hover:border-primary-500/60 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60"
      >
        <span className="line-clamp-2 text-body font-semibold leading-snug text-main">{concept.name}</span>
        {concept.unit && <span className="text-caption text-muted">por {concept.unit}</span>}
      </button>
    </li>
  );
}

/**
 * Lista de gastos para registrar: se busca o se elige la categoría y se toca. Con muchos gastos,
 * sin filtro se ven agrupados por categoría. Si la búsqueda no encuentra el gasto, se ofrece
 * agregarlo y registrarlo en un paso; administrar la lista es de la pestaña Lista.
 */
export function ExpensePicker({ onPick, onAdd }: ExpensePickerProps) {
  const { concepts, loading } = useExpenseConcepts();
  const { categories: allCategories, loading: catLoading } = useExpenseCategories();
  const [suggested, setSuggested] = useState(false);
  // Sin categorías no se puede agregar un gasto (el formulario pide una): se ofrece el catálogo sugerido.
  const noCategories = !catLoading && allCategories.length === 0;
  const [query, setQuery]       = useState('');
  const [category, setCategory] = useState('');
  const q = query.trim();
  // Con la lista llena no se ofrece agregar: el servidor lo rechazaría.
  const full = concepts.length >= EXPENSE_CATALOG_LIMITS.concepts;

  const categories = useMemo(
    () => [...new Set(concepts.map((c) => c.categoryName).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    [concepts],
  );

  const visible = useMemo(() => {
    const needle = q.toLowerCase();
    return concepts
      .filter((c) => !category || c.categoryName === category)
      .filter((c) => !needle || c.name.toLowerCase().includes(needle) || c.categoryName.toLowerCase().includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [concepts, q, category]);

  // Sin buscar ni filtrar, agrupado por categoría: con 80 gastos una grilla sola no se recorre.
  const grouped = !q && !category;
  const groups = useMemo(
    () => categories
      .map((name) => ({ name, items: visible.filter((c) => c.categoryName === name) }))
      .filter((g) => g.items.length > 0),
    [categories, visible],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            aria-label="Buscar gasto por nombre o categoría"
            placeholder="Buscar gasto"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftAddon={<Icon name="search" size={18} />}
          />
        </div>
        {/* Celular y tablet: desplegable; en fila las categorías se cortaban. */}
        {categories.length > 1 && (
          <div className="lg:hidden sm:w-56">
            <Select aria-label="Categoría" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Todas las categorías</option>
              {categories.map((name) => <option key={name} value={name}>{name}</option>)}
            </Select>
          </div>
        )}
      </div>

      {categories.length > 1 && (
        <div role="group" aria-label="Filtrar por categoría" className="hidden lg:flex flex-wrap gap-2">
          {['', ...categories].map((name) => (
            <button
              key={name || 'todas'}
              type="button"
              aria-pressed={category === name}
              onClick={() => setCategory(name)}
              className={chipClass(category === name)}
            >
              {name || 'Todas'}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className={GRID}>
          {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} variant="rect" h="64px" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line-strong px-4 py-6 text-center">
          <p className="text-body font-semibold text-main">
            {concepts.length === 0 ? 'Tu lista de gastos está vacía' : q ? `"${q}" no está en tu lista` : 'Ningún gasto en esta categoría'}
          </p>
          <p className="text-label text-soft">
            {noCategories
              ? 'Empieza con el catálogo sugerido o crea tus categorías en la pestaña Lista.'
              : full
              ? `Tu lista llegó al máximo de ${EXPENSE_CATALOG_LIMITS.concepts} gastos. Quita alguno en la pestaña Lista para agregar este.`
              : q || concepts.length === 0 ? 'Agrégalo y lo registras enseguida.' : 'Elige otra categoría o agrega gastos en la pestaña Lista.'}
          </p>
          {noCategories && (
            <Button onClick={() => setSuggested(true)}>
              <Icon name="plus" size={18} />
              Ver catálogo sugerido
            </Button>
          )}
          {!noCategories && !full && (q || concepts.length === 0) && (
            <Button onClick={() => onAdd(q)}>
              <Icon name="plus" size={18} />
              {q ? `Agregar "${q}" y registrar` : 'Agregar un gasto'}
            </Button>
          )}
        </div>
      ) : grouped ? (
        // Una tarjeta por categoría, en columnas: una categoría con un solo gasto no ocupa una
        // fila entera, y con muchos gastos entran más en pantalla.
        <div className="columns-1 sm:columns-2 xl:columns-3 gap-3">
          {groups.map((g) => (
            <section key={g.name} aria-label={g.name} className="mb-3 break-inside-avoid overflow-hidden rounded-control border border-line">
              <h3 className="border-b border-line bg-surface-2 px-3 py-2 text-label font-semibold text-soft">{g.name}</h3>
              <ul className="divide-y divide-line">
                {g.items.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => onPick(c)}
                      className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:bg-surface-2"
                    >
                      <span className="text-body font-medium text-main">{c.name}</span>
                      {c.unit && <span className="shrink-0 text-caption text-muted">por {c.unit}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <ul className={GRID}>
          {visible.map((c) => <Tile key={c.id} concept={c} onPick={() => onPick(c)} />)}
        </ul>
      )}

      {suggested && <SuggestedCatalogModal onClose={() => setSuggested(false)} />}
    </div>
  );
}
