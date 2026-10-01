import { createPortal } from 'react-dom';
import { useEffect, useLayoutEffect, useRef, useState, useMemo, useCallback } from 'react';
import { WINNER_PAUSE_MS } from '../../hooks/useRaffleDetail';
import { playDrawTick } from '../../utils/raffle-sounds';
import { positionLabel } from '../../utils/raffle-utils';
import { Icon } from '../ui/Icon';

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

// For pools larger than this, winner occurrences are spaced > DECEL_DIST apart.
// Targeting the winner directly would cause jarring acceleration at decel start.
// In that case we stop at DECEL_DIST ahead and reveal winner via overlay fade-in.
const SMALL_POOL_THRESHOLD = Math.floor(DECEL_DIST / ITEM_H); // ≈ 20

// ─── Colores del escenario ────────────────────────────────────────────────────
// Fijos, no del tema: la pantalla del sorteo es siempre un escenario oscuro con la marca.

const STAGE_BG   = 'oklch(0.17 0.012 45)';
const DRUM_BG    = 'oklch(0.23 0.012 45)';
const DRUM_FADE  = 'oklch(0.23 0.012 45 / 0.82)';
const DRUM_EDGE  = 'oklch(0.32 0.014 45)';
const TEXT       = 'oklch(0.96 0.008 60)';
const TEXT_SOFT  = 'oklch(0.78 0.012 60)';
const BRAND      = 'oklch(0.72 0.19 45)';
/** Marca con transparencia: se completa con " <alfa>)". */
const BRAND_A    = 'oklch(0.72 0.19 45 /';

