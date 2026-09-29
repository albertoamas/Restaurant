import type { CategoryDto } from '@pos/shared';

interface Props {
  categories: CategoryDto[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

/** Filtro de categorías del catálogo: una fila de chips que se desplaza en horizontal. */
export function CategoryTabs({ categories, selected, onSelect }: Props) {
  const chip = (active: boolean) => [
    'shrink-0 min-h-10 px-4 rounded-full text-label font-semibold whitespace-nowrap border transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60',
    active
      ? 'bg-primary-600 border-primary-600 text-white'
      : 'bg-surface-card border-line text-soft hover:text-main hover:border-line-strong',
  ].join(' ');

  return (
    <div role="toolbar" aria-label="Categorías" className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 py-0.5">
      <button onClick={() => onSelect(null)} aria-pressed={selected === null} className={chip(selected === null)}>
        Todos
      </button>
      {categories.map((cat) => (
        <button key={cat.id} onClick={() => onSelect(cat.id)} aria-pressed={selected === cat.id} className={chip(selected === cat.id)}>
          {cat.name}
        </button>
      ))}
    </div>
  );
}
