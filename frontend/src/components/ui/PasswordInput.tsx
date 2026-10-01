import { useState } from 'react';
import { Icon } from './Icon';
import { Input } from './Input';

/** Campo de contraseña con botón para ver lo que se escribe. */
export function PasswordInput({ label, value, onChange, autoComplete, error, hint }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  error?: string;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      label={label}
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      hint={hint}
      rightAddon={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="w-9 h-9 -mr-1 flex items-center justify-center rounded-control text-muted hover:text-main transition-colors"
        >
          <Icon name={visible ? 'eye-off' : 'eye'} size={18} />
        </button>
      }
    />
  );
}
