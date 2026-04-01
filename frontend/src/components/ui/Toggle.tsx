interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label?: string;
}

export function Toggle({ checked, onChange, disabled = false, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent',
        'transition-all duration-200 focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        checked
          ? 'bg-primary-600 shadow-[inset_0_0_0_1px_oklch(0.50_0.24_225/0.3)]'
          : 'bg-gray-200',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-5 w-5 rounded-full bg-white',
          'shadow-[0_1px_3px_oklch(0.13_0.012_260/0.20)]',
          'transition-all duration-200',
          checked ? 'translate-x-5 scale-110' : 'translate-x-0 scale-100',
        ].join(' ')}
      />
    </button>
  );
}
