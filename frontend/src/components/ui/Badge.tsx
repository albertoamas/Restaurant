import { type ReactNode } from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  children: ReactNode;
  dot?: boolean;
}

const variants = {
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  error:   'bg-red-50 text-red-700 border border-red-200',
  info:    'bg-primary-50 text-primary-700 border border-primary-200',
  neutral: 'bg-gray-100 text-gray-700 border border-gray-200',
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
