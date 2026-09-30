import { useMemo, useState } from 'react';
import type { ExpenseConceptDto } from '@pos/shared';
import { useExpenseConcepts } from '../../hooks/useExpenses';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Input } from '../ui/Input';
import { Skeleton } from '../ui/Skeleton';

interface ExpensePickerProps {
  /** Tocar un gasto de la lista: se abre el registro con su monto. */
  onPick: (concept: ExpenseConceptDto) => void;
  /** Agregar un gasto nuevo a la lista (con el texto buscado como nombre). */
  onAdd: (name: string) => void;
  /** Abrir la administración de la lista de gastos. */
  onManage: () => void;
}

/**
 * Lista de gastos para registrar: se busca por nombre o categoría y se toca. Es la única vía de
 * registro: un gasto primero existe en la lista; si no está, se agrega y se registra enseguida.
 */
export function ExpensePicker({ onPick, onAdd, onManage }: ExpensePickerProps) {
  const { concepts, loading } = useExpenseConcepts();
  const [query, setQuery] = useState('');
  const q = query.trim();

  const visible = useMemo(() => {
    const needle = q.toLowerCase();
    return [...concepts]
      .filter((c) => !needle || c.name.toLowerCase().includes(needle) || c.categoryName.toLowerCase().includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [concepts, q]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            aria-label="Buscar gasto por nombre o categoría"
            placeholder="Buscar por nombre o categoría"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftAddon={<Icon name="search" size={18} />}
          />
        </div>
        <Button variant="secondary" onClick={onManage} aria-label="Administrar la lista de gastos" title="Administrar la lista de gastos">
          <Icon name="settings" size={18} />
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="rect" h="64px" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line-strong px-4 py-6 text-center">
          <p className="text-body font-semibold text-main">
            {concepts.length === 0 ? 'Tu lista de gastos está vacía' : `"${q}" no está en tu lista`}
          </p>
          <p className="text-label text-soft">Agrégalo a la lista y lo registras enseguida.</p>
          <Button onClick={() => onAdd(q)}>
            <Icon name="plus" size={18} />
            {q ? `Agregar "${q}"` : 'Agregar gasto'}
          </Button>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-2">
          {visible.map((concept) => (
            <li key={concept.id}>
              <button
                type="button"
                onClick={() => onPick(concept)}
                className="flex h-full min-h-16 w-full flex-col items-start justify-between gap-1 rounded-control border border-line bg-surface-card px-3 py-2.5 text-left transition-colors hover:border-primary-500/60 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60"
              >
                <span className="line-clamp-2 text-body font-semibold leading-snug text-main">{concept.name}</span>
                <span className="flex w-full items-center justify-between gap-1 text-caption text-muted">
                  <span className="truncate">{concept.categoryName}</span>
                  {concept.unit && <span className="shrink-0">por {concept.unit}</span>}
                </span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => onAdd(q)}
              className="flex h-full min-h-16 w-full items-center justify-center gap-1.5 rounded-control border border-dashed border-line-strong px-3 py-2.5 text-label font-semibold text-soft transition-colors hover:border-primary-500/60 hover:text-main"
            >
              <Icon name="plus" size={16} />
              Agregar a la lista
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
