import { useState } from 'react';
import { UserRole } from '@pos/shared';
import { useAuth } from '../context/auth.context';
import { today } from '../utils/date';
import { getBoliviaDayBounds } from '../utils/timezone';

export type Period = 'today' | 'week' | 'month' | 'custom';

function buildRange(period: Period, customFrom: string, customTo: string) {
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
  if (period === 'month') {
    return { from: fmt(new Date(d.getFullYear(), d.getMonth(), 1)), to: todayStr };
  }
  return { from: customFrom, to: customTo };
}

function buildPrevRange(from: string, to: string) {
  const pad   = (n: number) => String(n).padStart(2, '0');
  const fmt   = (d: Date)   =>
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

  const fromD   = new Date(from + 'T00:00:00Z');
  const toD     = new Date(to   + 'T00:00:00Z');
  const spanMs  = toD.getTime() - fromD.getTime() + 86_400_000; // +1 día (inclusive)

  const prevToD   = new Date(fromD.getTime() - 86_400_000);     // un día antes del actual
  const prevFromD = new Date(prevToD.getTime() - spanMs + 86_400_000);

  return { prevFrom: fmt(prevFromD), prevTo: fmt(prevToD) };
}

export function useReportFilters() {
  const { currentBranchId, user } = useAuth();

  const [period,           setPeriod]           = useState<Period>('today');
  const [customFrom,       setCustomFrom]        = useState(today);
  const [customTo,         setCustomTo]          = useState(today);
  const [selectedCategory, setSelectedCategory]  = useState('');

  const { from, to } = buildRange(period, customFrom, customTo);
  const rangeLabel   = from === to ? from : `${from} → ${to}`;
  const isMultiDay   = from !== to;

  const { start: utcFrom } = getBoliviaDayBounds(from);
  const { end:   utcTo   } = getBoliviaDayBounds(to);

  const { prevFrom, prevTo } = buildPrevRange(from, to);
  const { start: prevUtcFrom } = getBoliviaDayBounds(prevFrom);
  const { end:   prevUtcTo   } = getBoliviaDayBounds(prevTo);

  const branchParam =
    user?.role === UserRole.OWNER ? (currentBranchId ?? undefined) : undefined;

  return {
    period,      setPeriod,
    customFrom,  setCustomFrom,
    customTo,    setCustomTo,
    selectedCategory, setSelectedCategory,
    from, to, rangeLabel, isMultiDay,
    utcFrom, utcTo,
    prevUtcFrom, prevUtcTo,
    branchParam,
  };
}
