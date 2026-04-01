import { type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'emerald';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
}

const variants = {
  primary: [
    'bg-gradient-to-b from-primary-500 to-primary-600 text-white',
    'shadow-[0_1px_3px_oklch(0.13_0.012_260/0.12),inset_0_1px_0_oklch(1_0_0/0.15)]',
    'hover:from-primary-600 hover:to-primary-700',
    'hover:shadow-[0_4px_14px_oklch(0.50_0.24_225/0.35)]',
    'focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-1',
  ].join(' '),

  secondary: [
    'bg-white border border-gray-200 text-gray-800',
    'shadow-[0_1px_2px_oklch(0.13_0.012_260/0.06)]',
    'hover:border-primary-300 hover:bg-primary-50/50',
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

  emerald: [
    'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white',
    'shadow-[0_1px_3px_oklch(0.13_0.012_260/0.12),inset_0_1px_0_oklch(1_0_0/0.12)]',
    'hover:from-emerald-600 hover:to-emerald-700',
    'hover:shadow-[0_4px_16px_oklch(0.55_0.18_145/0.40)]',
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
        'active:scale-[0.96] active:brightness-95',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:active:brightness-100',
        'focus-visible:outline-none',
        variants[variant],
        sizes[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      disabled={disabled || loading}
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
