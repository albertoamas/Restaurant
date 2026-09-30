import { useRef, type KeyboardEvent } from 'react';
import { Icon, type IconName } from './Icon';

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
}

interface TabBarProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Nombre del grupo para lectores de pantalla (ej.: "Secciones del reporte"). */
  label: string;
  /** id del panel que muestran las pestañas (aria-controls). */
  panelId?: string;
}

/**
 * Pestañas de sección con subrayado, para pantallas con varias vistas de un mismo contenido
 * (Reportes). Para elegir entre 2 a 5 opciones cortas se usa SegmentedControl.
 * Teclado: flechas para moverse, Inicio y Fin; solo la pestaña activa es enfocable.
 */
export function TabBar<T extends string>({ items, value, onChange, label, panelId }: TabBarProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = items.findIndex((t) => t.value === value);
    const next =
      e.key === 'ArrowRight' ? (i + 1) % items.length
      : e.key === 'ArrowLeft' ? (i - 1 + items.length) % items.length
      : e.key === 'Home' ? 0
      : e.key === 'End' ? items.length - 1
      : -1;
    if (next < 0) return;
    e.preventDefault();
    onChange(items[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex gap-1 overflow-x-auto border-b border-line scrollbar-hide">
      {items.map((t, i) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={panelId}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.value)}
            className={[
              'relative -mb-px inline-flex items-center gap-2 shrink-0 min-h-11 px-3.5 text-body font-semibold whitespace-nowrap',
              'border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 rounded-t-control',
              active
                ? 'border-primary-600 text-primary-700 dark:border-primary-400 dark:text-primary-300'
                : 'border-transparent text-soft hover:text-main hover:border-line-strong',
            ].join(' ')}
          >
            {t.icon && <Icon name={t.icon} size={16} />}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
