import { Icon } from '../ui/Icon';

const TONES = {
  neutral: 'text-gray-400 hover:bg-[var(--color-surface-2)] hover:text-gray-700',
  danger:  'text-white bg-red-600 hover:opacity-90',
};

/** Botón cuadrado de acción en las filas de las listas de gastos. */
export function IconAction({
  icon, label, onClick, tone = 'neutral',
}: {
  icon: 'check' | 'x' | 'edit' | 'trash';
  label: string;
  onClick: () => void;
  tone?: keyof typeof TONES;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${TONES[tone]}`}
    >
      <Icon name={icon} size={15} strokeWidth={2.2} />
    </button>
  );
}
