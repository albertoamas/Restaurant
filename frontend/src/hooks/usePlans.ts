import { useState, useEffect } from 'react';
import type { PlanDto } from '@pos/shared';
import { plansApi } from '../api/plans.api';

export function usePlans() {
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    plansApi
      .getAll()
      .then(setPlans)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return { plans, loading, error };
}
