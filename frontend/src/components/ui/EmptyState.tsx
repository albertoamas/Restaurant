import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  /** Qué hacer para que aparezca contenido. */
  description?: string;
  /** Acción que resuelve el vacío (ej.: "Agregar producto"). */
  action?: ReactNode;
  /** compact: dentro de una tarjeta o panel; normal: ocupa el área principal. */
  compact?: boolean;
}

export function EmptyState({ icon, title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? 'py-8 px-4' : 'py-16 px-6'}`}>
      <div className="w-12 h-12 rounded-card bg-surface-2 border border-line flex items-center justify-center text-muted mb-3">
        <Icon name={icon} size={22} />
      </div>
      <p className="text-body font-semibold text-main">{title}</p>
      {description && <p className="text-label text-soft mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
