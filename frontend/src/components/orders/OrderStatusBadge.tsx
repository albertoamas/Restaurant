import type { OrderStatus } from '@pos/shared';
import { ORDER_STATUS_UI } from './order-status';

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const ui = ORDER_STATUS_UI[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-caption font-semibold whitespace-nowrap ${ui.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ui.dot}`} />
      {ui.label}
    </span>
  );
}
