import { type ReactNode, type ElementType } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  /**
   * - default: tarjeta sobre la página (superficie blanca, borde y sombra leve).
   * - panel: bloque de contenido secundario, un escalón más bajo que la tarjeta.
   * - inset: zona hundida dentro de una tarjeta (resúmenes, totales, filtros).
   */
  variant?: 'default' | 'panel' | 'inset';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: ElementType;
  onClick?: () => void;
}

const variants = {
  default: 'bg-surface-card border border-line shadow-raised',
  panel:   'bg-surface-2 border border-line',
  inset:   'bg-surface-2 border border-line shadow-[inset_0_1px_2px_oklch(0_0_0/0.04)]',
};

const paddings = {
  none: '',
  sm:   'p-4',
  md:   'p-5 sm:p-6',
  lg:   'p-6 sm:p-8',
};

export function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  as: Tag = 'div',
  onClick,
}: CardProps) {
  const interactive = onClick
    ? 'cursor-pointer transition-[border-color,box-shadow] duration-150 hover:border-line-strong hover:shadow-floating'
    : '';

  return (
    <Tag
      className={`rounded-card ${variants[variant]} ${paddings[padding]} ${interactive} ${className}`}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}
