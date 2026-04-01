import { OrderStatus } from '@pos/shared';
import { Badge } from '../ui/Badge';

const statusConfig: Record<OrderStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
  [OrderStatus.PENDING]: { label: 'Pendiente', variant: 'warning' },
  [OrderStatus.PREPARING]: { label: 'Preparando', variant: 'info' },
  [OrderStatus.DELIVERED]: { label: 'Entregado', variant: 'success' },
  [OrderStatus.CANCELLED]: { label: 'Cancelado', variant: 'error' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant} dot>{config.label}</Badge>;
}
