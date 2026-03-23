import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth.context';

const pageTitles: Record<string, string> = {
  '/pos': 'Punto de Venta',
  '/orders': 'Pedidos',
  '/report': 'Reporte Diario',
  '/products': 'Productos',
};

function formatDate(): string {
  return new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function Header() {
  const location = useLocation();
  const { user } = useAuth();
  const title = pageTitles[location.pathname] || 'POS';

  return (
    <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500 hidden sm:block capitalize">{formatDate()}</span>
        <span className="text-sm font-medium text-gray-700">{user?.name}</span>
      </div>
    </header>
  );
}
