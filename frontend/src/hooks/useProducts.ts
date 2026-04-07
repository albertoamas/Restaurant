import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { productsApi } from '../api/products.api';
import { useVisibilityRefresh } from './useVisibilityRefresh';
import { useSocketEvent } from '../context/socket.context';
import type { ProductDto } from '@pos/shared';

export function useProducts(includeInactive = false) {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    productsApi
      .getAll(undefined, includeInactive)
      .then(setProducts)
      .catch(() => toast.error('Error al cargar productos'))
      .finally(() => setLoading(false));
  }, [includeInactive]);

  // Initial load + polling every 60s as fallback
  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  // Refresh when returning to the tab
  useVisibilityRefresh(load);

  // Real-time: reload instantly on any product change
  useSocketEvent('product.created', load);
  useSocketEvent('product.updated', load);

  return { products, loading, reload: load };
}
