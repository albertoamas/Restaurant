import { useState, useCallback, useRef } from 'react';
import { customersApi } from '../api/customers.api';
import type { CustomerSearchResult } from '@pos/shared';

export function useCustomerSearch() {
  const [results, setResults] = useState<CustomerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      customersApi
        .search(q)
        .then(setResults)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);
  }, []);

  const clear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setResults([]);
  }, []);

  return { results, loading, search, clear };
}
