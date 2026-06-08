import { useRef, useState } from 'react';
import type { DayHourDataDto } from '@pos/shared';
import { C } from './chartColors';

// PostgreSQL EXTRACT(DOW): 0=Domingo, 1=Lunes … 6=Sábado
// Pantalla: Lunes … Domingo → [1,2,3,4,5,6,0]
const DISPLAY_DAYS   = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DISPLAY_TO_PG  = [1, 2, 3, 4, 5, 6, 0];

const CELL_H = 20; // px — matches h-5

interface HoveredCell {
  x:          number;
  cellTop:    number; // top of the hovered cell relative to container
  showBelow:  boolean;
  dayLabel:   string;
  hour:       number;
  totalSales: number;
  orderCount: number;
}

interface Props {
  data: DayHourDataDto[];
}

export function HeatMapChart({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<HoveredCell | null>(null);

  // Build lookup: lookup[pgDay][hour] = { totalSales, orderCount }
  const lookup: Record<number, Record<number, { totalSales: number; orderCount: number }>> = {};
  for (const d of data) {
    if (!lookup[d.dayOfWeek]) lookup[d.dayOfWeek] = {};
    lookup[d.dayOfWeek][d.hour] = { totalSales: d.totalSales, orderCount: d.orderCount };
  }
  const maxSales = data.reduce((m, d) => Math.max(m, d.totalSales), 0) || 1;

  function handleMouseEnter(
    e: React.MouseEvent<HTMLDivElement>,
    pgDay: number,
    displayDay: number,
    hour: number,
  ) {
    const cell      = lookup[pgDay]?.[hour];
    const container = containerRef.current;
    if (!container) return;
    const cRect   = container.getBoundingClientRect();
    const tRect   = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cellTop = tRect.top - cRect.top;
    // If the cell is in the top 90px of the container the tooltip would be
    // clipped above — flip it to render below the cell instead.
    const showBelow = cellTop < 90;
    setHovered({
      x:          tRect.left - cRect.left + tRect.width / 2,
      cellTop,
      showBelow,
      dayLabel:   DISPLAY_DAYS[displayDay],
      hour,
      totalSales: cell?.totalSales  ?? 0,
      orderCount: cell?.orderCount  ?? 0,
    });
  }

  // Only render hours that have any sales (+ a buffer) to keep the chart compact.
  // But always show at least 6:00–23:00 for restaurant context.
  const activeHours = data.map((d) => d.hour);
  const minHour = activeHours.length ? Math.max(0,  Math.min(...activeHours) - 1) : 6;
  const maxHour = activeHours.length ? Math.min(23, Math.max(...activeHours) + 1) : 23;
  const hours   = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i);

  return (
    <div ref={containerRef} className="relative select-none overflow-x-auto">
      {/* Day headers */}
      <div className="flex mb-1 pl-10">
        {DISPLAY_DAYS.map((d) => (
          <div key={d} className="flex-1 text-center text-[10px] font-semibold text-gray-400">
            {d}
          </div>
        ))}
      </div>

      {/* Grid rows */}
      <div className="space-y-0.5" style={{ minWidth: 300 }}>
        {hours.map((h) => (
          <div key={h} className="flex items-center gap-0.5">
            {/* Hour label — show every 2 hours */}
            <div className="w-9 shrink-0 text-right pr-2 text-[10px] text-gray-400 font-medium">
              {h % 2 === 0 ? `${String(h).padStart(2, '0')}h` : ''}
            </div>

            {/* Cells */}
            {DISPLAY_TO_PG.map((pgDay, displayDay) => {
              const cell      = lookup[pgDay]?.[h];
              const intensity = cell ? cell.totalSales / maxSales : 0;
              const bg        = cell && cell.totalSales > 0
                ? `rgba(249,115,22,${(0.12 + intensity * 0.88).toFixed(3)})`
                : 'rgba(156,163,175,0.07)';
              return (
                <div
                  key={pgDay}
                  className="flex-1 h-5 rounded-sm cursor-default transition-all duration-100 hover:ring-1 hover:ring-white/20"
                  style={{ background: bg }}
                  onMouseEnter={(e) => handleMouseEnter(e, pgDay, displayDay, h)}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Color scale legend */}
      <div className="flex items-center gap-2 mt-3 pl-10">
        <span className="text-[10px] text-gray-400">Menor</span>
        <div className="flex gap-0.5">
          {[0.08, 0.22, 0.38, 0.56, 0.74, 0.92].map((op) => (
            <div
              key={op}
              className="w-5 h-2.5 rounded-sm"
              style={{ background: `rgba(249,115,22,${op})` }}
            />
          ))}
        </div>
        <span className="text-[10px] text-gray-400">Mayor</span>
      </div>

      {/* Custom tooltip — flips above/below based on proximity to top */}
      {hovered && (
        <div
          className="pointer-events-none absolute z-20"
          style={{
            left:      hovered.x,
            top:       hovered.showBelow
              ? hovered.cellTop + CELL_H + 6
              : hovered.cellTop - 6,
            transform: hovered.showBelow
              ? 'translateX(-50%)'
              : 'translateX(-50%) translateY(-100%)',
            background:   'var(--color-surface-card)',
            border:       '1px solid rgba(255,255,255,0.12)',
            borderRadius: '10px',
            padding:      '8px 12px',
            boxShadow:    '0 8px 24px rgba(0,0,0,0.45)',
            whiteSpace:   'nowrap',
          }}
        >
          <p style={{ color: '#9ca3af', fontSize: 10, fontWeight: 600, marginBottom: 4 }}>
            {hovered.dayLabel} · {String(hovered.hour).padStart(2, '0')}:00
          </p>
          {hovered.totalSales > 0 ? (
            <>
              <p style={{ color: C.primary, fontSize: 12, fontWeight: 700 }}>
                Ventas: <span style={{ color: '#f9fafb' }}>Bs {hovered.totalSales.toFixed(2)}</span>
              </p>
              <p style={{ color: C.emerald, fontSize: 12, fontWeight: 700 }}>
                Pedidos: <span style={{ color: '#f9fafb' }}>{hovered.orderCount}</span>
              </p>
            </>
          ) : (
            <p style={{ color: '#6b7280', fontSize: 12 }}>Sin ventas</p>
          )}
        </div>
      )}
    </div>
  );
}
