import { Icon } from '../ui/Icon';

const TONES = {
  neutral: 'text-soft hover:bg-surface-2 hover:text-main',
  danger:  'text-white bg-red-700 hover:bg-red-800',
};

/** Botón cuadrado de 44 px para las acciones de las filas de la lista de gastos. */
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
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-control transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 ${TONES[tone]}`}
    >
      <Icon name={icon} size={18} />
    </button>
  );
}
