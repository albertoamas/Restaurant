import { type ButtonHTMLAttributes } from 'react';

/**
 * - primary: la acción principal de la pantalla o del modal (una por vista).
 * - secondary: acciones secundarias y "Cancelar".
 * - ghost: acciones terciarias sin peso visual (en barras, listas, cabeceras).
 * - danger: acciones destructivas (eliminar, anular).
 * - success: cobrar / confirmar un pago. Verde por convención de caja.
 * - info: avanzar un proceso a un paso intermedio (ej.: "Iniciar preparación"). Azul.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'info';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** sm 36 px (barras y tablas) · md 44 px (táctil, por defecto) · lg 48 px · xl 56 px (cobrar). */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary:   'bg-primary-600 text-white border border-primary-600 hover:bg-primary-700 hover:border-primary-700 shadow-raised',
  secondary: 'bg-surface-card text-main border border-line hover:bg-surface-2 hover:border-line-strong',
  ghost:     'bg-transparent text-soft border border-transparent hover:bg-surface-2 hover:text-main',
  // red/green-700: tonos que no cambian con el tema (las escalas de estado se aclaran en
  // oscuro para usarse como texto, y el blanco encima dejaría de leerse).
  danger:    'bg-red-700 text-white border border-red-700 hover:bg-red-800 hover:border-red-800 shadow-raised',
  success:   'bg-green-700 text-white border border-green-700 hover:bg-green-800 hover:border-green-800 shadow-raised',
  // Azul fijo (oklch) por la misma razón: sky/blue se redefinen en oscuro.
  info:      'bg-[oklch(0.50_0.15_240)] text-white border border-[oklch(0.50_0.15_240)] hover:bg-[oklch(0.44_0.15_240)] hover:border-[oklch(0.44_0.15_240)] shadow-raised',
};

const sizes = {
  sm: 'min-h-9 px-3 text-label gap-1.5',
  md: 'min-h-11 px-4 text-body gap-2',
  lg: 'min-h-12 px-5 text-body gap-2',
  xl: 'min-h-14 px-6 text-heading gap-2.5',
};

/**
 * Clases de un botón del kit, para enlaces que deben verse como botón (`<Link>`, `<a>`).
 * Un `<button>` que solo navega no se anuncia como enlace ni se abre en otra pestaña.
 */
export function buttonClasses({ variant = 'primary', size = 'md', fullWidth = false, className = '' }: {
  variant?: ButtonVariant; size?: keyof typeof sizes; fullWidth?: boolean; className?: string;
} = {}): string {
  return [
    'inline-flex items-center justify-center rounded-control font-semibold',
    'transition-[background-color,border-color,color,box-shadow] duration-150 active:brightness-95',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page',
    // Deshabilitado: neutro para todas las variantes. Un color de marca "apagado" se
    // confunde con un botón activo (el "Cobrar" verde pálido).
    'disabled:cursor-not-allowed disabled:shadow-none disabled:active:brightness-100',
    'disabled:bg-surface-3 disabled:border-line disabled:text-muted',
    variants[variant],
    sizes[size],
    fullWidth ? 'w-full' : '',
    className,
  ].join(' ');
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClasses({ variant, size, fullWidth, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
