import { useState } from 'react';
import { UserRole } from '@pos/shared';
import { useAuth } from '../context/auth.context';
import { formatDayRange, mondayOf, today } from '../utils/date';
import { getBoliviaDayBounds } from '../utils/timezone';

export type Period = 'all' | 'today' | 'week' | 'month' | 'custom';

/** Días `YYYY-MM-DD` del período, siempre en hora de Bolivia (no la del dispositivo). */
function buildRange(period: Period, customFrom: string, customTo: string) {
  if (period === 'all') return { from: '', to: '' };
  const todayStr = today();
  if (period === 'today') return { from: todayStr, to: todayStr };
  if (period === 'week')  return { from: mondayOf(todayStr), to: todayStr };
  if (period === 'month') return { from: `${todayStr.slice(0, 7)}-01`, to: todayStr };
  return { from: customFrom, to: customTo };
}

export function useReportFilters() {
  const { currentBranchId, user } = useAuth();

  const [period,           setPeriod]           = useState<Period>('today');
  const [customFrom,       setCustomFrom]        = useState(today);
  const [customTo,         setCustomTo]          = useState(today);
  const [selectedCategory, setSelectedCategory]  = useState('');

  const { from, to } = buildRange(period, customFrom, customTo);
  // En palabras: "Hoy, 29 de septiembre", "Del 1 al 29 de septiembre".
  const rangeLabel   = !from ? 'Histórico'
    : period === 'today' ? `Hoy, ${formatDayRange(from, to)}`
    : formatDayRange(from, to);
  const isMultiDay   = from !== to;

  const utcFrom = from ? getBoliviaDayBounds(from).start : undefined;
  const utcTo   = to ? getBoliviaDayBounds(to).end : undefined;

  const branchParam =
    user?.role === UserRole.OWNER ? (currentBranchId ?? undefined) : undefined;

  return {
    period,      setPeriod,
    customFrom,  setCustomFrom,
    customTo,    setCustomTo,
    selectedCategory, setSelectedCategory,
    from, to, rangeLabel, isMultiDay,
    utcFrom, utcTo,
    branchParam,
  };
}
