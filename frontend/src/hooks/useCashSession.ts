import { useState, useEffect, useCallback } from 'react';
import type { CashSessionDto } from '@pos/shared';
import { cashSessionApi } from '../api/cash-session.api';
import { useVisibilityRefresh } from './useVisibilityRefresh';

export function useCashSession(branchId: string | null) {
  const [session, setSession] = useState<CashSessionDto | null | undefined>(undefined);
  const [history, setHistory] = useState<CashSessionDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!branchId) { setLoading(false); return; }
    Promise.all([
      cashSessionApi.getCurrent(branchId).catch(() => null),
      cashSessionApi.getHistory(branchId).catch(() => []),
    ]).then(([cur, hist]) => {
      setSession(cur);
      setHistory(hist ?? []);
    }).finally(() => setLoading(false));
  }, [branchId]);

  // Initial load + polling every 30s
  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  // Refresh when returning to the tab
  useVisibilityRefresh(load);

  return { session, setSession, history, loading, reload: load };
}
