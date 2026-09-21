interface ExpenseCalendarProps {
  from: string;
  to: string;
  /** Total gastado por día (clave YYYY-MM-DD). */
  byDay: Record<string, number>;
  selectedDay: string | null;
  onSelect: (day: string) => void;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/**
 * Mapa de calor diario. La intensidad usa el naranja de la marca mezclado sobre
 * la superficie del tema, así que funciona igual en claro y oscuro.
 */
export function ExpenseCalendar({ from, to, byDay, selectedDay, onSelect }: ExpenseCalendarProps) {
  const days: string[] = [];
  const cursor = new Date(`${from}T12:00:00`);
  const end    = new Date(`${to}T12:00:00`);
  while (cursor <= end && days.length < 62) {
    const year  = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, '0');
    const day   = String(cursor.getDate()).padStart(2, '0');
    days.push(`${year}-${month}-${day}`);
    cursor.setDate(cursor.getDate() + 1);
  }

  const max = Math.max(1, ...Object.values(byDay));
  const firstOffset = (new Date(`${days[0] ?? from}T12:00:00`).getDay() + 6) % 7;

  return (
    <div className="p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500">Toca un día para ver sus movimientos.</p>
        <div className="flex shrink-0 items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Menor
          <span
            className="h-2 w-12 rounded-full sm:w-16"
            style={{
              background:
                'linear-gradient(to right, var(--color-surface-2), color-mix(in oklab, var(--color-primary-600) 45%, var(--color-surface-2)), var(--color-primary-600))',
            }}
          />
          Mayor
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="mb-2 grid grid-cols-7 gap-2">
            {WEEKDAYS.map((label) => (
              <div key={label} className="px-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstOffset }).map((_, index) => <div key={`blank-${index}`} />)}
            {days.map((day) => {
              const amount    = byDay[day] ?? 0;
              const intensity = amount / max;
              const dayNumber = Number(day.slice(-2));
              const active    = day === selectedDay;
              const mix       = Math.round(12 + intensity * 74);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => amount > 0 && onSelect(day)}
                  disabled={amount === 0}
                  style={{
                    background: amount === 0
                      ? 'var(--color-surface-2)'
                      : `color-mix(in oklab, var(--color-primary-600) ${mix}%, var(--color-surface-2))`,
                  }}
                  className={`min-h-[72px] rounded-xl border p-2 text-left transition ${
                    active
                      ? 'border-gray-900 ring-2 ring-primary-500/30'
                      : 'border-[var(--border-subtle)]'
                  } ${amount > 0 ? 'hover:-translate-y-0.5 hover:shadow-card-md' : 'cursor-default opacity-60'}`}
                >
                  <span className={`text-xs font-black ${intensity > 0.55 ? 'text-white' : 'text-gray-600'}`}>
                    {dayNumber}
                  </span>
                  <span className={`mt-3 block text-xs font-black tabular-nums ${intensity > 0.55 ? 'text-white' : 'text-gray-700'}`}>
                    {amount > 0 ? `Bs ${amount.toFixed(0)}` : '—'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
