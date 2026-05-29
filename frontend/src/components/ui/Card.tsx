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
  default:  'bg-white/92 backdrop-blur-sm border border-white/70 shadow-[0_2px_12px_oklch(0.13_0.012_260/0.10)]',
  elevated: [
    'bg-white/95 backdrop-blur-md border border-white/70',
    'shadow-[0_4px_20px_oklch(0.13_0.012_260/0.12)]',
    'hover:-translate-y-0.5 hover:shadow-[0_8px_28px_oklch(0.13_0.012_260/0.16)]',
    'transition-[transform,box-shadow] duration-200',
  ].join(' '),
  inset:    'bg-white/40 backdrop-blur-sm border border-white/50',
  glass:    'bg-white/80 backdrop-blur-xl border border-white/65 shadow-[0_8px_32px_oklch(0.13_0.012_260/0.10)]',
  'glass-strong': 'bg-white/92 backdrop-blur-2xl border border-white/75 shadow-[0_10px_40px_oklch(0.13_0.012_260/0.14),inset_0_1px_0_oklch(1_0_0/0.60)]',
  flat:     'bg-white/90 backdrop-blur-sm border border-white/70',
  panel:    'bg-white/70 backdrop-blur-md border border-white/60 shadow-[inset_0_1px_0_oklch(1_0_0/0.40)]',
  feature: [
    'bg-white/95 border border-primary-100/70',
    'shadow-[0_12px_32px_oklch(0.50_0.24_225/0.12),0_1px_2px_oklch(0.13_0.012_260/0.08)]',
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
