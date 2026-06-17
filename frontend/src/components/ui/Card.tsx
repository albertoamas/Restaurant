import { type ReactNode, type ElementType } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'inset' | 'glass' | 'glass-strong' | 'flat' | 'panel' | 'feature';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: ElementType;
  onClick?: () => void;
}

const variants = {
  default:  'bg-[var(--color-surface-card)] border border-[var(--border-subtle)] shadow-card-md',
  elevated: [
    'bg-[var(--color-surface-card)] border border-[var(--border-subtle)]',
    'shadow-card-md',
    'hover:-translate-y-0.5 hover:shadow-card-lg',
    'transition-[transform,box-shadow] duration-200',
  ].join(' '),
  inset:        'bg-[var(--color-surface-2)] border border-[var(--border-subtle)]',
  glass:        'bg-[var(--color-surface-2)] backdrop-blur-xl border border-[var(--border-subtle)] shadow-card-lg',
  'glass-strong': 'bg-[var(--color-surface-2)] backdrop-blur-2xl border border-[var(--border-subtle)] shadow-[0_10px_40px_oklch(0.06_0.010_38/0.5)]',
  flat:         'bg-[var(--color-surface-2)] border border-[var(--border-subtle)]',
  panel:        'bg-[var(--color-surface-2)] backdrop-blur-md border border-[var(--border-subtle)]',
  feature: [
    'bg-[var(--color-surface-card)] border border-primary-800/50',
    'shadow-[0_12px_32px_oklch(0.60_0.22_42/0.15),0_1px_2px_oklch(0.06_0.010_38/0.4)]',
    'relative overflow-hidden',
  ].join(' '),
};

const paddings = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
};

export function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  as: Tag = 'div',
  onClick,
}: CardProps) {
  const interactive = onClick ? 'cursor-pointer transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5' : '';

  return (
    <Tag
      className={`rounded-xl ${variants[variant]} ${paddings[padding]} ${interactive} ${className}`}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}
