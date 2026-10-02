import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

const TONES = {
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300',
  error:   'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400',
};

/**
 * Aviso dentro de una pantalla: tope del plan, caja de otro día, pedido sin cobrar, error de un
 * formulario. Antes cada pantalla repetía el mismo bloque ámbar a mano.
 */
export function Notice({ tone = 'warning', icon = 'warning', role, className = '', children }: {
  tone?: keyof typeof TONES;
  icon?: IconName;
  /** `alert` para lo que el lector de pantalla debe anunciar al aparecer (un error, un bloqueo). */
  role?: 'alert' | 'status';
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role={role} className={`flex items-start gap-2 rounded-control border px-3 py-2.5 text-label ${TONES[tone]} ${className}`}>
      <Icon name={icon} size={16} className="mt-0.5 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
