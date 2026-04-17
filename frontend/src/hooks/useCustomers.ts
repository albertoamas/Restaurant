import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { customersApi } from '../api/customers.api';
import { useVisibilityRefresh } from './useVisibilityRefresh';
import { useSocketEvent } from '../context/socket.context';
import type { CustomerStatsDto } from '@pos/shared';

const PAGE_SIZE = 50;

export function useCustomers(initialQ = '') {
  const [customers, setCustomers] = useState<CustomerStatsDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQState] = useState(initialQ);
  const [page, setPageState] = useState(1);

  const load = useCallback(
    (query: string, pg: number) => {
      setLoading(true);
      customersApi
        .getAll({ q: query || undefined, page: pg, limit: PAGE_SIZE })
        .then((r) => { setCustomers(r.data); setTotal(r.total); })
        .catch(() => toast.error('Error al cargar clientes'))
        .finally(() => setLoading(false));
    },
    [],
  );

  useEffect(() => {
    load(q, page);
  }, [q, page, load]);

  function setQ(value: string) {
    setQState(value);
    setPageState(1);
  }

  function setPage(pg: number) {
    setPageState(pg);
  }

  const reload = useCallback(() => load(q, page), [q, page, load]);

  useVisibilityRefresh(reload);
  useSocketEvent('customer.created', reload);
  useSocketEvent('customer.updated', reload);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return { customers, loading, q, setQ, reload, total, page, totalPages, setPage };
}
