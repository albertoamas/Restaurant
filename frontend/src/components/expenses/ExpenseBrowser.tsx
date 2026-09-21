import { Icon } from '../ui/Icon';
import type { IconName } from '../ui/Icon';

interface ExpenseBrowserProps {
  /** [nombre de categoría, total gastado] ordenado de mayor a menor. */
  categories: [string, number][];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  view: 'activity' | 'calendar';
  onChangeView: (view: 'activity' | 'calendar') => void;
  selectedDay: string | null;
  onClearDay: () => void;
  /** La tabla de movimientos o el calendario, según la vista activa. */
  children: React.ReactNode;
}

/**
 * Tarjeta única de exploración de gastos: filtro por categoría, selector de
 * vista y el contenido (movimientos o calendario) dentro del mismo bloque.
 */
export function ExpenseBrowser({
  categories, selectedCategory, onSelectCategory,
  view, onChangeView, selectedDay, onClearDay, children,
}: ExpenseBrowserProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] shadow-card-md" style={{ background: 'var(--color-surface-card)' }}>
      {categories.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto px-4 py-3 sm:px-5">
          <CategoryChip label="Todas" active={selectedCategory === ''} onClick={() => onSelectCategory('')} />
          {categories.map(([cat, total]) => (
            <CategoryChip
              key={cat}
              label={cat}
              amount={total}
              active={selectedCategory === cat}
              onClick={() => onSelectCategory(selectedCategory === cat ? '' : cat)}
            />
          ))}
        </div>
      )}

      <div
        className={`flex items-center justify-between gap-3 px-4 py-3 sm:px-5 ${
          categories.length > 0 ? 'border-t border-[var(--border-subtle)]' : ''
        }`}
      >
        <div className="inline-flex rounded-xl border border-[var(--border-subtle)] bg-[var(--color-surface-2)] p-1">
          <ViewButton active={view === 'activity'} onClick={() => onChangeView('activity')} icon="receipt" label="Movimientos" />
          <ViewButton active={view === 'calendar'} onClick={() => onChangeView('calendar')} icon="table" label="Calendario" />
        </div>
        {selectedDay && (
          <button
            onClick={onClearDay}
            className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700"
          >
            <Icon name="x" size={13} />
            <span className="hidden sm:inline">Ver todo el período</span>
          </button>
        )}
      </div>

      <div className="border-t border-[var(--border-subtle)]">{children}</div>
    </section>
  );
}

function CategoryChip({
  label, amount, active, onClick,
}: {
  label: string;
  amount?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
        active
          ? 'bg-primary-600 text-white'
          : 'border border-[var(--border-subtle)] bg-[var(--color-surface-2)] text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
      {amount !== undefined && (
        <span className={`ml-1.5 tabular-nums ${active ? 'opacity-80' : 'text-gray-400'}`}>
          Bs {amount.toFixed(2)}
        </span>
      )}
    </button>
  );
}

function ViewButton({
  active, onClick, icon, label,
}: {
  active: boolean;
  onClick: () => void;
  icon: IconName;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
        active
          ? 'bg-[var(--color-surface-card)] text-gray-900 shadow-card'
          : 'text-gray-400 hover:text-gray-700'
      }`}
    >
      <Icon name={icon} size={14} /> {label}
    </button>
  );
}
