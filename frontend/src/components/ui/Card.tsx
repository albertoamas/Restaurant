import { type ReactNode, type ElementType } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'inset' | 'glass' | 'flat';
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
  return (
    <Tag
      className={`rounded-xl ${variants[variant]} ${paddings[padding]} ${className}`}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}
