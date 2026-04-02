import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth.context';

const pageTitles: Record<string, string> = {
  '/pos':      'Punto de Venta',
  '/orders':   'Pedidos',
  '/report':   'Reporte Diario',
  '/products': 'Productos',
  '/kitchen':  'Cocina',
  '/cash':     'Caja',
  '/team':     'Equipo',
  '/branches': 'Sucursales',
  '/settings': 'Configuración',
};

function formatDate(): string {
  return new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatDateShort(): string {
  return new Date().toLocaleDateString('es-ES', {
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
  const title = pageTitles[location.pathname] || 'POS';
  const userInitial = (user?.name ?? '?')[0].toUpperCase();

  return (
    <header className="h-14 bg-white/90 backdrop-blur-lg border-b border-gray-200/80 px-5 flex items-center justify-between shrink-0 relative z-10">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuOpen}
          className="lg:hidden -ml-1 p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          aria-label="Abrir menú"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <span className="w-1 h-5 bg-primary-500 rounded-full" />
        <h2 className="text-[17px] font-bold text-gray-900 font-heading">{title}</h2>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400 hidden md:block capitalize">{formatDate()}</span>
        <span className="text-sm text-gray-400 md:hidden capitalize">{formatDateShort()}</span>
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-xs font-bold text-primary-700">{userInitial}</span>
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.name}</span>
        </div>
      </div>
    </header>
  );
}
