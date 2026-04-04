import type { CategoryDto } from '@pos/shared';

interface Props {
  categories: CategoryDto[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryTabs({ categories, selected, onSelect }: Props) {
  const activeClass = [
    'bg-primary-600 text-white border border-primary-600',
    'shadow-[0_2px_8px_oklch(0.45_0.16_235/0.22)]',
  ].join(' ');

  const inactiveClass = [
    'bg-white text-gray-600 border border-gray-200',
    'hover:border-primary-400 hover:text-primary-800 hover:bg-primary-50/35',
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
