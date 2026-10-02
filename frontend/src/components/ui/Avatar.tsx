const SIZES = {
  sm: 'h-8 w-8 text-label',
  md: 'h-10 w-10 text-body font-heading',
  lg: 'h-14 w-14 text-title font-heading',
};

const TONES = {
  neutral: 'border border-line bg-surface-2 text-soft',
  brand:   'bg-primary-500/15 text-primary-700 dark:text-primary-400',
  muted:   'border border-line bg-surface-2 text-muted',
};

/** Inicial de una persona o un negocio en un círculo (o un cuadrado, para negocios). */
export function Avatar({ name, size = 'md', tone = 'neutral', square = false }: {
  name: string;
  size?: keyof typeof SIZES;
  tone?: keyof typeof TONES;
  square?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center font-bold ${square ? 'rounded-card' : 'rounded-full'} ${SIZES[size]} ${TONES[tone]}`}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