export function DrawingScreen({
  position,
  names,
  revealName,
  raffleName,
  prize,
}: {
  position: number;
  names: string[];
  revealName: string | null;
  raffleName?: string;
  /** Premio del lugar que se sortea: se muestra en grande. */
  prize?: string | null;
}) {
  // pool is intentionally frozen at mount: names won't change during a single draw.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pool = useMemo(() => (names.length > 0 ? names : ['-']), []);

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

    const from = offsetRef.current;
    let to: number;

    if (pool.length <= SMALL_POOL_THRESHOLD) {
      // Small pool: winner repeats within DECEL_DIST → decel directly onto winner name.
      const wIdx        = pool.indexOf(revealName) >= 0 ? pool.indexOf(revealName) : 0;
      const idealCenter = CENTER + (from + DECEL_DIST) / ITEM_H;
      const k           = Math.round((idealCenter - wIdx) / pool.length);
      const minCenter   = CENTER + from / ITEM_H + 3;
      const safeK       = Math.max(k, Math.ceil((minCenter - wIdx) / pool.length));
      to                = (safeK * pool.length + wIdx - CENTER) * ITEM_H;
    } else {
      // Large pool: winner occurrences are spaced farther than DECEL_DIST apart.
      // Targeting winner directly would make easeOutQuad start much faster than SPEED,
      // causing the "spinning wild" bug. Stop at exactly DECEL_DIST ahead instead —
      // the winner is revealed via the overlay fade-in below.
      to = from + DECEL_DIST;
    }

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
  // Escenario oscuro con la marca, en ambos temas: es una pantalla de presentación (se muestra a
  // los clientes en el local), como un show, no una vista de trabajo.

  const statusText =
    phase === 'fast'   ? `Girando entre ${pool.length === 1 ? '1 ticket' : `${pool.length} tickets`}`
    : phase === 'reveal' ? 'Frenando'
    : revealName         ? 'Tenemos ganador'
    : 'Sorteando';

  // En el body: dentro de la página, un ancestro animado (transform) haría que "fixed" quede
  // relativo a él y no cubra la pantalla completa.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Sorteando el ${positionLabel(position)}`}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-hidden px-4 py-6 select-none"
      style={{ background: STAGE_BG }}
    >
      {/* Luz de escenario: cálida mientras gira, más intensa al encontrar ganador. Sin transición
          (los degradados se pintan en CPU). */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: stopped
            ? `radial-gradient(ellipse 60% 50% at 50% 55%, ${BRAND_A} 0.32) 0%, transparent 70%)`
            : `radial-gradient(ellipse 60% 50% at 50% 55%, ${BRAND_A} 0.16) 0%, transparent 70%)`,
        }}
      />

      {/* ── Qué se sortea ── */}
      <div className="relative z-10 mb-5 w-full max-w-md text-center sm:mb-8">
        {raffleName && <p className="text-label font-medium" style={{ color: TEXT_SOFT }}>{raffleName}</p>}
        <p className="mt-1 font-heading text-title font-bold sm:text-display" style={{ color: TEXT }}>
          Sorteando el {positionLabel(position)}
        </p>
        {prize && (
          <div
            className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full px-4 py-2"
            style={{ background: `${BRAND_A} 0.16)`, border: `1px solid ${BRAND_A} 0.45)` }}
          >
            <span className="shrink-0" style={{ color: BRAND }}><Icon name="gift" size={18} /></span>
            <span className="truncate text-body font-semibold" style={{ color: TEXT }}>{prize}</span>
          </div>
        )}
      </div>

      {/* ── Ruleta ── */}
      {/* Margen a los lados: las flechas van por fuera de la ruleta y en celular quedaban fuera de la pantalla. */}
      <div className="relative z-10 w-[calc(100%-3rem)] max-w-sm">
        <SideArrow side="left"  stopped={stopped} centerTop={CENTER * ITEM_H} itemHeight={ITEM_H} />
        <SideArrow side="right" stopped={stopped} centerTop={CENTER * ITEM_H} itemHeight={ITEM_H} />

        <div
          className="relative overflow-hidden"
          style={{
            height: CONT_H,
            borderRadius: 20,
            background: DRUM_BG,
            border: `1px solid ${DRUM_EDGE}`,
            boxShadow: stopped ? `0 0 0 1px ${BRAND_A} 0.5), 0 20px 60px ${BRAND_A} 0.25)` : '0 20px 60px oklch(0 0 0 / 0.45)',
            contain: 'layout style paint',
          }}
        >
          {/* Franja central: marca dónde se detiene el ganador. */}
          <div
            className="pointer-events-none absolute inset-x-0 z-10 transition-colors duration-500"
            style={{
              top: CENTER * ITEM_H,
              height: ITEM_H,
              borderTop:    `2px solid ${stopped ? BRAND : `${BRAND_A} 0.45)`}`,
              borderBottom: `2px solid ${stopped ? BRAND : `${BRAND_A} 0.45)`}`,
              background:   `${BRAND_A} ${stopped ? 0.16 : 0.08})`,
            }}
          />

          {/* Lista que gira: capa propia en GPU y sin eventos del puntero en cientos de filas. */}
          <div ref={listRef} style={{ willChange: 'transform', pointerEvents: 'none' }}>
            {extPool.map((name, i) => (
              <div key={i} className="flex items-center justify-center px-6" style={{ height: ITEM_H }}>
                <span className="max-w-full truncate text-center font-semibold leading-tight" style={{ fontSize: '1.15rem', color: TEXT }}>
                  {name}
                </span>
              </div>
            ))}
          </div>

          {/* Ganador: aparece sobre la franja central al detenerse (en pozos grandes es la revelación). */}
          <div
            className="pointer-events-none absolute inset-x-0 z-30 flex items-center justify-center px-6"
            style={{
              top: CENTER * ITEM_H,
              height: ITEM_H,
              background: DRUM_BG,
              opacity: stopped && revealName ? 1 : 0,
              transition: 'opacity 0.3s ease-out',
            }}
          >
            <span className="max-w-full truncate text-center font-heading font-bold leading-tight" style={{ fontSize: '1.7rem', color: BRAND }}>
              {revealName ?? ''}
            </span>
          </div>

          {/* Bordes que se desvanecen hacia el fondo de la ruleta. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20" style={{ height: ITEM_H * 2.5, background: `linear-gradient(to bottom, ${DRUM_BG} 0%, ${DRUM_FADE} 52%, transparent 100%)` }} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20" style={{ height: ITEM_H * 2.5, background: `linear-gradient(to top, ${DRUM_BG} 0%, ${DRUM_FADE} 52%, transparent 100%)` }} />
        </div>
      </div>

      {/* ── Estado ── */}
      <p
        className="relative z-10 mt-5 text-body font-semibold sm:mt-8"
        style={{ color: stopped && revealName ? BRAND : TEXT_SOFT }}
        aria-live="polite"
      >
        {statusText}
      </p>
    </div>,
    document.body,
  );
}

// ─── Side arrow ───────────────────────────────────────────────────────────────

function SideArrow({
  side, stopped, centerTop, itemHeight,
}: {
  side: 'left' | 'right'; stopped: boolean; centerTop: number; itemHeight: number;
}) {
  const color = stopped ? BRAND : `${BRAND_A} 0.7)`;
  const isLeft = side === 'left';
  return (
    <div
      className="absolute flex items-center"
      style={{ top: centerTop, height: itemHeight, [isLeft ? 'right' : 'left']: '100%', padding: '0 8px' }}
    >
      <svg viewBox="0 0 10 18" style={{ width: 12, height: 22, fill: color, transform: isLeft ? 'none' : 'scaleX(-1)' }}>
        <path d="M10 9 L0 0 L0 18 Z" />
      </svg>
    </div>
  );
}
