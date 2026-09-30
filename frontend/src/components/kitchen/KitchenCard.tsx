import { OrderStatus } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import type { IconName } from '../ui/Icon';
import type { ButtonVariant } from '../ui/Button';
import { orderTypeLabels } from '../../utils/order';
import { durationLabel, minutesBetween } from '../../utils/date';

/** A partir de estos minutos el tiempo pasa a ámbar y a rojo (igual que en Pedidos); en rojo, también el borde. */
const WAIT_WARNING_MIN = 5;
const WAIT_URGENT_MIN  = 10;

/** Acción de cada columna: mismo color e ícono que el siguiente paso en Pedidos. */
const ACTION: Partial<Record<OrderStatus, { label: string; next: OrderStatus; icon: IconName; variant: ButtonVariant }>> = {
  [OrderStatus.PENDING]:   { label: 'Iniciar preparación', next: OrderStatus.PREPARING, icon: 'flame', variant: 'info' },
  [OrderStatus.PREPARING]: { label: 'Listo para entregar', next: OrderStatus.DELIVERED, icon: 'check', variant: 'success' },
};

function waitTone(minutes: number) {
  if (minutes >= WAIT_URGENT_MIN) {
    return { border: 'border-t-red-500', pill: 'bg-red-500/12 text-red-700 dark:text-red-300 border-red-500/30' };
  }
  if (minutes >= WAIT_WARNING_MIN) {
    // Sin borde de color: el ámbar ya identifica la columna Pendientes y se confundiría.
    return { border: 'border-t-line', pill: 'bg-amber-500/14 text-amber-800 dark:text-amber-300 border-amber-500/30' };
  }
  return { border: 'border-t-line', pill: 'bg-surface-2 text-soft border-line' };
}

interface KitchenCardProps {
  order: OrderDto;
  /** Hora actual compartida por todas las tarjetas (se recalcula cada pocos segundos). */
  now: number;
  /** El pendiente más antiguo: es el que se prepara ahora. */
  isNext?: boolean;
  onAction: (id: string, status: OrderStatus) => void;
}

/** Comanda en la pantalla de cocina: se lee de lejos, con una sola acción. */
export function KitchenCard({ order, now, isNext = false, onAction }: KitchenCardProps) {
  const minutes = minutesBetween(order.createdAt, now);
  const tone = waitTone(minutes);
  const action = ACTION[order.status];

  return (
    <article
      aria-label={`Pedido #${order.orderNumber}`}
      className={`flex flex-col rounded-card border border-line border-t-4 ${tone.border} bg-surface-card shadow-raised animate-slide`}
    >
      <header className="flex items-start justify-between gap-3 px-4 pt-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-display font-bold text-main font-heading leading-none tabular-nums">#{order.orderNumber}</h3>
            <Badge>{orderTypeLabels[order.type]}</Badge>
            {isNext && <Badge variant="warning">Siguiente</Badge>}
          </div>
          {order.customer && (
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-label text-soft">
              <Icon name="user" size={14} />
              {order.customer.name}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-label font-semibold tabular-nums ${tone.pill}`}
          aria-label={`Esperando ${durationLabel(minutes)}`}
        >
          <Icon name="clock" size={14} />
          {durationLabel(minutes)}
        </span>
      </header>

      <ul className="mx-4 mt-3 divide-y divide-line">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-baseline gap-3 py-2">
            <span className="w-9 shrink-0 text-right text-title font-bold text-main font-heading tabular-nums">{item.quantity}</span>
            <span className="text-heading font-semibold text-main leading-snug">{item.productName}</span>
          </li>
        ))}
      </ul>

      {order.notes && (
        <p className="mx-4 mt-2 flex items-start gap-2 rounded-control border border-amber-500/40 bg-amber-500/14 px-3 py-2.5 text-body text-amber-900 dark:text-amber-300">
          <Icon name="chat" size={18} className="shrink-0 mt-0.5" />
          <span><span className="font-semibold">Nota:</span> {order.notes}</span>
        </p>
      )}

      {action && (
        <div className="mt-auto px-4 pb-4 pt-3">
          <Button
            variant={action.variant}
            size="xl"
            fullWidth
            onClick={() => onAction(order.id, action.next)}
            aria-label={`${action.label}, pedido #${order.orderNumber}`}
          >
            <Icon name={action.icon} size={20} />
            {action.label}
          </Button>
        </div>
      )}
    </article>
  );
}
