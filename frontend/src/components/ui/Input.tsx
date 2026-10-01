import {
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useId,
} from 'react';
import { Icon } from './Icon';

/* ── Base común de los campos: etiqueta, ayuda y error ─────────────────────── */

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
}

function Field({ id, label, error, hint, children }: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-label font-medium text-soft">
          {label}
        </label>
      )}
      {children}
      {error && (
        <span id={`${id}-error`} className="text-caption text-red-700 dark:text-red-300 font-medium flex items-center gap-1">
          <Icon name="warning" size={14} strokeWidth={2} className="shrink-0" />
          {error}
        </span>
      )}
      {hint && !error && (
        <span id={`${id}-hint`} className="text-caption text-muted">{hint}</span>
      )}
    </div>
  );
}

/** Caja del campo: misma altura, borde, fondo y foco para input, select y textarea. */
function boxClasses(error?: string, disabled?: boolean) {
  return [
    'rounded-control border bg-surface-card transition-[border-color,box-shadow] duration-150',
    'focus-within:ring-[3px] focus-within:ring-primary-500/20 focus-within:border-primary-500',
    disabled ? 'opacity-60 pointer-events-none' : '',
    error ? 'border-red-600/70' : 'border-line hover:border-line-strong',
  ].join(' ');
}

const describedBy = (id: string, error?: string, hint?: string) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

/* ── Input ─────────────────────────────────────────────────────────────────── */

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldProps {
  ref?: Ref<HTMLInputElement>;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
  /** sm 36 px · md 44 px (táctil, por defecto) · lg 48 px. */
  inputSize?: 'sm' | 'md' | 'lg';
}

const inputSizes = {
  sm: 'min-h-9 px-3 text-label',
  md: 'min-h-11 px-3.5 text-body',
  lg: 'min-h-12 px-4 text-body',
};

export function Input({ label, error, hint, leftAddon, rightAddon, inputSize = 'md', className = '', ref, ...props }: InputProps) {
  const autoId = useId();
  const id = props.id ?? autoId;
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <div className={`flex items-center ${boxClasses(error, props.disabled)}`}>
        {leftAddon && <span className="pl-3.5 text-body text-muted shrink-0 select-none">{leftAddon}</span>}
        <input
          id={id}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={[
            'flex-1 min-w-0 bg-transparent outline-none placeholder:text-muted text-main',
            inputSizes[inputSize],
            leftAddon ? 'pl-1.5' : '',
            rightAddon ? 'pr-1.5' : '',
            className,
          ].join(' ')}
          {...props}
        />
        {rightAddon && <span className="pr-3.5 text-body text-muted shrink-0 select-none">{rightAddon}</span>}
      </div>
    </Field>
  );
}

/* ── Select ────────────────────────────────────────────────────────────────── */

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldProps {
  ref?: Ref<HTMLSelectElement>;
  inputSize?: 'sm' | 'md' | 'lg';
}

export function Select({ label, error, hint, inputSize = 'md', className = '', ref, children, ...props }: SelectProps) {
  const autoId = useId();
  const id = props.id ?? autoId;
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <div className={`relative flex items-center ${boxClasses(error, props.disabled)}`}>
        <select
          id={id}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={`w-full appearance-none bg-transparent outline-none text-main pr-10 ${inputSizes[inputSize]} ${className}`}
          {...props}
        >
          {children}
        </select>
        <Icon name="chevron-down" size={16} strokeWidth={2} className="absolute right-3.5 text-muted pointer-events-none" />
      </div>
    </Field>
  );
}

/* ── Textarea ──────────────────────────────────────────────────────────────── */

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldProps {
  ref?: Ref<HTMLTextAreaElement>;
}

export function Textarea({ label, error, hint, className = '', rows = 3, ref, ...props }: TextareaProps) {
  const autoId = useId();
  const id = props.id ?? autoId;
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <div className={boxClasses(error, props.disabled)}>
        <textarea
          id={id}
          ref={ref}
          rows={rows}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={`block w-full resize-y bg-transparent outline-none placeholder:text-muted text-main text-body px-3.5 py-2.5 ${className}`}
          {...props}
        />
      </div>
    </Field>
  );
}
