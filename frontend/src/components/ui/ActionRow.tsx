import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

/** Bloque titulado de una ficha (Equipo, Sucursales). */
export function SheetSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-label font-semibold text-soft">{title}</h3>
      {children}
    </section>
  );
}

/** Lista de `ActionRow` con borde y separadores. */
export function ActionList({ children }: { children: ReactNode }) {
  return <div className="overflow-hidden rounded-card border border-line divide-y divide-line">{children}</div>;
}

/**
 * Fila de acción con ícono, título y explicación: se lee qué hace antes de tocarla. Deshabilitada,
 * la descripción dice por qué.
 */
export function ActionRow({ icon, title, description, onClick, danger = false, disabled = false }: {
  icon: IconName;
  title: string;
  description: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors enabled:hover:bg-surface-2 focus-visible:outline-none focus-visible:bg-surface-2 disabled:cursor-not-allowed"
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-control ${
        disabled ? 'bg-surface-2 text-muted'
          : danger ? 'bg-red-500/10 text-red-700 dark:text-red-400' : 'bg-surface-2 text-soft'
      }`}>
        <Icon name={icon} size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-body font-semibold ${
          disabled ? 'text-muted' : danger ? 'text-red-700 dark:text-red-400' : 'text-main'
        }`}>{title}</span>
        <span className="block text-label text-soft">{description}</span>
      </span>
      {!disabled && <Icon name="chevron-right" size={16} className="shrink-0 text-muted" />}
    </button>
  );
}
