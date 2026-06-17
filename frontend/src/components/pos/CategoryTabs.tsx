import type { CategoryDto } from '@pos/shared';

interface Props {
  categories: CategoryDto[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryTabs({ categories, selected, onSelect }: Props) {
  const activeClass = 'bg-primary-600 text-white border border-primary-600';

  const inactiveClass = [
    'bg-[var(--color-surface-2)] text-gray-500 border border-[var(--border-subtle)]',
    'hover:border-primary-500/40 hover:text-primary-400 hover:bg-primary-500/8',
  ].join(' ');

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
          selected === null ? activeClass : inactiveClass
        }`}
      >
        Todos
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
            selected === cat.id ? activeClass : inactiveClass
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
