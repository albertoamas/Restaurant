import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { categoriesApi } from '../api/categories.api';
import { useVisibilityRefresh } from './useVisibilityRefresh';
import { useSocketEvent } from '../context/socket.context';
import type { CategoryDto } from '@pos/shared';

export function useCategories() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    categoriesApi
      .getAll()
      .then(setCategories)
      .catch(() => toast.error('Error al cargar categorías'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Refresh when returning to the tab
  useVisibilityRefresh(load);

  // Real-time: reload instantly on any category change
  useSocketEvent('category.created', load);
  useSocketEvent('category.updated', load);
  useSocketEvent('category.deleted', load);

  return { categories, loading, reload: load };
}
