import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { SegmentedControl } from '../ui/SegmentedControl';
import { formatDayRange } from '../../utils/date';

export type ExpenseView = 'activity' | 'calendar';

interface ExpenseBrowserProps {
  /** [nombre de categoría, total gastado] ordenado de mayor a menor. */
  categories: [string, number][];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  view: ExpenseView;
  onChangeView: (view: ExpenseView) => void;
  selectedDay: string | null;
  onClearDay: () => void;
  /** Los movimientos o el calendario, según la vista activa. */
  children: React.ReactNode;
}

function chipClass(active: boolean) {
  return [
    'inline-flex shrink-0 items-center gap-1.5 min-h-9 rounded-full border px-3.5 text-label font-semibold whitespace-nowrap transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60',
    active
      ? 'border-primary-600 bg-primary-600 text-white'
      : 'border-line bg-surface-card text-soft hover:text-main hover:border-line-strong',
  ].join(' ');
}

/**
 * Movimientos del período en una tarjeta: vista (lista o calendario), el único filtro por
 * categoría (con lo gastado en cada una) y el contenido.
 */
export function ExpenseBrowser({
  categories, selectedCategory, onSelectCategory,
  view, onChangeView, selectedDay, onClearDay, children,
}: ExpenseBrowserProps) {
  return (
    <section className="overflow-hidden rounded-card border border-line bg-surface-card shadow-raised">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 sm:px-5">
        <h2 className="text-heading font-semibold text-main">Movimientos</h2>
        <SegmentedControl
          label="Vista de gastos"
          size="sm"
          value={view}
          onChange={onChangeView}
          options={[{ value: 'activity', label: 'Lista' }, { value: 'calendar', label: 'Calendario' }]}
        />
      </div>

      {categories.length > 0 && (
        <div role="group" aria-label="Filtrar por categoría" className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3 sm:px-5">
          <button type="button" className={chipClass(selectedCategory === '')} aria-pressed={selectedCategory === ''} onClick={() => onSelectCategory('')}>
            Todas
          </button>
          {categories.map(([cat, total]) => (
            <button
              key={cat}
              type="button"
              aria-pressed={selectedCategory === cat}
              className={chipClass(selectedCategory === cat)}
              onClick={() => onSelectCategory(selectedCategory === cat ? '' : cat)}
            >
              {cat}
              <span className={`tabular-nums ${selectedCategory === cat ? 'text-white/80' : 'text-muted'}`}>Bs {total.toFixed(2)}</span>
            </button>
          ))}
        </div>
      )}

      {selectedDay && (
        <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-2 px-4 py-2 sm:px-5">
          <p className="text-label text-main">Solo el {formatDayRange(selectedDay, selectedDay)}</p>
          <Button variant="ghost" size="sm" onClick={onClearDay}>
            <Icon name="x" size={14} />
            Ver todo el período
          </Button>
        </div>
      )}

      <div className="border-t border-line">{children}</div>
    </section>
  );
}
