import { type ReactNode } from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  children: ReactNode;
  dot?: boolean;
}

const variants = {
  success: 'bg-emerald-500/12 text-emerald-600 border border-emerald-500/25',
  warning: 'bg-amber-500/12 text-amber-600 border border-amber-500/25',
  error:   'bg-red-500/12 text-red-600 border border-red-500/25',
  info:    'bg-primary-500/10 text-primary-600 border border-primary-500/20',
  neutral: 'bg-[var(--color-surface-2)] text-gray-700 border border-[var(--border-subtle)]',
};

const dotColors = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error:   'bg-red-500',
  info:    'bg-primary-500',
  neutral: 'bg-gray-400',
};

export function Badge({ variant = 'neutral', children, dot = false }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
}
