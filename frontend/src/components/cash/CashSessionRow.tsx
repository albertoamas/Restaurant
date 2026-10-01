import type { CashSessionDto } from '@pos/shared';
import { Badge } from '../ui/Badge';
import { formatBoliviaDateShort, formatBoliviaTime } from '../../utils/date';
import { toBoliviaDateString } from '../../utils/timezone';
import { cashResult } from './cash-result';

/** "08:00 a. m. a 11:27 p. m."; si cerró otro día, también la fecha del cierre. */
function shiftHours(s: CashSessionDto): string {
  const opened = formatBoliviaTime(s.openedAt);
  if (!s.closedAt) return opened;
  const sameDay = toBoliviaDateString(new Date(s.openedAt)) === toBoliviaDateString(new Date(s.closedAt));
  const closed = formatBoliviaTime(s.closedAt);
  return `${opened} a ${sameDay ? closed : `${formatBoliviaDateShort(s.closedAt)}, ${closed}`}`;
}

function Figure({ label, value, strong = false }: { label: string; value: number | null; strong?: boolean }) {
  return (
    <div>
      <dt className="text-caption text-muted">{label}</dt>
      <dd className={`text-label tabular-nums ${strong ? 'font-semibold text-main' : 'text-soft'}`}>
        {value === null ? '-' : `Bs ${value.toFixed(2)}`}
      </dd>
    </div>
  );
}

/** Un cierre de caja: cuándo, el resultado en palabras y las tres cifras que lo explican. */
export function CashSessionRow({ session: s }: { session: CashSessionDto }) {
  const result = s.difference === null ? null : cashResult(s.difference);

  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-body font-semibold text-main">{formatBoliviaDateShort(s.openedAt)}</p>
          <p className="text-caption text-muted">{shiftHours(s)}</p>
        </div>
        {result && <Badge variant={result.tone}>{result.label}</Badge>}
      </div>
      <dl className="mt-2 grid grid-cols-3 gap-2">
        <Figure label="Inicial" value={s.openingAmount} />
        <Figure label="Esperado" value={s.expectedAmount} />
        <Figure label="Contado" value={s.closingAmount} strong />
      </dl>
      {s.notes && <p className="mt-1.5 text-caption text-soft">Nota: {s.notes}</p>}
    </li>
  );
}
