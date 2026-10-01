import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { OrderStatus, SOCKET_EVENTS } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { ordersApi } from '../api/orders.api';
import { useSocket, useSocketEvent } from '../context/socket.context';
import { today } from '../utils/date';
import { handleApiError } from '../utils/api-error';
import { queryKeys } from '../lib/query-keys';

const FALLBACK_POLL_MS = 30_000;
/** Tope por estado: sobra para una cocina (el backend admite hasta 200 por página). */
const MAX_PER_STATUS = 200;

/** Primero el que lleva más tiempo esperando: así trabaja una cocina. */
const byArrival = (a: OrderDto, b: OrderDto) => a.createdAt.localeCompare(b.createdAt);

/**
 * Live kitchen orders for the current branch (PENDING + PREPARING only).
 *
 * Real-time strategy:
 *  - WebSocket events (`order.created`, `order.updated`) keep the cache up to date in real time.
 *  - Polling every 30s only when the socket is disconnected (fallback).
 *  - On reconnection, refetches immediately to recover events missed while offline.
 *  - Mutations are optimistic; on error we resync from the server.
 *
 * Se piden los pedidos por estado. Antes se traía la primera página del día (50, los más
 * nuevos) y se filtraba: en un día con movimiento, los pendientes más viejos no aparecían.
 *
 * `onNewPending` avisa de un pedido nuevo de esta sucursal (para el sonido de la cocina).
 */
export function useKitchenOrders(branchId: string | null, onNewPending?: (order: OrderDto) => void) {
  const queryClient     = useQueryClient();
  const { connected }   = useSocket();
  const wasConnectedRef = useRef<boolean | null>(null);

  const qk = queryKeys.kitchenOrders(branchId);
  const onNewPendingRef = useRef(onNewPending);
  onNewPendingRef.current = onNewPending;

  const { data: orders = [] as OrderDto[], refetch, isPending: loading } = useQuery<OrderDto[]>({
    queryKey: qk,
    queryFn:  async () => {
      const byStatus = (status: OrderStatus) => ordersApi
        .getAll({ date: today(), branchId: branchId ?? undefined, status, limit: MAX_PER_STATUS })
        .then((r) => r.data);
      const [pending, preparing] = await Promise.all([
        byStatus(OrderStatus.PENDING), byStatus(OrderStatus.PREPARING),
      ]);
      return [...pending, ...preparing];
    },
    enabled:         !!branchId,
    refetchInterval: connected ? false : FALLBACK_POLL_MS,
  });

  // Catch-up on reconnection — refetch immediately to recover events missed while offline
  useEffect(() => {
    if (wasConnectedRef.current === false && connected) {
      refetch();
    }
    wasConnectedRef.current = connected;
  }, [connected, refetch]);

  // Stable socket handlers so useSocketEvent does not re-register on every render
  // (avoids the frame without listener during off+on).
  const handleOrderCreated = useCallback((order: OrderDto) => {
    if (order.branchId !== branchId) return;
    if (order.status !== OrderStatus.PENDING) return;
    queryClient.setQueryData<OrderDto[]>(qk, (old = []) =>
      old.some((o) => o.id === order.id) ? old : [...old, order]);
    onNewPendingRef.current?.(order);
  }, [branchId, queryClient, qk]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOrderUpdated = useCallback((order: OrderDto) => {
    if (order.branchId !== branchId) return;
    queryClient.setQueryData<OrderDto[]>(qk, (old = []) => {
      if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
        return old.filter((o) => o.id !== order.id);
      }
      return old.map((o) => o.id === order.id ? order : o);
    });
  }, [branchId, queryClient, qk]); // eslint-disable-line react-hooks/exhaustive-deps

  useSocketEvent<OrderDto>(SOCKET_EVENTS.ORDER_CREATED, handleOrderCreated);
  useSocketEvent<OrderDto>(SOCKET_EVENTS.ORDER_UPDATED, handleOrderUpdated);

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      // Optimistic update — server will also emit order.updated, but we don't wait for it.
      queryClient.setQueryData<OrderDto[]>(qk, (old = []) => {
        if (newStatus === OrderStatus.DELIVERED) {
          return old.filter((o) => o.id !== orderId);
        }
        return old.map((o) => o.id === orderId ? { ...o, status: newStatus } : o);
      });
    } catch (err) {
      handleApiError(err, 'Error al actualizar');
      refetch(); // re-sync on error
    }
  };

  const pending   = orders.filter((o) => o.status === OrderStatus.PENDING).sort(byArrival);
  const preparing = orders.filter((o) => o.status === OrderStatus.PREPARING).sort(byArrival);

  const refresh = useCallback(async () => { await refetch(); }, [refetch]);

  return { orders, pending, preparing, loading: !!branchId && loading, updateStatus, refresh };
}
