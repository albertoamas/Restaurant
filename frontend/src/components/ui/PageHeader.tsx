import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  /** Una línea que explica qué se hace aquí o el contexto (período, sucursal). */
  description?: ReactNode;
  /** Datos breves junto al título: contadores, estado (Badges). */
  meta?: ReactNode;
  /** Acciones de la pantalla; la principal va última. */
  actions?: ReactNode;
  /** Controles bajo el título que filtran toda la pantalla (período, pestañas). */
  children?: ReactNode;
}

/**
 * Encabezado de pantalla: título, contexto y acciones. En celular las acciones pasan debajo
 * del título (no entran en la misma fila).
 */
export function PageHeader({ title, description, meta, actions, children }: PageHeaderProps) {
  return (
    <header className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1 className="text-title font-bold text-main font-heading">{title}</h1>
            {meta}
          </div>
          {description && <p className="text-body text-soft mt-1">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </header>
  );
}
