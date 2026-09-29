import { useAuth } from '../../context/auth.context';
import { useTheme } from '../../hooks/useTheme';
import { ConnectionStatus } from './ConnectionStatus';
import { Icon } from '../ui/Icon';

/** "Martes, 29 de septiembre": solo la primera letra en mayúscula, como se escribe en español. */
function formatDate(): string {
  const s = new Date().toLocaleDateString('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface HeaderProps {
  onMenuOpen: () => void;
}

/**
 * Barra superior. No repite el título de la pantalla (cada pantalla tiene el suyo) ni el
 * usuario (está en el menú lateral). En celular muestra el negocio, porque no hay Sidebar.
 */
export function Header({ onMenuOpen }: HeaderProps) {
  const { user } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <header
      data-print-hide
      className="h-14 bg-surface-page/80 backdrop-blur-xl border-b border-line px-2 sm:px-5 flex items-center justify-between gap-3 shrink-0 relative z-10 supports-[backdrop-filter]:bg-surface-page/60"
    >
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onMenuOpen}
          className="lg:hidden w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-soft hover:text-main hover:bg-surface-2 transition-colors"
          aria-label="Abrir menú"
        >
          <Icon name="menu" size={20} />
        </button>
        <div className="lg:hidden flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-[8px] bg-primary-500 flex items-center justify-center shrink-0">
            <Icon name="cart" size={14} strokeWidth={2} className="text-white" />
          </div>
          <span className="text-body font-semibold text-main font-heading truncate">{user?.tenantName || 'Mi negocio'}</span>
        </div>
        <span className="hidden lg:block text-label text-soft">{formatDate()}</span>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <ConnectionStatus />
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema oscuro'}
          title={theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
          className="w-10 h-10 flex items-center justify-center rounded-full text-soft hover:text-main hover:bg-surface-2 transition-colors"
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
        </button>
      </div>
    </header>
  );
}
