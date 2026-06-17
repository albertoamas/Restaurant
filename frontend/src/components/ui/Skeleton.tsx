interface SkeletonProps {
  variant?: 'text' | 'title' | 'circle' | 'rect' | 'card';
  w?: string;
  h?: string;
  size?: number;
  className?: string;
}

const shimmer = [
  'animate-shimmer',
  'bg-[linear-gradient(90deg,var(--shimmer-from)_25%,var(--shimmer-to)_50%,var(--shimmer-from)_75%)]',
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
        className={`rounded-xl border border-[var(--border-subtle)] p-6 ${className}`}
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
