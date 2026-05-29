import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth.context';
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
}

export function Header({ onMenuOpen }: HeaderProps) {
  const location = useLocation();
  const { user } = useAuth();
  const title = getTitle(location.pathname);
  const userInitial = (user?.name ?? '?')[0].toUpperCase();

  return (
    <header
      data-print-hide
      className="h-14 backdrop-blur-xl border-b px-5 flex items-center justify-between shrink-0 relative z-10"
      style={{
        background: 'oklch(0.98 0.008 248 / 0.85)',
        borderColor: 'oklch(0.86 0.020 248 / 0.60)',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuOpen}
          className="lg:hidden -ml-1 p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-white/60 transition-colors"
          aria-label="Abrir menú"
        >
          <Icon name="menu" size={20} />
        </button>

        <span className="w-1 h-5 bg-primary-500 rounded-full" />
        <h2 className="text-[17px] font-bold text-gray-900 font-heading">{title}</h2>
      </div>
      <div className="flex items-center gap-3">
        <ConnectionStatus />
        <span className="text-sm text-gray-500 hidden md:block capitalize">{formatDate()}</span>
        <span className="text-sm text-gray-500 md:hidden capitalize">{formatDateShort()}</span>
        <div className="flex items-center gap-2 pl-3 border-l border-gray-300/60">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center shadow-[0_2px_8px_oklch(0.49_0.21_234/0.35)]">
            <span className="text-xs font-bold text-white">{userInitial}</span>
          </div>
          <span className="text-sm font-semibold text-gray-700 hidden sm:block">{user?.name}</span>
        </div>
      </div>
    </header>
  );
}
