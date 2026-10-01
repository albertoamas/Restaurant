import { useRef, type KeyboardEvent } from 'react';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  /** Contador opcional junto a la etiqueta (ej.: pedidos pendientes). */
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Nombre del grupo para lectores de pantalla (ej.: "Estado del pedido"). */
  label: string;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  /** Hasta tablet, las opciones van en dos columnas en vez de desplazarse fuera de la pantalla. */
  wrap?: boolean;
}

/**
 * Elegir una opción entre pocas (2 a 5): vista, filtro de estado, período. Se usa con teclado
 * como un grupo de radios: flechas para moverse, la opción elegida es la única enfocable.
 */
export function SegmentedControl<T extends string>({
  options, value, onChange, label, size = 'md', fullWidth = false, wrap = false,
}: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const i = options.findIndex((o) => o.value === value);
    const next = (i + dir + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={[
        wrap ? 'grid grid-cols-2 w-full md:inline-flex md:w-auto' : fullWidth ? 'flex w-full' : 'inline-flex',
        'max-w-full overflow-x-auto p-1 gap-1 rounded-control bg-surface-2 border border-line',
        // Con cantidad impar, la última opción ocupa la fila entera.
        wrap && options.length % 2 === 1 ? 'max-md:[&>*:last-child]:col-span-2' : '',
      ].join(' ')}
    >
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={[
              'inline-flex items-center justify-center gap-1.5 rounded-[calc(var(--radius-control)-3px)] font-semibold whitespace-nowrap',
              'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60',
              size === 'sm' ? 'min-h-8 px-3 text-label' : 'min-h-9 px-3.5 text-label',
              fullWidth ? 'flex-1' : '',
              active ? 'bg-surface-card text-main shadow-raised' : 'text-soft hover:text-main',
            ].join(' ')}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={`text-caption tabular-nums ${active ? 'text-primary-700 dark:text-primary-400' : 'text-muted'}`}>
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
