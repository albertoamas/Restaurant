import { OrderStatus } from '@pos/shared';
import type { IconName } from '../ui/Icon';
import type { ButtonVariant } from '../ui/Button';

/**
 * Un color por fase del pedido, el mismo en la etiqueta, el borde de la tarjeta, la barra de
 * progreso y el botón que lleva a esa fase: pendiente ámbar, preparando azul, entregado verde,
 * cancelado rojo. Así se distingue de un vistazo en qué punto está cada pedido.
 */
export const ORDER_STATUS_UI: Record<OrderStatus, {
  label: string;
  badge: string;
  dot: string;
  /** Borde izquierdo de la tarjeta. */
  accent: string;
  /** Relleno de la barra de progreso y texto de la fase actual. */
  bar: string;
  text: string;
}> = {
  [OrderStatus.PENDING]: {
    label: 'Pendiente',
    badge: 'bg-amber-500/14 text-amber-700 dark:text-amber-300 border border-amber-500/30',
    dot: 'bg-amber-500',
    accent: 'border-l-amber-500',
    bar: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
  },
  [OrderStatus.PREPARING]: {
    label: 'Preparando',
    badge: 'bg-sky-500/12 text-sky-700 border border-sky-500/30',
    dot: 'bg-sky-500',
    accent: 'border-l-sky-500',
    bar: 'bg-sky-500',
    text: 'text-sky-700',
  },
  [OrderStatus.DELIVERED]: {
    label: 'Entregado',
    badge: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25',
    dot: 'bg-emerald-500',
    accent: 'border-l-emerald-500',
    bar: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  [OrderStatus.CANCELLED]: {
    label: 'Cancelado',
    badge: 'bg-red-500/12 text-red-700 dark:text-red-300 border border-red-500/25',
    dot: 'bg-red-500',
    accent: 'border-l-red-500',
    bar: 'bg-red-500',
    text: 'text-red-700 dark:text-red-300',
  },
};

/** Fases que recorre un pedido, en orden, para la barra de progreso. */
export const ORDER_STEPS = [
  { status: OrderStatus.PENDING,   label: 'Recibido' },
  { status: OrderStatus.PREPARING, label: 'Preparando' },
  { status: OrderStatus.DELIVERED, label: 'Entregado' },
] as const;

/** Siguiente paso de un pedido activo: el botón toma el color de la fase a la que lleva. */
export const NEXT_STEP: Partial<Record<OrderStatus, { label: string; status: OrderStatus; icon: IconName; variant: ButtonVariant }>> = {
  [OrderStatus.PENDING]:   { label: 'Iniciar preparación',   status: OrderStatus.PREPARING, icon: 'flame', variant: 'info' },
  [OrderStatus.PREPARING]: { label: 'Marcar como entregado', status: OrderStatus.DELIVERED, icon: 'check', variant: 'success' },
};
