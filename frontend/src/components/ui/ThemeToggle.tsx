import { useTheme } from '../../hooks/useTheme';
import { Icon } from './Icon';

/** Botón de tema claro u oscuro (encabezado de la app, landing y admin). */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const label = theme === 'dark' ? 'Usar tema claro' : 'Usar tema oscuro';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control text-soft transition-colors hover:bg-surface-2 hover:text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60"
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
    </button>
  );
}
