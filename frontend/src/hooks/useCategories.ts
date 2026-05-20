import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { CategoryDto } from '@pos/shared';
import { SOCKET_EVENTS } from '@pos/shared';
import { categoriesApi } from '../api/categories.api';
import { useSocketEvent } from '../context/socket.context';
import { queryKeys } from '../lib/query-keys';

export function useCategories() {
  const queryClient = useQueryClient();

  const { data: categories = [] as CategoryDto[], isPending: loading, refetch } = useQuery({
    queryKey: queryKeys.categories,
    queryFn:  () => categoriesApi.getAll(),
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.categories });
  }, [queryClient]);

  useSocketEvent(SOCKET_EVENTS.CATEGORY_CREATED, invalidate);
  useSocketEvent(SOCKET_EVENTS.CATEGORY_UPDATED, invalidate);
  useSocketEvent(SOCKET_EVENTS.CATEGORY_DELETED, invalidate);

  return { categories, loading, reload: refetch };
}
