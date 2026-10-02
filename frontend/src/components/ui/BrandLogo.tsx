import type { ReactNode } from 'react';
import { Icon } from './Icon';

/**
 * Logo de YankoPOS (ícono y nombre) de las pantallas públicas: landing, login, legales y admin.
 * `size="lg"` en el login; `subtitle` debajo del nombre; `suffix` al lado (ej.: "Administración").
 */
export function BrandLogo({ size = 'md', subtitle, suffix }: {
  size?: 'md' | 'lg';
  subtitle?: string;
  suffix?: ReactNode;
}) {
  const lg = size === 'lg';
  return (
    <span className={`inline-flex min-w-0 items-center ${lg ? 'gap-3' : 'gap-2.5'}`}>
      <span className={`flex shrink-0 items-center justify-center rounded-control bg-primary-600 text-white shadow-raised ${lg ? 'h-11 w-11' : 'h-9 w-9'}`}>
        <Icon name="cart" size={lg ? 22 : 18} strokeWidth={2} />
      </span>
      <span className="min-w-0">
        <span className={`block truncate font-heading font-bold leading-none text-main ${lg ? 'text-title' : 'text-heading'}`}>
          Yanko<span className="text-primary-600 dark:text-primary-400">POS</span>
          {suffix}
        </span>
        {subtitle && <span className="mt-1 block text-caption text-muted">{subtitle}</span>}
      </span>
    </span>
  );
}
