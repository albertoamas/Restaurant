import { eachDay } from '../../utils/date';

interface ExpenseCalendarProps {
  from: string;
  to: string;
  /** Total gastado por día (clave YYYY-MM-DD). */
  byDay: Record<string, number>;
  selectedDay: string | null;
  onSelect: (day: string) => void;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
/** Tope de días dibujados: un rango largo no es un calendario útil. */
const MAX_DAYS = 62;

/** "1.1k" en celular, donde no entra "Bs 1103". */
const short = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(0));

/**
 * Mapa de calor diario. La intensidad mezcla el naranja de la marca sobre la superficie del
 * tema, así que funciona igual en claro y oscuro. Los 7 días de la semana entran en celular.
 */
export function ExpenseCalendar({ from, to, byDay, selectedDay, onSelect }: ExpenseCalendarProps) {
  const days = eachDay(from, to).slice(0, MAX_DAYS);
  const max = Math.max(1, ...Object.values(byDay));
  // Lunes = 0: el día de la semana del primer día se calcula en UTC, como los días de eachDay.
  const firstOffset = (new Date(`${days[0] ?? from}T12:00:00Z`).getUTCDay() + 6) % 7;

  return (
    <div className="p-3 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-label text-soft">Toca un día para ver sus movimientos.</p>
        <div className="flex items-center gap-2 text-caption text-muted">
          Menos
          <span
            className="h-2 w-12 rounded-full sm:w-16"
            style={{ background: 'linear-gradient(to right, var(--color-surface-2), color-mix(in oklab, var(--color-primary-600) 45%, var(--color-surface-2)), var(--color-primary-600))' }}
          />
          Más
        </div>
      </div>

      <div className="mb-1.5 grid grid-cols-7 gap-1 sm:gap-2">
        {WEEKDAYS.map((label) => (
          <div key={label} className="px-1 text-caption font-medium text-muted">{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {Array.from({ length: firstOffset }).map((_, i) => <div key={`blank-${i}`} />)}
        {days.map((day) => {
          const amount    = byDay[day] ?? 0;
          const intensity = amount / max;
          const active    = day === selectedDay;
          const strong    = intensity > 0.55;
          const mix       = Math.round(12 + intensity * 74);
          return (
            <button
              key={day}
              type="button"
              onClick={() => amount > 0 && onSelect(day)}
              disabled={amount === 0}
              aria-label={amount > 0 ? `${Number(day.slice(-2))}: Bs ${amount.toFixed(2)}` : `${Number(day.slice(-2))}: sin gastos`}
              aria-pressed={active}
              style={{
                background: amount === 0
                  ? 'var(--color-surface-2)'
                  : `color-mix(in oklab, var(--color-primary-600) ${mix}%, var(--color-surface-2))`,
              }}
              className={[
                'flex min-h-12 flex-col justify-between rounded-control border p-1.5 text-left transition sm:min-h-[72px] sm:p-2',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60',
                active ? 'border-main ring-2 ring-primary-500/40' : 'border-line',
                amount > 0 ? 'hover:brightness-95' : 'cursor-default opacity-60',
              ].join(' ')}
            >
              <span className={`text-caption font-semibold ${strong ? 'text-white' : 'text-soft'}`}>{Number(day.slice(-2))}</span>
              {amount > 0 && (
                <span className={`text-caption font-bold tabular-nums ${strong ? 'text-white' : 'text-main'}`}>
                  <span className="sm:hidden">{short(amount)}</span>
                  <span className="hidden sm:inline">Bs {amount.toFixed(0)}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
