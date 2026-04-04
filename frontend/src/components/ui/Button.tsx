import { type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'emerald' | 'outline' | 'soft';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
}

const variants = {
  primary: [
    'bg-primary-600 text-white border border-primary-600',
    'shadow-[0_1px_2px_oklch(0.13_0.012_260/0.10)]',
    'hover:bg-primary-700 hover:border-primary-700',
    'hover:shadow-[0_3px_10px_oklch(0.45_0.16_235/0.24)]',
    'focus-visible:ring-2 focus-visible:ring-primary-500/35 focus-visible:ring-offset-1',
  ].join(' '),

  secondary: [
    'bg-white border border-gray-200 text-gray-800',
    'shadow-[0_1px_2px_oklch(0.13_0.012_260/0.06)]',
    'hover:border-primary-300 hover:bg-primary-50/35',
  ].join(' '),

  danger: [
    'bg-gradient-to-b from-red-500 to-red-600 text-white',
    'shadow-[0_1px_3px_oklch(0.13_0.012_260/0.12),inset_0_1px_0_oklch(1_0_0/0.12)]',
    'hover:from-red-600 hover:to-red-700',
    'hover:shadow-[0_4px_12px_oklch(0.55_0.22_25/0.35)]',
  ].join(' '),

  ghost: [
    'bg-transparent text-gray-600',
    'hover:bg-gray-100 hover:text-gray-900',
  ].join(' '),

  outline: [
    'bg-transparent border border-gray-300 text-gray-700',
    'hover:border-primary-500 hover:text-primary-800 hover:bg-primary-50/25',
  ].join(' '),

  soft: [
    'bg-primary-100 text-primary-800 border border-primary-200',
    'hover:bg-primary-200/80 hover:border-primary-300',
  ].join(' '),

  emerald: [
    'bg-emerald-600 text-white border border-emerald-600',
    'shadow-[0_1px_2px_oklch(0.13_0.012_260/0.10)]',
    'hover:bg-emerald-700 hover:border-emerald-700',
    'hover:shadow-[0_3px_10px_oklch(0.52_0.14_150/0.24)]',
    'focus-visible:ring-2 focus-visible:ring-emerald-500/35 focus-visible:ring-offset-1',
  ].join(' '),
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
  xl: 'px-7 py-4 text-base rounded-xl font-bold tracking-wide',
};

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
      className={[
        'font-medium transition-all duration-150',
        'active:brightness-95',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:brightness-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/45 focus-visible:ring-offset-2',
        variants[variant],
        sizes[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
