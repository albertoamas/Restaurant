import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth.context';
import { useTheme } from '../../hooks/useTheme';
import { ConnectionStatus } from './ConnectionStatus';
import { Icon } from '../ui/Icon';

const pageTitles: Record<string, string> = {
  '/pos':       'Punto de Venta',
  '/orders':    'Pedidos',
  '/report':    'Reporte Diario',
  '/products':  'Productos',
  '/kitchen':   'Cocina',
  '/cash':      'Caja',
  '/team':      'Equipo',
  '/branches':  'Sucursales',
  '/settings':  'Configuración',
  '/expenses':  'Gastos',
  '/customers': 'Clientes',
  '/raffles':   'Sorteos',
  '/account':   'Mi cuenta',
  '/mi-reporte': 'Mi Rendición',
};

function getTitle(pathname: string): string {
  if (pathname.startsWith('/raffles/')) return 'Sorteos';
  return pageTitles[pathname] ?? 'POS';
}

/** "Martes, 29 de septiembre": solo la primera letra en mayúscula, como se escribe en español. */
function formatDate(): string {
  const s = new Date().toLocaleDateString('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDateShort(): string {
  return new Date().toLocaleDateString('es-BO', {
    day: 'numeric',
    month: 'short',
  });
}

interface HeaderProps {
  onMenuOpen: () => void;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

export function Header({ onMenuOpen, onToggleSidebar, sidebarCollapsed }: HeaderProps) {
  const location = useLocation();
  const { user } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const title = getTitle(location.pathname);
  const userInitial = (user?.name ?? '?')[0].toUpperCase();

  return (
    <header
      data-print-hide
      className="h-14 bg-surface-page/80 backdrop-blur-xl border-b border-line px-3 sm:px-5 flex items-center justify-between gap-3 shrink-0 relative z-10 supports-[backdrop-filter]:bg-surface-page/60 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuOpen}
          className="lg:hidden -ml-1 p-1.5 rounded-lg text-muted hover:text-main hover:bg-surface-2 transition-colors"
          aria-label="Abrir menú"
        >
          <Icon name="menu" size={20} />
        </button>

        {/* Sidebar toggle — desktop only */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex -ml-1 p-1.5 rounded-lg text-muted hover:text-main hover:bg-surface-2 transition-colors"
            aria-label={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            <Icon name={sidebarCollapsed ? 'chevron-right' : 'chevron-left'} size={18} strokeWidth={2} />
          </button>
        )}

        <span className="w-1 h-5 bg-primary-500 rounded-full shrink-0" />
        <h2 className="text-[17px] font-bold text-main font-heading truncate">{title}</h2>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <ConnectionStatus />
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          className="p-1.5 rounded-lg text-muted hover:text-main hover:bg-surface-2 transition-colors"
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} strokeWidth={1.75} />
        </button>
        <span className="text-sm text-soft hidden md:block">{formatDate()}</span>
        <span className="text-sm text-soft hidden sm:block md:hidden whitespace-nowrap">{formatDateShort()}</span>
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-line">
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center shadow-md shadow-primary-500/20">
            <span className="text-xs font-bold text-white">{userInitial}</span>
          </div>
          <span className="text-sm font-semibold text-main hidden sm:block">{user?.name}</span>
        </div>
      </div>
    </header>
  );
}
