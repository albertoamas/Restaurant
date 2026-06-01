import { type InputHTMLAttributes, useId, type ReactNode, type Ref } from 'react';
import { Icon } from './Icon';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>;
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
  inputSize?: 'sm' | 'md' | 'lg';
}

const inputSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-3 text-base',
};

export function Input({ label, error, hint, leftAddon, rightAddon, inputSize = 'md', className = '', ref, ...props }: InputProps) {
  const id = useId();
  const inputId = props.id ?? id;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-600 tracking-[0.01em]">
          {label}
        </label>
      )}
      <div className={[
        'flex items-center rounded-xl border bg-[var(--color-surface-card)] transition-[border-color,box-shadow] duration-150',
        'focus-within:ring-[3px] focus-within:ring-primary-500/20 focus-within:border-primary-500',
        props.disabled ? 'bg-gray-100 border-gray-200 opacity-75' : '',
        error
          ? 'border-red-600/60 bg-red-50/10'
          : 'border-white/10 hover:border-white/18',
      ].join(' ')}>
        {leftAddon && (
          <span className="pl-3 text-sm text-gray-500 shrink-0 select-none">{leftAddon}</span>
        )}
        <input
          id={inputId}
          ref={ref}
          className={[
            'flex-1 min-w-0 bg-transparent outline-none placeholder:text-gray-400 text-gray-700',
            inputSizes[inputSize],
            leftAddon ? 'pl-1' : '',
            rightAddon ? 'pr-1' : '',
            className,
          ].join(' ')}
          {...props}
        />
        {rightAddon && (
          <span className="pr-3 text-sm text-gray-500 shrink-0 select-none">{rightAddon}</span>
        )}
      </div>
      {error && (
        <span className="text-xs text-red-600 font-medium flex items-center gap-1">
          <Icon name="warning" size={14} strokeWidth={2} className="shrink-0" />
          {error}
        </span>
      )}
      {hint && !error && (
        <span className="text-xs text-gray-500">{hint}</span>
      )}
    </div>
  );
}
