/**
 * Skeleton — Placeholders animados para estados de carga.
 *
 * Uso:
 *   <Skeleton />                         ← línea de texto (default)
 *   <Skeleton variant="title" />         ← título ancho
 *   <Skeleton variant="circle" size={40} />   ← avatar / ícono circular
 *   <Skeleton variant="rect" h={120} />  ← bloque rectangular libre
 *   <Skeleton variant="card" />          ← card completa
 *
 * Composición:
 *   <SkeletonGroup count={3} />          ← lista de N líneas con gap
 */

interface SkeletonProps {
  variant?: 'text' | 'title' | 'circle' | 'rect' | 'card';
  /** Ancho CSS (aplica a text / title / rect). Default 'auto'. */
  w?: string;
  /** Alto CSS (aplica a rect). Default según variante. */
  h?: string;
  /** Diámetro en px (aplica solo a circle). Default 40. */
  size?: number;
  className?: string;
}

const shimmer = [
  'animate-shimmer',
  'bg-[linear-gradient(90deg,oklch(0.17_0.012_40)_25%,oklch(0.24_0.016_42)_50%,oklch(0.17_0.012_40)_75%)]',
  'rounded-lg',
].join(' ');

export function Skeleton({
  variant = 'text',
  w,
  h,
  size = 40,
  className = '',
}: SkeletonProps) {
  if (variant === 'circle') {
    return (
      <span
        className={`${shimmer} block shrink-0 rounded-full ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    );
  }

  if (variant === 'rect') {
    return (
      <span
        className={`${shimmer} block ${className}`}
        style={{ width: w ?? '100%', height: h ?? '80px' }}
        aria-hidden="true"
      />
    );
  }

  if (variant === 'title') {
    return (
      <span
        className={`${shimmer} block h-7 ${className}`}
        style={{ width: w ?? '55%' }}
        aria-hidden="true"
      />
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={`rounded-xl border border-white/6 p-6 ${className}`}
        style={{ background: 'var(--color-surface-card)' }}
        aria-hidden="true"
      >
        <div className="flex items-center gap-3 mb-4">
          <Skeleton variant="circle" size={36} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="title" w="40%" />
            <Skeleton w="60%" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton />
          <Skeleton w="80%" />
          <Skeleton w="90%" />
        </div>
      </div>
    );
  }

  // text (default)
  return (
    <span
      className={`${shimmer} block h-4 ${className}`}
      style={{ width: w ?? '100%' }}
      aria-hidden="true"
    />
  );
}

/* ── SkeletonGroup ─────────────────────────────────────────── */

interface SkeletonGroupProps {
  /** Número de líneas de texto a mostrar. Default 3. */
  count?: number;
  className?: string;
}

export function SkeletonGroup({ count = 3, className = '' }: SkeletonGroupProps) {
  const widths = ['100%', '85%', '92%', '78%', '88%', '70%'];

  return (
    <div className={`flex flex-col gap-2 ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} w={widths[i % widths.length]} />
      ))}
    </div>
  );
}
