import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { CustomerStatsDto } from '@pos/shared';
import { ordersApi } from '../../api/orders.api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Icon } from '../ui/Icon';
import { Skeleton } from '../ui/Skeleton';
import { OrderStatusBadge } from '../orders/OrderStatusBadge';
import { paymentSummary } from '../orders/OrderCard';
import { orderTypeLabels } from '../../utils/order';
import { formatBoliviaDateShort, formatBoliviaTime } from '../../utils/date';
import { bs } from '../../utils/money';
import { queryKeys } from '../../lib/query-keys';

const HISTORY_PAGE = 20;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-control border border-line bg-surface-2 px-3 py-2">
      <p className="text-caption text-muted">{label}</p>
      <p className="text-body font-bold text-main tabular-nums whitespace-nowrap">{value}</p>
    </div>
  );
}

/** Pedidos del cliente, de a 20: un cliente frecuente pasa de largo los 50 que se veían antes. */
function OrderHistory({ customerId }: { customerId: string }) {
  const { data, isPending, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: queryKeys.customerOrders(customerId),
    queryFn:  ({ pageParam }) => ordersApi.getAll({ customerId, page: pageParam, limit: HISTORY_PAGE }),
    initialPageParam: 1,
    getNextPageParam: (last, all) => {
      const loaded = all.reduce((n, p) => n + p.data.length, 0);
      return loaded < last.total ? all.length + 1 : undefined;
    },
  });
  const orders = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;

  if (isPending) return <Skeleton variant="rect" h="160px" />;
  if (orders.length === 0) return <EmptyState compact icon="bag" title="Todavía no tiene pedidos" />;

  return (
    <div>
      <ul className="divide-y divide-line rounded-control border border-line">
        {orders.map((o) => (
          <li key={o.id} className="px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 text-body font-semibold text-main">
                #{o.orderNumber}
                <span className="ml-2 text-label font-normal text-soft">
                  {formatBoliviaDateShort(o.createdAt)}, {formatBoliviaTime(o.createdAt)}
                </span>
              </p>
              <OrderStatusBadge status={o.status} />
            </div>
            <p className="mt-1 text-label text-soft">
              {o.items.map((i) => `${i.quantity} ${i.productName}`).join(', ')}
            </p>
            <div className="mt-1 flex items-baseline justify-between gap-3 text-caption text-muted">
              <span>{orderTypeLabels[o.type]}. {o.isPaid ? paymentSummary(o) : 'Sin cobrar'}</span>
              <span className="text-body font-semibold text-main tabular-nums">{bs(o.total)}</span>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-col items-center gap-2">
        <p className="text-label text-soft">Mostrando {orders.length} de {total}</p>
        {hasNextPage && (
          <Button variant="secondary" size="sm" onClick={() => { void fetchNextPage(); }} loading={isFetchingNextPage}>
            Ver más pedidos
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Ficha del cliente: sus cifras, cómo contactarlo, sus notas y sus pedidos, con Editar y Eliminar.
 * Reemplaza los dos botones por fila (historial y editar) que mostraban al cliente por separado.
 */
export function CustomerSheet({ customer, periodLabel, onClose, onEdit, onDelete }: {
  customer: CustomerStatsDto;
  /** Las cifras del cliente son del período elegido en la lista ("Histórico" o un rango). */
  periodLabel: string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={customer.name}
      size="md"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onDelete}>
            <Icon name="trash" size={18} />
            Eliminar
          </Button>
          <Button fullWidth onClick={onEdit}>
            <Icon name="edit" size={18} />
            Editar
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <section aria-label="Cifras">
          <p className="mb-2 text-label text-soft">{periodLabel}</p>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Gastado" value={bs(customer.totalSpent)} />
            <Stat label="Compras" value={String(customer.purchaseCount)} />
            <Stat label="Última compra" value={customer.lastOrderAt ? formatBoliviaDateShort(customer.lastOrderAt) : '-'} />
          </div>
        </section>

        {(customer.phone || customer.email || customer.notes) && (
          <dl className="divide-y divide-line border-y border-line">
            {customer.phone && (
              <div className="flex justify-between gap-4 py-2"><dt className="text-label text-soft">Teléfono</dt><dd className="text-body text-main">{customer.phone}</dd></div>
            )}
            {customer.email && (
              <div className="flex justify-between gap-4 py-2"><dt className="text-label text-soft">Correo</dt><dd className="min-w-0 truncate text-body text-main">{customer.email}</dd></div>
            )}
            {customer.notes && (
              <div className="flex justify-between gap-4 py-2"><dt className="text-label text-soft">Notas</dt><dd className="text-right text-body text-main">{customer.notes}</dd></div>
            )}
          </dl>
        )}

        <section aria-label="Pedidos">
          <h3 className="mb-2 text-heading font-semibold text-main">Pedidos</h3>
          <OrderHistory customerId={customer.id} />
        </section>
      </div>
    </Modal>
  );
}
