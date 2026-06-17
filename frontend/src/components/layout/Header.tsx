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
};

function getTitle(pathname: string): string {
  if (pathname.startsWith('/raffles/')) return 'Sorteos';
  return pageTitles[pathname] ?? 'POS';
}

function formatDate(): string {
  return new Date().toLocaleDateString('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
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
      className="h-14 backdrop-blur-xl border-b px-5 flex items-center justify-between shrink-0 relative z-10"
      style={{
        background: 'oklch(0.16 0.028 40 / 0.96)',
        borderColor: 'oklch(0.28 0.020 40 / 0.70)',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuOpen}
          className="lg:hidden -ml-1 p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/8 transition-colors"
          aria-label="Abrir menú"
        >
          <Icon name="menu" size={20} />
        </button>

        {/* Sidebar toggle — desktop only */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex -ml-1 p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/8 transition-colors"
            aria-label={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            <Icon name={sidebarCollapsed ? 'chevron-right' : 'chevron-left'} size={18} strokeWidth={2} />
          </button>
        )}

        <span className="w-1 h-5 bg-primary-500 rounded-full" />
        <h2 className="text-[17px] font-bold text-white/90 font-heading">{title}</h2>
      </div>
      <div className="flex items-center gap-3">
        <ConnectionStatus />
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/8 transition-colors"
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} strokeWidth={1.75} />
        </button>
        <span className="text-sm text-white/40 hidden md:block capitalize">{formatDate()}</span>
        <span className="text-sm text-white/40 md:hidden capitalize">{formatDateShort()}</span>
        <div className="flex items-center gap-2 pl-3 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center shadow-[0_2px_8px_oklch(0.60_0.22_42/0.40)]">
            <span className="text-xs font-bold text-white">{userInitial}</span>
          </div>
          <span className="text-sm font-semibold text-white/75 hidden sm:block">{user?.name}</span>
        </div>
      </div>
    </header>
  );
}
