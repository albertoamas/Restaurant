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

/**
 * Live kitchen orders for the current branch (PENDING + PREPARING only).
 *
 * Real-time strategy:
 *  - WebSocket events (`order.created`, `order.updated`) keep the cache up to date in real time.
 *  - Polling every 30s only when the socket is disconnected (fallback).
 *  - On reconnection, refetches immediately to recover events missed while offline.
 *  - Mutations are optimistic; on error we resync from the server.
 */
export function useKitchenOrders(branchId: string | null) {
  const queryClient     = useQueryClient();
  const { connected }   = useSocket();
  const wasConnectedRef = useRef<boolean | null>(null);

  const qk = queryKeys.kitchenOrders(branchId);

  const { data: orders = [] as OrderDto[], refetch } = useQuery<OrderDto[]>({
    queryKey: qk,
    queryFn:  async () => {
      const { data } = await ordersApi.getAll({ date: today(), branchId: branchId ?? undefined });
      return data.filter((o) =>
        o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING,
      );
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
    queryClient.setQueryData<OrderDto[]>(qk, (old = []) => [...old, order]);
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

  const pending   = orders.filter((o) => o.status === OrderStatus.PENDING);
  const preparing = orders.filter((o) => o.status === OrderStatus.PREPARING);

  const refresh = useCallback(async () => { await refetch(); }, [refetch]);

  return { orders, pending, preparing, updateStatus, refresh };
}
