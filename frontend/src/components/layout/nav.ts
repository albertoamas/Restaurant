import { useAuth } from '../../context/auth.context';
import { useSettingsStore } from '../../store/settings.store';
import type { IconName } from '../ui/Icon';

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
}

/**
 * Menú de la app: una sola definición para el Sidebar (escritorio) y el menú móvil.
 * Antes eran dos listas que habían divergido en orden, etiquetas y permisos (el menú
 * móvil mostraba "Ajustes" a cajeros que no pueden entrar y les ocultaba "Mi rendición").
 *
 * Grupos: operación del día · gestión del negocio · administración.
 * La visibilidad por módulo repite la de ModuleRoute en App.tsx: si un módulo está
 * deshabilitado, su entrada desaparece del menú y la URL directa redirige.
 */
export function useNavGroups(): NavItem[][] {
  const { user } = useAuth();
  const { kitchenEnabled, ordersEnabled, cashEnabled, teamEnabled, branchesEnabled, rafflesEnabled } = useSettingsStore();
  const isOwner = user?.role === 'OWNER';

  const operation: NavItem[] = [
    { to: '/pos', label: 'Punto de venta', icon: 'cart' },
    ...(kitchenEnabled ? [{ to: '/kitchen', label: 'Cocina', icon: 'flame' as const }] : []),
    ...(ordersEnabled ? [{ to: '/orders', label: 'Pedidos', icon: 'orders' as const }] : []),
    ...(cashEnabled ? [{ to: '/cash', label: 'Caja', icon: 'cash' as const }] : []),
  ];

  if (!isOwner) {
    return [operation, [{ to: '/mi-reporte', label: 'Mi rendición', icon: 'document' }]];
  }

  return [
    operation,
    [
      { to: '/report', label: 'Reportes', icon: 'chart' },
      { to: '/expenses', label: 'Gastos', icon: 'receipt' },
      { to: '/customers', label: 'Clientes', icon: 'users' },
      ...(rafflesEnabled ? [{ to: '/raffles', label: 'Sorteos', icon: 'ticket' as const }] : []),
      { to: '/products', label: 'Productos', icon: 'box' },
    ],
    [
      ...(teamEnabled ? [{ to: '/team', label: 'Equipo', icon: 'team' as const }] : []),
      ...(branchesEnabled ? [{ to: '/branches', label: 'Sucursales', icon: 'building' as const }] : []),
      { to: '/settings', label: 'Configuración', icon: 'settings' },
    ],
  ];
}
