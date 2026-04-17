import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { productsApi } from '../api/products.api';
import { useVisibilityRefresh } from './useVisibilityRefresh';
import { useSocketEvent } from '../context/socket.context';
import type { ProductDto } from '@pos/shared';

export function useProducts(includeInactive = false, pageSize = 500) {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQState] = useState('');
  const [categoryId, setCategoryIdState] = useState<string | undefined>(undefined);
  const [page, setPageState] = useState(1);

  const load = useCallback(
    (query: string, catId: string | undefined, pg: number) => {
      setLoading(true);
      productsApi
        .getAll({ includeInactive, q: query || undefined, categoryId: catId, page: pg, limit: pageSize })
        .then((r) => { setProducts(r.data); setTotal(r.total); })
        .catch(() => toast.error('Error al cargar productos'))
        .finally(() => setLoading(false));
    },
    [includeInactive],
  );

  useEffect(() => {
    load(q, categoryId, page);
  }, [q, categoryId, page]); // eslint-disable-line react-hooks/exhaustive-deps

  function setQ(value: string) {
    setQState(value);
    setPageState(1);
  }

  function setCategoryId(value: string | undefined) {
    setCategoryIdState(value);
    setPageState(1);
  }

  function setPage(pg: number) {
    setPageState(pg);
  }

  const reload = useCallback(() => load(q, categoryId, page), [q, categoryId, page, load]);

  useVisibilityRefresh(reload);
  useSocketEvent('product.created', reload);
  useSocketEvent('product.updated', reload);

  const totalPages = Math.ceil(total / pageSize);

  return {
    products,
    loading,
    reload,
    total,
    page,
    totalPages,
    setPage,
    q,
    setQ,
    categoryId,
    setCategoryId,
  };
}
