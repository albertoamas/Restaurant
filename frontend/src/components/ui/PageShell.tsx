/**
 * PageShell — Wrapper consistente para páginas de la app.
 *
 * Provee el padding estándar, max-width, centrado y animación de entrada
 * para todas las páginas del panel principal.
 *
 * Uso:
 *   <PageShell>...</PageShell>
 *   <PageShell maxWidth="6xl" className="space-y-6">...</PageShell>
 */

import type { ReactNode } from 'react';

type MaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';

interface PageShellProps {
  children: ReactNode;
  /** Max-width del contenedor. Default: '5xl' */
  maxWidth?: MaxWidth;
  /** Clases adicionales para el contenedor raíz */
  className?: string;
}

const MAX_WIDTH_CLASS: Record<MaxWidth, string> = {
  sm:    'max-w-sm',
  md:    'max-w-md',
  lg:    'max-w-lg',
  xl:    'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full:  'max-w-full',
};

export function PageShell({ children, maxWidth = 'full', className = '' }: PageShellProps) {
  return (
    <div className={`p-4 sm:p-6 ${MAX_WIDTH_CLASS[maxWidth]} animate-slide ${className}`}>
      {children}
    </div>
  );
}
