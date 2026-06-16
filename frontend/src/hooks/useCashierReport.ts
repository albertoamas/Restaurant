import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { DailyReportDto } from '@pos/shared';
import { reportsApi } from '../api/reports.api';
import { queryKeys } from '../lib/query-keys';
import { getBoliviaDayBounds } from '../utils/timezone';

export type CashierPeriod = 'today' | 'week' | 'month';

function buildRange(period: CashierPeriod) {
  const d   = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (date: Date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const todayStr = fmt(d);

  if (period === 'today') return { from: todayStr, to: todayStr };
  if (period === 'week') {
    const day = d.getDay() || 7;
    const mon = new Date(d);
    mon.setDate(d.getDate() - day + 1);
    return { from: fmt(mon), to: todayStr };
  }
  const from = fmt(new Date(d.getFullYear(), d.getMonth(), 1));
  return { from, to: todayStr };
}

export function useCashierReport() {
  const [period, setPeriod] = useState<CashierPeriod>('today');

  const { from, to } = buildRange(period);
  const rangeLabel   = from === to ? from : `${from} → ${to}`;

  const { start: utcFrom } = getBoliviaDayBounds(from);
  const { end:   utcTo   } = getBoliviaDayBounds(to);

  const { data: report = null, isPending: loading } = useQuery<DailyReportDto | null>({
    queryKey: queryKeys.reportRange(utcFrom, utcTo, undefined),
    queryFn:  () => reportsApi.getByRange(utcFrom, utcTo),
    staleTime: 0,
  });

  return { report, loading, period, setPeriod, rangeLabel, from, to };
}
