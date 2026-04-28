import { useEffect, useLayoutEffect, useRef, useState, useMemo, useCallback } from 'react';
import { WINNER_PAUSE_MS } from '../../hooks/useRaffleDetail';
import { playDrawTick } from '../../utils/raffle-sounds';
import { positionLabel } from '../../utils/raffle-utils';

// ─── Layout constants ─────────────────────────────────────────────────────────

const ITEM_H  = 72;                       // px per row
const VISIBLE = 7;                        // rows visible (must be odd)
const CONT_H  = ITEM_H * VISIBLE;         // 504 px window height
const CENTER  = Math.floor(VISIBLE / 2);  // center row index (3)
const SPEED   = 750;                      // px/s during fast spin

// Items needed: 30 init + (750 px/s × 7 s fast + 1500 px decel) / 72 px + buffer = 140
const POOL_ITEMS_NEEDED = 140;
const INIT_OFFSET       = 30 * ITEM_H;   // 2160 px — fixed, pool-size independent

// easeOutQuad initial slope = 2, so startSpeed = 2 * d / T.
// d = SPEED * T / 2 makes startSpeed = SPEED (seamless handoff from fast phase).
const DECEL_DIST = Math.round((SPEED * WINNER_PAUSE_MS) / 2000);

// ─── Light-theme tokens ───────────────────────────────────────────────────────

const PAGE_BG   = 'oklch(0.972 0.005 255)';
const DRUM_BG   = 'oklch(1.000 0.000 0)';
const DRUM_EDGE = 'oklch(0.91 0.008 252)';
const NAME_CLR  = 'oklch(0.13 0.012 260)';
const PRI6      = 'oklch(0.47 0.17 234)';
const PRI7      = 'oklch(0.39 0.15 236)';
const VIO       = 'oklch(0.50 0.18 295)';
const VIO_D     = 'oklch(0.42 0.18 295)';

// ─── DrawingScreen ────────────────────────────────────────────────────────────

