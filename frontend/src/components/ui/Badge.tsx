import { type ReactNode } from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  children: ReactNode;
  dot?: boolean;
}

const variants = {
  success: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25',
  warning: 'bg-amber-500/14 text-amber-700 dark:text-amber-300 border border-amber-500/30',
  error:   'bg-red-500/12 text-red-700 dark:text-red-300 border border-red-500/25',
  info:    'bg-primary-500/10 text-primary-700 dark:text-primary-400 border border-primary-500/25',
  neutral: 'bg-surface-2 text-soft border border-line',
};

const dotColors = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error:   'bg-red-500',
  info:    'bg-primary-500',
  neutral: 'bg-muted',
};

export function Badge({ variant = 'neutral', children, dot = false }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-caption font-semibold whitespace-nowrap ${variants[variant]}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
}
