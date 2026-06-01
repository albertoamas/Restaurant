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
  default:  'bg-[var(--color-surface-card)] border border-white/6 shadow-[0_2px_12px_oklch(0.06_0.010_38/0.6)]',
  elevated: [
    'bg-[var(--color-surface-card)] border border-white/6',
    'shadow-[0_4px_20px_oklch(0.06_0.010_38/0.7)]',
    'hover:-translate-y-0.5 hover:shadow-[0_8px_28px_oklch(0.06_0.010_38/0.8)]',
    'transition-[transform,box-shadow] duration-200',
  ].join(' '),
  inset:    'bg-white/4 border border-white/8',
  glass:    'bg-white/5 backdrop-blur-xl border border-white/8 shadow-[0_8px_32px_oklch(0.06_0.010_38/0.5)]',
  'glass-strong': 'bg-white/8 backdrop-blur-2xl border border-white/10 shadow-[0_10px_40px_oklch(0.06_0.010_38/0.6),inset_0_1px_0_oklch(1_0_0/0.06)]',
  flat:     'bg-[var(--color-surface-2)] border border-white/6',
  panel:    'bg-white/4 backdrop-blur-md border border-white/8 shadow-[inset_0_1px_0_oklch(1_0_0/0.06)]',
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
