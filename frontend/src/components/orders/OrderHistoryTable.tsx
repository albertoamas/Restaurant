import type { ReactNode } from 'react';
import { OrderStatus, BOLIVIA_TZ } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { useAuth } from '../../context/auth.context';
import { useBranchNames } from '../../hooks/useBranches';
import { Badge } from '../ui/Badge';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderActionsMenu } from './OrderActionsMenu';
import { paymentSummary } from './OrderCard';

function formatDateCell(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const opts = { timeZone: BOLIVIA_TZ } as const;
  return {
    date: new Intl.DateTimeFormat('es-BO', { ...opts, day: '2-digit', month: 'short' }).format(d),
    time: new Intl.DateTimeFormat('es-BO', { ...opts, hour: '2-digit', minute: '2-digit' }).format(d),
  };
}

function itemsSummary(items: OrderDto['items']): string {
  const preview = items.slice(0, 2).map((i) => `${i.quantity} ${i.productName}`).join(', ');
  const extra = items.length - 2;
  return extra > 0 ? `${preview} y ${extra} más` : preview;
}

function Payment({ order }: { order: OrderDto }) {
  if (order.isPaid) return <span className="text-label text-soft">{paymentSummary(order)}</span>;
  if (order.status === OrderStatus.CANCELLED) return <span className="text-label text-muted">-</span>;
  return <Badge variant="warning">Sin cobrar</Badge>;
}

interface Props {
  orders:         OrderDto[];
  onPayOrder:     (order: OrderDto) => void;
  onEdit:         (order: OrderDto) => void;
  onStatusChange: (id: string, s: OrderStatus) => void;
}

const TH = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <th scope="col" className={`py-3 text-label font-semibold text-soft ${className}`}>{children}</th>
);

/**
 * Historial de pedidos: tabla desde `md`; en celular, una lista de tarjetas (la tabla no entra
 * y quedaba cortada). Las acciones van en el mismo menú "Más" que en Operación.
 */
export function OrderHistoryTable({ orders, onPayOrder, onEdit, onStatusChange }: Props) {
  const { currentBranchId } = useAuth();
  const { branchName } = useBranchNames();
  // Solo en la vista consolidada: con una sucursal fija la etiqueta es ruido.
  const branchOf = (o: OrderDto) => (currentBranchId === null ? branchName(o.branchId) : null);
  const menu = (o: OrderDto) => (
    <OrderActionsMenu order={o} onEdit={onEdit} onStatusChange={onStatusChange} onPayOrder={onPayOrder} />
  );

  return (
    <div className="rounded-card border border-line bg-surface-card shadow-raised overflow-hidden">
      {/* Celular */}
      <ul className="md:hidden divide-y divide-line">
        {orders.map((o) => {
          const { date, time } = formatDateCell(o.createdAt);
          const branch = branchOf(o);
          return (
            <li key={o.id} className={`flex items-start gap-3 p-4 ${o.status === OrderStatus.CANCELLED ? 'opacity-70' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-body font-bold text-main">#{o.orderNumber}</span>
                  <OrderStatusBadge status={o.status} />
                </div>
                <p className="mt-1 text-label text-soft">
                  {date}, {time}{o.customer ? `, ${o.customer.name}` : ''}{branch ? `, ${branch}` : ''}
                </p>
                <p className="mt-1 text-label text-soft truncate">{itemsSummary(o.items)}</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-body font-bold text-main">Bs {o.total.toFixed(2)}</span>
                  <Payment order={o} />
                </div>
              </div>
              {menu(o)}
            </li>
          );
        })}
      </ul>

      {/* Tablet y escritorio */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-2 border-b border-line text-left">
              <TH className="pl-4 pr-3">Pedido</TH>
              <TH className="px-3">Fecha</TH>
              <TH className="px-3">Cliente</TH>
              <TH className="px-3 hidden lg:table-cell">Productos</TH>
              <TH className="px-3 text-right">Total</TH>
              <TH className="px-3">Estado</TH>
              <TH className="px-3">Pago</TH>
              <th scope="col" className="pl-2 pr-4"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((o) => {
              const { date, time } = formatDateCell(o.createdAt);
              const branch = branchOf(o);
              return (
                <tr key={o.id} className={`hover:bg-surface-2 transition-colors ${o.status === OrderStatus.CANCELLED ? 'opacity-70' : ''}`}>
                  <td className="pl-4 pr-3 py-3 whitespace-nowrap text-body font-bold text-main">#{o.orderNumber}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <p className="text-label text-main">{date}</p>
                    <p className="text-caption text-muted">{time}{branch ? `, ${branch}` : ''}</p>
                  </td>
                  <td className="px-3 py-3 max-w-40">
                    <span className="block truncate text-label text-main">{o.customer?.name ?? '-'}</span>
                  </td>
                  <td className="px-3 py-3 hidden lg:table-cell max-w-64">
                    <span className="block truncate text-label text-soft">{itemsSummary(o.items)}</span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-right text-body font-bold text-main">Bs {o.total.toFixed(2)}</td>
                  <td className="px-3 py-3 whitespace-nowrap"><OrderStatusBadge status={o.status} /></td>
                  <td className="px-3 py-3 whitespace-nowrap"><Payment order={o} /></td>
                  <td className="pl-2 pr-4 py-2 text-right">{menu(o)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
