interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'muted';
}

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-12 h-12 border-4',
};

const colors = {
  primary: 'border-primary-600 border-t-transparent',
  white:   'border-white border-t-transparent',
  muted:   'border-line-strong border-t-transparent',
};

export function Spinner({ size = 'md', color = 'primary' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className={`${sizes[size]} ${colors[color]} rounded-full animate-spin`}
    />
  );
}
