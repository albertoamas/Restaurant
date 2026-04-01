import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { customersApi } from '../api/customers.api';
import type { CustomerStatsDto } from '@pos/shared';

export function useCustomers(initialQ = '') {
  const [customers, setCustomers] = useState<CustomerStatsDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(initialQ);

  const load = useCallback(
    (query = q) => {
      setLoading(true);
      customersApi
        .getAll({ q: query || undefined })
        .then(setCustomers)
        .catch(() => toast.error('Error al cargar clientes'))
        .finally(() => setLoading(false));
    },
    [q],
  );

  useEffect(() => {
    load(q);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  return { customers, loading, q, setQ, reload: load };
}