export function DrawingScreen({
  position,
  names,
  revealName,
}: {
  position: number;
  names: string[];
  revealName: string | null;
}) {
  // pool is intentionally frozen at mount: names won't change during a single draw.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pool = useMemo(() => (names.length > 0 ? names : ['—']), []);

  // Dynamic repeat count — caps DOM nodes at ~140-300 regardless of pool size.
  const extPool = useMemo(() => {
    const reps = Math.max(3, Math.ceil(POOL_ITEMS_NEEDED / pool.length));
    return Array.from({ length: reps }, () => pool).flat();
  }, [pool]);

  // ── Refs ─────────────────────────────────────────────────────────────────────

  const listRef   = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(INIT_OFFSET);
  const prevRef   = useRef(0);
  const rafRef    = useRef<number | null>(null);
  const tickRef   = useRef(INIT_OFFSET);
  const revealRef = useRef<{ start: number; from: number; to: number } | null>(null);

  const [phase, setPhase] = useState<'fast' | 'reveal' | 'stopped'>('fast');
  const stopped = phase === 'stopped';

  // Set initial transform before first paint — no visible flash from position 0.
  useLayoutEffect(() => {
    if (listRef.current) {
      listRef.current.style.transform = `translateY(${-INIT_OFFSET}px)`;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Stable transform helper — useCallback([]) ensures the same function reference
  // is captured by all RAF closures, eliminating stale-closure risk and allowing
  // it to appear in effect deps without causing extra re-runs.
  // Math.round: integer pixels avoid subpixel blending overhead on the compositor.
  const applyTransform = useCallback((offset: number) => {
    if (listRef.current) {
      listRef.current.style.transform = `translateY(${-Math.round(offset)}px)`;
    }
  }, []); // listRef identity is guaranteed stable for the component lifetime

  // ── Phase 1: constant fast spin ───────────────────────────────────────────────
  // Direct DOM mutation — zero React re-renders per frame.

  useEffect(() => {
    if (phase !== 'fast') return;
    prevRef.current = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - prevRef.current) / 1000, 0.05);
      prevRef.current = now;
      offsetRef.current += SPEED * dt;
      applyTransform(offsetRef.current);

      // Sound every other item — pre-baked noise buffer, no main-thread allocation
      const crossed = Math.floor((offsetRef.current - tickRef.current) / ITEM_H);
      if (crossed > 0) {
        if (Math.floor(offsetRef.current / ITEM_H) % 2 === 0) playDrawTick(0.05);
        tickRef.current += crossed * ITEM_H;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [phase, applyTransform]);

  // ── Trigger reveal ────────────────────────────────────────────────────────────
  // Intentionally omits `pool` from deps: pool is frozen at mount and indexOf()
  // must search the same array that was used to build extPool.

  useEffect(() => {
    if (!revealName || phase !== 'fast') return;
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }

    const wIdx = pool.indexOf(revealName) >= 0 ? pool.indexOf(revealName) : 0;

    // Find the winner occurrence closest to DECEL_DIST ahead so easeOutQuad
    // starts at ≈ SPEED — seamless handoff from the fast phase.
    const from        = offsetRef.current;
    const idealTarget = from + DECEL_DIST;
    const idealCenter = CENTER + idealTarget / ITEM_H;
    const k           = Math.round((idealCenter - wIdx) / pool.length);

    // Clamp: always strictly forward, never backwards
    const minCenter = CENTER + from / ITEM_H + 3;
    const safeK     = Math.max(k, Math.ceil((minCenter - wIdx) / pool.length));

    const targetCenter = safeK * pool.length + wIdx;
    const to           = (targetCenter - CENTER) * ITEM_H;

    revealRef.current = { start: performance.now(), from, to };
    tickRef.current   = from;
    setPhase('reveal');
  }, [revealName]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Phase 2: easeOutQuad deceleration to winner ───────────────────────────────

  useEffect(() => {
    if (phase !== 'reveal' || !revealRef.current) return;
    const { start, from, to } = revealRef.current;
    const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);

    const tick = (now: number) => {
      const t = Math.min((now - start) / WINNER_PAUSE_MS, 1);
      offsetRef.current = from + (to - from) * easeOutQuad(t);
      applyTransform(offsetRef.current);

      const crossed = Math.floor((offsetRef.current - tickRef.current) / ITEM_H);
      if (crossed > 0) {
        playDrawTick(0.15 + t * 0.85);
        tickRef.current += crossed * ITEM_H;
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        applyTransform(to); // hard snap to exact pixel
        setPhase('stopped');
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [phase, applyTransform]);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-hidden select-none"
      style={{ background: PAGE_BG }}
    >
      {/* Ambient tint — no transition (gradient transitions are CPU-painted, not GPU composited) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: stopped
            ? 'radial-gradient(ellipse 70% 45% at 50% 50%, oklch(0.47 0.17 234 / 0.05) 0%, transparent 100%)'
            : 'radial-gradient(ellipse 70% 45% at 50% 50%, oklch(0.50 0.18 295 / 0.04) 0%, transparent 100%)',
        }}
      />

      {/* ── Header ── */}
      <div className="relative z-10 text-center mb-10">
        <p className="text-[9px] font-black uppercase tracking-[0.45em] mb-3" style={{ color: VIO_D }}>
          Sorteo en curso
        </p>
        <div
          className="inline-flex items-center gap-2 px-6 py-2 rounded-full transition-colors duration-700"
          style={
            stopped
              ? { background: 'oklch(0.47 0.17 234 / 0.08)', border: '1px solid oklch(0.47 0.17 234 / 0.25)', color: PRI7 }
              : { background: 'oklch(0.50 0.18 295 / 0.08)', border: '1px solid oklch(0.50 0.18 295 / 0.22)', color: VIO_D }
          }
        >
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: stopped ? PRI6 : VIO }} />
          <span className="text-xl font-black">{positionLabel(position)}</span>
        </div>
      </div>

      {/* ── Slot drum ── */}
      <div className="relative z-10 w-full max-w-[290px]">
        <SideArrow side="left"  stopped={stopped} centerTop={CENTER * ITEM_H} itemHeight={ITEM_H} />
        <SideArrow side="right" stopped={stopped} centerTop={CENTER * ITEM_H} itemHeight={ITEM_H} />

        <div
          className="relative overflow-hidden"
          style={{
            height: CONT_H,
            borderRadius: 18,
            background: DRUM_BG,
            border: `1px solid ${DRUM_EDGE}`,
            boxShadow: '0 2px 16px oklch(0.13 0.012 260 / 0.07)',
            contain: 'layout style paint',
          }}
        >
          {/* Centre highlight — transitions only color properties (GPU), not transform */}
          <div
            className="absolute inset-x-0 pointer-events-none z-10 transition-colors duration-500"
            style={{
              top: CENTER * ITEM_H,
              height: ITEM_H,
              borderTop:    stopped ? '2px solid oklch(0.47 0.17 234 / 0.55)' : '1px solid oklch(0.50 0.18 295 / 0.22)',
              borderBottom: stopped ? '2px solid oklch(0.47 0.17 234 / 0.55)' : '1px solid oklch(0.50 0.18 295 / 0.22)',
              background:   stopped ? 'oklch(0.47 0.17 234 / 0.06)' : 'oklch(0.50 0.18 295 / 0.04)',
            }}
          />

          {/* Scrolling list — willChange promotes to GPU compositing layer.
              pointerEvents:none skips hit-testing on N×reps divs during mouse events. */}
          <div ref={listRef} style={{ willChange: 'transform', pointerEvents: 'none' }}>
            {extPool.map((name, i) => (
              <div key={i} className="flex items-center justify-center px-6" style={{ height: ITEM_H }}>
                <span
                  className="text-center font-semibold leading-tight truncate max-w-full"
                  style={{ fontSize: '1.1rem', color: NAME_CLR }}
                >
                  {name}
                </span>
              </div>
            ))}
          </div>

          {/* Winner overlay — covers the list item at center with drum background,
              then renders the winner name in primary-700. Only mounted when stopped. */}
          {stopped && revealName && (
            <div
              className="absolute inset-x-0 z-30 flex items-center justify-center px-6 pointer-events-none"
              style={{ top: CENTER * ITEM_H, height: ITEM_H, background: DRUM_BG }}
            >
              <span
                className="text-center font-black leading-tight truncate max-w-full font-heading"
                style={{ fontSize: '1.6rem', color: PRI7, textShadow: '0 0 16px oklch(0.47 0.17 234 / 0.18)' }}
              >
                {revealName}
              </span>
            </div>
          )}

          {/* Gradient masks — fade list edges to white */}
          <div
            className="absolute inset-x-0 top-0 pointer-events-none z-20"
            style={{
              height: ITEM_H * 2.5,
              background: `linear-gradient(to bottom, ${DRUM_BG} 0%, oklch(1.000 0.000 0 / 0.82) 52%, transparent 100%)`,
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 pointer-events-none z-20"
            style={{
              height: ITEM_H * 2.5,
              background: `linear-gradient(to top, ${DRUM_BG} 0%, oklch(1.000 0.000 0 / 0.82) 52%, transparent 100%)`,
            }}
          />
        </div>
      </div>

      {/* ── Status ── */}
      <div className="relative z-10 mt-8 min-h-8 flex items-center justify-center">
        {phase === 'fast' && (
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-2 h-2 rounded-full animate-bounce"
                style={{ background: VIO, animationDelay: `${i * 140}ms` }} />
            ))}
          </div>
        )}
        {phase === 'reveal' && (
          <p className="text-xs font-bold tracking-widest uppercase animate-pulse" style={{ color: VIO_D }}>
            Revelando…
          </p>
        )}
        {phase === 'stopped' && revealName && (
          <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse" style={{ color: PRI6 }}>
            ¡Ganador encontrado!
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Side arrow ───────────────────────────────────────────────────────────────

function SideArrow({
  side, stopped, centerTop, itemHeight,
}: {
  side: 'left' | 'right'; stopped: boolean; centerTop: number; itemHeight: number;
}) {
  const color = stopped ? PRI6 : VIO;
  const isLeft = side === 'left';
  return (
    <div
      className="absolute flex items-center"
      style={{ top: centerTop, height: itemHeight, [isLeft ? 'right' : 'left']: '100%', padding: '0 7px' }}
    >
      <svg viewBox="0 0 10 18" style={{ width: 10, height: 18, fill: color,
        filter: `drop-shadow(0 0 4px ${color})`, transform: isLeft ? 'none' : 'scaleX(-1)' }}>
        <path d="M10 9 L0 0 L0 18 Z" />
      </svg>
    </div>
  );
}
