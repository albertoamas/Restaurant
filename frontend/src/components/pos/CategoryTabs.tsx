import { useCallback, useEffect, useRef, useState } from 'react';
import type { CategoryDto } from '@pos/shared';
import { Icon } from '../ui/Icon';

interface Props {
  categories: CategoryDto[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  /** Fondo sobre el que va la fila: el degradado del borde lo imita (la página o un modal). */
  surface?: 'page' | 'card';
}

const FADE = {
  page: 'from-surface-page via-surface-page/90',
  card: 'from-surface-card via-surface-card/90',
};

/**
 * Filtro de categorías del catálogo: una fila de chips que se desplaza en horizontal. En el
 * celular se arrastra con el dedo; con mouse no había cómo: ahora la rueda la mueve de costado y,
 * si hay chips ocultos, aparecen botones en el borde de ese lado.
 */
export function CategoryTabs({ categories, selected, onSelect, surface = 'page' }: Props) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    setEdges({
      left:  row.scrollLeft > 1,
      right: row.scrollLeft + row.clientWidth < row.scrollWidth - 1,
    });
  }, []);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    row.addEventListener('scroll', measure, { passive: true });

    // La rueda vertical del mouse mueve la fila de costado. Si la fila ya no puede moverse en
    // esa dirección, la rueda sigue desplazando la página como siempre.
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const canMove = e.deltaY > 0
        ? row.scrollLeft + row.clientWidth < row.scrollWidth - 1
        : row.scrollLeft > 0;
      if (!canMove) return;
      e.preventDefault();
      row.scrollLeft += e.deltaY;
    };
    row.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      observer.disconnect();
      row.removeEventListener('scroll', measure);
      row.removeEventListener('wheel', onWheel);
    };
  }, [measure]);

  // Con muchas categorías, la elegida (o la que cambió) queda a la vista.
  useEffect(() => {
    const active = rowRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
    active?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    measure();
  }, [selected, categories.length, measure]);

  const page = (dir: -1 | 1) => {
    const row = rowRef.current;
    if (!row) return;
    row.scrollBy({ left: dir * row.clientWidth * 0.8, behavior: 'smooth' });
  };

  const chip = (active: boolean) => [
    'shrink-0 min-h-10 px-4 rounded-full text-label font-semibold whitespace-nowrap border transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60',
    active
      ? 'bg-primary-600 border-primary-600 text-white'
      : 'bg-surface-card border-line text-soft hover:text-main hover:border-line-strong',
  ].join(' ');

  // Botón de borde: solo con mouse (en táctil se arrastra) y solo si hay algo oculto de ese lado.
  const edgeButton = (side: 'left' | 'right') => (
    <div
      className={`pointer-events-none absolute inset-y-0 ${side === 'left' ? 'left-0 bg-gradient-to-r' : 'right-0 bg-gradient-to-l'} hidden w-16 items-center ${FADE[surface]} to-transparent [@media(hover:hover)]:flex ${
        side === 'left' ? 'justify-start' : 'justify-end'
      }`}
    >
      <button
        type="button"
        tabIndex={-1}
        onClick={() => page(side === 'left' ? -1 : 1)}
        aria-label={side === 'left' ? 'Ver categorías anteriores' : 'Ver más categorías'}
        className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface-card text-soft shadow-raised transition-colors hover:border-line-strong hover:text-main"
      >
        <Icon name={side === 'left' ? 'chevron-left' : 'chevron-right'} size={18} />
      </button>
    </div>
  );

  return (
    <div className="relative">
      <div ref={rowRef} role="toolbar" aria-label="Categorías" className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 py-0.5">
        <button onClick={() => onSelect(null)} aria-pressed={selected === null} className={chip(selected === null)}>
          Todos
        </button>
        {categories.map((cat) => (
          <button key={cat.id} onClick={() => onSelect(cat.id)} aria-pressed={selected === cat.id} className={chip(selected === cat.id)}>
            {cat.name}
          </button>
        ))}
      </div>
      {edges.left && edgeButton('left')}
      {edges.right && edgeButton('right')}
    </div>
  );
}
