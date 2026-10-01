import { useState } from 'react';
import { OrderStatus, UserRole } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { ActionMenu, type ActionMenuItem } from '../ui/ActionMenu';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useAuth } from '../../context/auth.context';
import { useReceiptSettings } from '../../hooks/useReceiptSettings';
import { printKitchenTicket, printReceipt } from '../../utils/print';

export const ACTIVE_STATUSES = new Set([OrderStatus.PENDING, OrderStatus.PREPARING]);

interface Props {
  order: OrderDto;
  onEdit: (order: OrderDto) => void;
  onStatusChange: (id: string, s: OrderStatus) => void;
  /** En el historial "Cobrar" va en el menú; en la tarjeta de Operación ya está a la vista. */
  onPayOrder?: (order: OrderDto) => void;
}

/**
 * Menú "Más" de un pedido: editar, imprimir y cancelar (con confirmación). Lo usan la tarjeta
 * de Operación y la fila del historial, con las mismas reglas de permisos.
 */
export function OrderActionsMenu({ order, onEdit, onStatusChange, onPayOrder }: Props) {
  const { user } = useAuth();
  const receiptSettings = useReceiptSettings();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const isCancelled = order.status === OrderStatus.CANCELLED;
  const isDelivered = order.status === OrderStatus.DELIVERED;
  const isOwner     = user?.role === UserRole.OWNER;
  // Cajero: solo cancela pedidos activos. Dueño: también los entregados.
  const canCancel = !isCancelled && (ACTIVE_STATUSES.has(order.status) || (isDelivered && isOwner));
  const canEdit   = !isCancelled && (!isDelivered || isOwner);

  const items: ActionMenuItem[] = [
    ...(onPayOrder && !order.isPaid && !isCancelled ? [{ label: 'Cobrar', icon: 'cash' as const, onSelect: () => onPayOrder(order) }] : []),
    ...(canEdit ? [{ label: 'Editar pedido', icon: 'edit' as const, onSelect: () => onEdit(order) }] : []),
    ...(!isCancelled ? [{ label: 'Imprimir comanda', icon: 'print' as const, onSelect: () => printKitchenTicket(order) }] : []),
    ...(order.isPaid ? [{ label: 'Imprimir recibo', icon: 'document' as const, onSelect: () => printReceipt(order, receiptSettings) }] : []),
    ...(canCancel ? [{ label: 'Cancelar pedido', icon: 'ban' as const, danger: true, onSelect: () => setConfirmCancel(true) }] : []),
  ];

  return (
    <>
      <ActionMenu label={`Más acciones del pedido #${order.orderNumber}`} items={items} />
      <ConfirmModal
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => { setConfirmCancel(false); onStatusChange(order.id, OrderStatus.CANCELLED); }}
        variant="danger"
        title={`Cancelar pedido #${order.orderNumber}`}
        message="El pedido queda cancelado y sale de la cocina. Esta acción no se puede deshacer."
        confirmLabel="Cancelar pedido"
        cancelLabel="Volver"
      />
    </>
  );
}
