import { useEffect, useState } from 'react';
import { OrderStatus } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { orderTypeLabels } from '../../utils/order';
import { durationLabel, formatBoliviaTime, minutesBetween, timeAgo } from '../../utils/date';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderActionsMenu, ACTIVE_STATUSES } from './OrderActionsMenu';
import { paymentMethodLabel } from '../pos/PaymentMethodSection';
import { useAuth } from '../../context/auth.context';
import { useBranchNames } from '../../hooks/useBranches';

/** Siguiente paso de un pedido activo: es la acción principal de la tarjeta. */
const NEXT_STEP: Partial<Record<OrderStatus, { label: string; status: OrderStatus }>> = {
  [OrderStatus.PENDING]:   { label: 'Iniciar preparación',   status: OrderStatus.PREPARING },
  [OrderStatus.PREPARING]: { label: 'Marcar como entregado', status: OrderStatus.DELIVERED },
};

/** A partir de estos minutos el tiempo de espera pasa a ámbar y a rojo. */
const WAIT_WARNING_MIN = 5;
const WAIT_URGENT_MIN  = 10;

/** Se recalcula cada 30 s: el tiempo se muestra en minutos, no hace falta más. */
function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function WaitTime({ createdAt }: { createdAt: string }) {
  const now = useNow();
  const minutes = minutesBetween(createdAt, now);
  const tone = minutes >= WAIT_URGENT_MIN
    ? 'text-red-700 dark:text-red-400 font-semibold'
    : minutes >= WAIT_WARNING_MIN
      ? 'text-amber-700 dark:text-amber-300 font-semibold'
      : 'text-soft';
  return (
    <span className={`inline-flex items-center gap-1 text-label ${tone}`}>
      <Icon name="clock" size={14} className="shrink-0" />
      {timeAgo(createdAt, now)}
    </span>
  );
}

/** "Efectivo" o "Efectivo y QR" (pago dividido). */
export function paymentSummary(order: OrderDto): string {
  return order.payments.length > 0
    ? order.payments.map((p) => paymentMethodLabel(p.method)).join(' y ')
    : '-';
}

/** Momento del pedido fuera de la espera activa: entregado (y cuánto tardó) o creado. */
export function orderMoment(order: OrderDto): string {
  return order.status === OrderStatus.DELIVERED
    ? `Entregado ${formatBoliviaTime(order.updatedAt)}, tardó ${durationLabel(minutesBetween(order.createdAt, order.updatedAt))}`
    : `Creado ${formatBoliviaTime(order.createdAt)}`;
}

interface OrderCardProps {
  order: OrderDto;
  onStatusChange: (id: string, s: OrderStatus) => void;
  onPayOrder: (order: OrderDto) => void;
  onEdit: (order: OrderDto) => void;
  onAddItems: (order: OrderDto) => void;
}

/**
 * Pedido en la vista Operación: encabezado en una línea, productos y, abajo, las acciones por
 * prioridad (siguiente paso o cobrar, añadir, y el resto en "Más").
 */
export function OrderCard({ order, onStatusChange, onPayOrder, onEdit, onAddItems }: OrderCardProps) {
  const { currentBranchId } = useAuth();
  const { branchName } = useBranchNames();

  const isCancelled  = order.status === OrderStatus.CANCELLED;
  const isActive     = ACTIVE_STATUSES.has(order.status);
  const next         = NEXT_STEP[order.status];
  /** Cobrar junto a un siguiente paso, o Añadir. Sin ninguno, el menú va al lado de la acción principal. */
  const needsPayment = !order.isPaid && !isCancelled;
  const hasSecondary = Boolean(next && needsPayment) || isActive;
  // Solo en la vista consolidada: con una sucursal fija la etiqueta es ruido.
  const branchLabel = currentBranchId === null ? branchName(order.branchId) : null;

  return (
    <article
      aria-label={`Pedido #${order.orderNumber}`}
      className={`rounded-card border border-line bg-surface-card shadow-raised p-4 animate-fade ${isCancelled ? 'opacity-70' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-heading font-bold text-main font-heading">#{order.orderNumber}</h3>
            <Badge>{orderTypeLabels[order.type]}</Badge>
            {branchLabel && <Badge>{branchLabel}</Badge>}
          </div>
          <div className="mt-1">
            {isActive ? <WaitTime createdAt={order.createdAt} /> : <span className="text-label text-soft">{orderMoment(order)}</span>}
          </div>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <p className="mt-3 text-body text-main">
        {order.items.map((item, i) => (
          <span key={item.id}>
            {i > 0 && ', '}
            <span className="font-semibold">{item.quantity}</span> {item.productName}
          </span>
        ))}
      </p>

      {(order.customer || order.notes) && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-label text-soft">
          {order.customer && (
            <span className="inline-flex items-center gap-1.5"><Icon name="user" size={14} />{order.customer.name}</span>
          )}
          {order.notes && (
            <span className="inline-flex items-center gap-1.5"><Icon name="chat" size={14} />{order.notes}</span>
          )}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-line">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-heading font-bold text-main font-heading">Bs {order.total.toFixed(2)}</span>
          {needsPayment ? <Badge variant="warning">Sin cobrar</Badge>
            : order.isPaid ? <span className="text-label text-soft">{paymentSummary(order)}</span>
            : null}
        </div>

        {/* En celular la acción principal ocupa su propia fila; las secundarias van debajo, parejas. */}
        <div className={`mt-3 flex gap-2 ${hasSecondary ? 'flex-col sm:flex-row' : ''}`}>
          {next ? (
            <Button className="flex-1 w-full" onClick={() => onStatusChange(order.id, next.status)}>
              {next.label}
            </Button>
          ) : needsPayment && (
            <Button variant="success" className="flex-1 w-full" onClick={() => onPayOrder(order)}>
              <Icon name="cash" size={17} />
              Cobrar
            </Button>
          )}
          <div className="flex justify-end gap-2">
            {next && needsPayment && (
              <Button variant="secondary" className="flex-1 sm:flex-none" onClick={() => onPayOrder(order)}>
                <Icon name="cash" size={17} />
                Cobrar
              </Button>
            )}
            {isActive && (
              <Button variant="secondary" className="flex-1 sm:flex-none" onClick={() => onAddItems(order)}>
                <Icon name="plus" size={17} />
                Añadir
              </Button>
            )}
            <OrderActionsMenu order={order} onEdit={onEdit} onStatusChange={onStatusChange} />
          </div>
        </div>
      </div>
    </article>
  );
}
