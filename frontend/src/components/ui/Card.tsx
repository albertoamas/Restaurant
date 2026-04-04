import { type ReactNode, type ElementType } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'inset' | 'glass' | 'flat' | 'panel' | 'feature';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: ElementType;
  onClick?: () => void;
}

const variants = {
  default:  'bg-white border border-gray-100 shadow-[0_1px_3px_oklch(0.13_0.012_260/0.08)]',
  elevated: [
    'bg-white border border-gray-100',
    'shadow-[0_1px_3px_oklch(0.13_0.012_260/0.08),0_4px_12px_oklch(0.13_0.012_260/0.06)]',
    'hover:-translate-y-0.5 hover:shadow-[0_4px_16px_oklch(0.13_0.012_260/0.12)]',
    'transition-[transform,box-shadow] duration-200',
  ].join(' '),
  inset:    'bg-gray-50 border border-gray-200',
  glass:    'bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_4px_24px_oklch(0.13_0.012_260/0.08)]',
  flat:     'bg-white border border-gray-100',
  panel:    'bg-[oklch(0.985_0.006_250)] border border-[oklch(0.90_0.01_250)] shadow-[inset_0_1px_0_oklch(1_0_0/0.35)]',
  feature: [
    'bg-white border border-primary-100',
    'shadow-[0_10px_28px_oklch(0.50_0.24_225/0.10),0_1px_2px_oklch(0.13_0.012_260/0.08)]',
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
