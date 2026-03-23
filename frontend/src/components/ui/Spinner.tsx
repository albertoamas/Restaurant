interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

export function Spinner({ size = 'md' }: SpinnerProps) {
  return (
    <div className={`${sizes[size]} border-4 border-sky-600 border-t-transparent rounded-full animate-spin`} />
  );
}
