import { useState, useEffect, useCallback } from 'react';
import { rafflesApi } from '../api/raffles.api';
import { handleApiError } from '../utils/api-error';
import type { RaffleDto } from '@pos/shared';

export function useRaffles() {
  const [raffles, setRaffles] = useState<RaffleDto[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setRaffles(await rafflesApi.getAll());
    } catch (err) {
      handleApiError(err, 'Error al cargar sorteos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { raffles, setRaffles, loading, reload };
}
