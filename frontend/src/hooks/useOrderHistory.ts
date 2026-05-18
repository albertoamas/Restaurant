import { useQuery } from '@tanstack/react-query';
import type { OrderDto, OrderStatus } from '@pos/shared';
import { ordersApi } from '../api/orders.api';
import { getBoliviaDayBounds } from '../utils/timezone';
import { queryKeys } from '../lib/query-keys';

const HISTORY_LIMIT = 100;

export function useOrderHistory(params: {
  fromDate: string;
  toDate:   string;
  q:        string;
  status:   string;
  branchId: string | null;
}) {
  const { fromDate, toDate, q, status, branchId } = params;

  const { start: utcFrom } = getBoliviaDayBounds(fromDate);
  const { end:   utcTo   } = getBoliviaDayBounds(toDate);

  const { data, isPending: loading } = useQuery({
    queryKey: queryKeys.orderHistory({ from: utcFrom, to: utcTo, q, status, branchId }),
    queryFn:  () => ordersApi.getAll({
      from:     utcFrom,
      to:       utcTo,
      q:        q || undefined,
      status:   (status as OrderStatus) || undefined,
      branchId: branchId ?? undefined,
      limit:    HISTORY_LIMIT,
      page:     1,
    }),
    enabled:   !!branchId,
    staleTime: 30_000,
  });

  return {
    orders: data?.data ?? [] as OrderDto[],
    total:  data?.total ?? 0,
    loading,
  };
}
