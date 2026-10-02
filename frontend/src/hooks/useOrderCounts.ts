import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { OrderStatus, SOCKET_EVENTS } from '@pos/shared';
import type { OrderDto } from '@pos/shared';
import { ordersApi } from '../api/orders.api';
import { getBoliviaDayBounds } from '../utils/timezone';
import { useSocketEvent } from '../context/socket.context';
import { queryKeys } from '../lib/query-keys';

export type OrderCounts = { all: number; pending: number; preparing: number; delivered: number };

/** Espera tras el último evento de pedidos antes de recontar: agrupa ráfagas en una sola consulta. */
const REFRESH_DEBOUNCE_MS = 2_000;

export function countOrders(orders: OrderDto[]): OrderCounts {
  return {
    all:       orders.length,
    pending:   orders.filter((o) => o.status === OrderStatus.PENDING).length,
    preparing: orders.filter((o) => o.status === OrderStatus.PREPARING).length,
    delivered: orders.filter((o) => o.status === OrderStatus.DELIVERED).length,
  };
}

/**
 * Cuántos pedidos del día hay en cada estado, para los contadores de los filtros de Operación.
 *
 * Si la lista ya cargada es la del día completo (filtro "Todos" y sin más páginas), se cuenta
 * ahí mismo y no se consulta nada. Si no (hay un filtro o faltan páginas), se piden los totales
 * al servidor (limit 1, solo se lee `total`), agrupando los eventos en tiempo real para no
 * multiplicar consultas: el servidor limita las peticiones por minuto.
 */
export function useOrderCounts(params: {
  date: string;
  branchId: string | null;
  /** Pedidos ya cargados y si son el día completo. */
  loaded: OrderDto[];
  loadedIsWholeDay: boolean;
}) {
  const { date, branchId, loaded, loadedIsWholeDay } = params;
  const queryClient = useQueryClient();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const local = useMemo(() => (loadedIsWholeDay ? countOrders(loaded) : null), [loaded, loadedIsWholeDay]);

  const { data } = useQuery({
    queryKey: queryKeys.orderCounts({ date, branchId }),
    enabled: !loadedIsWholeDay,
    queryFn: async (): Promise<OrderCounts> => {
      const { start, end } = getBoliviaDayBounds(date);
      const count = (status?: OrderStatus) =>
        ordersApi.getAll({ from: start, to: end, branchId: branchId ?? undefined, limit: 1, page: 1, ...(status ? { status } : {}) })
          .then((r) => r.total);
      const [all, pending, preparing, delivered] = await Promise.all([
        count(), count(OrderStatus.PENDING), count(OrderStatus.PREPARING), count(OrderStatus.DELIVERED),
      ]);
      return { all, pending, preparing, delivered };
    },
  });

  const refreshCounts = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orderCountsAll });
    }, REFRESH_DEBOUNCE_MS);
  }, [queryClient]);

  useEffect(() => () => clearTimeout(timer.current), []);

  useSocketEvent(SOCKET_EVENTS.ORDER_CREATED, refreshCounts);
  useSocketEvent(SOCKET_EVENTS.ORDER_UPDATED, refreshCounts);

  return { counts: local ?? data, refreshCounts };
}
