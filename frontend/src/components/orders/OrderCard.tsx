import { OrderStatus } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { orderTypeLabels } from '../../utils/order';
import { durationLabel, formatBoliviaTime, minutesBetween, timeAgo } from '../../utils/date';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { OrderStatusBadge } from './OrderStatusBadge';
import { NEXT_STEP, ORDER_STATUS_UI, ORDER_STEPS } from './order-status';
import { OrderActionsMenu, ACTIVE_STATUSES } from './OrderActionsMenu';
import { paymentMethodLabel } from '../pos/PaymentMethodSection';
import { useAuth } from '../../context/auth.context';
import { useBranchNames } from '../../hooks/useBranches';
import { useNow } from '../../hooks/useNow';
import { bs } from '../../utils/money';

/** A partir de estos minutos el tiempo de espera pasa a ámbar y a rojo. */
const WAIT_WARNING_MIN = 5;
const WAIT_URGENT_MIN  = 10;

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

/** Barra de tres tramos (Recibido, Preparando, Entregado) pintada hasta la fase actual. */
function OrderProgress({ status }: { status: OrderStatus }) {
  const current = ORDER_STEPS.findIndex((s) => s.status === status);
  const ui = ORDER_STATUS_UI[status];
  return (
    <div className="mt-3" role="img" aria-label={`Fase ${current + 1} de ${ORDER_STEPS.length}: ${ORDER_STEPS[current].label}`}>
      <div className="grid grid-cols-3 gap-1">
        {ORDER_STEPS.map((step, i) => (
          <span key={step.status} className={`h-1.5 rounded-full ${i <= current ? ui.bar : 'bg-surface-3'}`} />
        ))}
      </div>
      <div className="mt-1 grid grid-cols-3 gap-1 text-caption">
        {ORDER_STEPS.map((step, i) => (
          <span
            key={step.status}
            className={i === current ? `font-semibold ${ui.text}` : i < current ? 'text-soft' : 'text-muted'}
          >
            {step.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** "Efectivo" o "Efectivo y QR" (pago dividido). */
export function paymentSummary(order: OrderDto): string {
  return order.payments.length > 0
    ? order.payments.map((p) => paymentMethodLabel(p.method)).join(' y ')
    : '-';
}

/** Momento del pedido fuera de la espera activa: entregado (y cuánto tardó) o creado. */
function orderMoment(order: OrderDto): string {
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
  const needsPayment = !order.isPaid && !isCancelled;
  /** Cobrar junto a un siguiente paso, o Añadir. Sin ninguno, el menú va al lado de la acción principal. */
  const hasSecondary = Boolean(next && needsPayment) || isActive;
  const hasActions   = Boolean(next) || needsPayment;
  // Solo en la vista consolidada: con una sucursal fija la etiqueta es ruido.
  const branchLabel = currentBranchId === null ? branchName(order.branchId) : null;

  return (
    <article
      aria-label={`Pedido #${order.orderNumber}`}
      className={[
        'rounded-card border border-line border-l-4 bg-surface-card shadow-raised p-4 animate-fade',
        ORDER_STATUS_UI[order.status].accent,
        isCancelled ? 'opacity-70' : '',
      ].join(' ')}
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

      {!isCancelled && <OrderProgress status={order.status} />}

      <div className="mt-4 pt-3 border-t border-line">
        <div className="flex items-center justify-between gap-3">
          <span className="text-heading font-bold text-main font-heading">{bs(order.total)}</span>
          <div className="flex items-center gap-2">
            {needsPayment ? <Badge variant="warning">Sin cobrar</Badge>
              : order.isPaid ? <span className="text-label text-soft">{paymentSummary(order)}</span>
              : null}
            {/* Pedido cerrado (entregado y cobrado, o cancelado): solo queda el menú, junto al total. */}
            {!hasActions && <OrderActionsMenu order={order} onEdit={onEdit} onStatusChange={onStatusChange} />}
          </div>
        </div>

        {/* En celular la acción principal ocupa su propia fila; las secundarias van debajo, parejas. */}
        {hasActions && (
          <div className={`mt-3 flex gap-2 ${hasSecondary ? 'flex-col sm:flex-row' : ''}`}>
            {next ? (
              <Button variant={next.variant} className="flex-1 w-full" onClick={() => onStatusChange(order.id, next.status)}>
                <Icon name={next.icon} size={17} />
                {next.label}
              </Button>
            ) : needsPayment && (
              <Button className="flex-1 w-full" onClick={() => onPayOrder(order)}>
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
        )}
      </div>
    </article>
  );
}
