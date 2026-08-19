import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth.context';
import { useSettingsStore } from '../../store/settings.store';
import { useBranchSelector } from '../../hooks/useBranchSelector';
import { BranchSelector } from './BranchSelector';
import { Icon } from '../ui/Icon';

const cashNavItem        = { to: '/cash',        label: 'Caja',         icon: <Icon name="cash"     /> };
const rafflesNavItem     = { to: '/raffles',     label: 'Sorteos',      icon: <Icon name="ticket"   /> };
const kitchenNavItem     = { to: '/kitchen',     label: 'Cocina',       icon: <Icon name="flame"    /> };
const cashierReportItem  = { to: '/mi-reporte',  label: 'Mi Rendición', icon: <Icon name="document" /> };

const ownerNav = [
  { to: '/pos',       label: 'POS',           icon: <Icon name="cart"     /> },
  { to: '/orders',    label: 'Pedidos',        icon: <Icon name="orders"   /> },
  { to: '/report',    label: 'Reporte',        icon: <Icon name="chart"    /> },
  { to: '/expenses',  label: 'Gastos',         icon: <Icon name="receipt"  /> },
  { to: '/customers', label: 'Clientes',       icon: <Icon name="users"    /> },
  { to: '/products',  label: 'Productos',      icon: <Icon name="box"      /> },
  cashNavItem,
  { to: '/team',      label: 'Equipo',         icon: <Icon name="team"     /> },
  { to: '/branches',  label: 'Sucursales',     icon: <Icon name="building" /> },
  { to: '/settings',  label: 'Configuración',  icon: <Icon name="settings" /> },
];

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const { user, logout, currentBranchId } = useAuth();
  const { kitchenEnabled, ordersEnabled, cashEnabled, teamEnabled, branchesEnabled, rafflesEnabled } = useSettingsStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate    = useNavigate();

  const branchSelector = useBranchSelector();

  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  const buildNav = () => {
    // ownerNav indices: 0=POS, 1=Pedidos, 2=Reporte, 3=Gastos, 4=Clientes, 5=Productos, 6=Caja, 7=Equipo, 8=Sucursales, 9=Configuración
    if (user?.role !== 'OWNER') {
      return [
        ownerNav[0],
        ...(ordersEnabled ? [ownerNav[1]] : []),
        ...(cashEnabled ? [cashNavItem] : []),
        cashierReportItem,
      ];
    }
    return [
      ownerNav[0],
      ...(ordersEnabled ? [ownerNav[1]] : []),
      ownerNav[2], // Reporte
      ownerNav[3], // Gastos
      ownerNav[4], // Clientes
      ...(rafflesEnabled ? [rafflesNavItem] : []),
      ownerNav[5], // Productos
      ...(cashEnabled ? [cashNavItem] : []),
      ...(teamEnabled ? [ownerNav[7]] : []),
      ...(branchesEnabled ? [ownerNav[8]] : []),
      ownerNav[9], // Configuración
    ];
  };

  const baseNav = buildNav();
  const navItems = kitchenEnabled
    ? [baseNav[0], kitchenNavItem, ...baseNav.slice(1)]
    : baseNav;

  const userInitial = (user?.name ?? '?')[0].toUpperCase();

  if (collapsed) {
    return (
      <aside
        data-print-hide
        className="hidden lg:flex lg:flex-col w-16 h-screen fixed left-0 top-0 border-r border-[var(--border-subtle)] bg-[var(--color-surface-sidebar)] transition-all duration-200 z-30"
      >
        {/* Logo only */}
        <div className="flex items-center justify-center py-4 border-b border-[var(--border-subtle)]">
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center shadow-[0_2px_8px_oklch(0.60_0.22_42/0.45)]">
            <Icon name="cart" size={16} strokeWidth={2} className="text-white" />
          </div>
        </div>

        {/* Icons only nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={item.label}
              className={({ isActive }) =>
                [
                  'relative flex items-center justify-center p-2.5 rounded-xl transition-all duration-150',
                  isActive
                    ? 'text-primary-500 bg-[var(--color-surface-3)] border border-[var(--border-subtle)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-2)]',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary-500 rounded-full" />
                  )}
                  {item.icon}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User avatar only */}
        <div className="px-2 py-3 border-t border-[var(--border-subtle)] flex justify-center">
          <button
            title={user?.name}
            onClick={() => navigate('/account')}
            className="w-8 h-8 rounded-full bg-[var(--color-surface-3)] flex items-center justify-center hover:bg-[var(--color-surface-card-hover)] border border-[var(--border-subtle)] transition-colors"
          >
            <span className="text-xs font-bold text-[var(--color-text-main)]">{userInitial}</span>
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      data-print-hide
      className="hidden lg:flex lg:flex-col w-60 h-screen fixed left-0 top-0 border-r border-[var(--border-subtle)] bg-[var(--color-surface-sidebar)] transition-all duration-200 z-30"
    >
      {/* Brand header */}
      <div className="px-4 pt-5 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center shrink-0 shadow-[0_2px_8px_oklch(0.60_0.22_42/0.45)]">
            <Icon name="cart" size={16} strokeWidth={2} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-[var(--color-text-main)] truncate font-heading">
              {user?.tenantName || 'Mi Negocio'}
            </h1>
            <p className="text-xs text-[var(--color-text-soft)] truncate">{user?.name}</p>
          </div>
        </div>

        {user?.role === 'OWNER' && (
          <div className="relative">
            <BranchSelector
              branches={branchSelector.branches}
              currentBranch={branchSelector.currentBranch}
              currentBranchId={currentBranchId}
              isOpen={branchSelector.isOpen}
              canSelect={branchSelector.canSelect}
              onToggle={branchSelector.toggle}
              onSelect={branchSelector.select}
            />
          </div>
        )}

        {user?.role === 'CASHIER' && user.branchId && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-500/10 border border-primary-500/20 text-xs text-primary-600 dark:text-primary-400">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse-dot shrink-0" />
            <span className="truncate font-semibold">Sucursal asignada</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'text-[var(--color-text-main)] bg-[var(--color-surface-3)] border border-[var(--border-subtle)] shadow-sm'
                  : 'text-[var(--color-text-soft)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-2)]',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary-500 rounded-full" />
                )}
                <span className={isActive ? 'text-primary-500' : 'text-[var(--color-text-muted)]'}>
                  {item.icon}
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User menu */}
      <div className="px-3 py-3 border-t border-[var(--border-subtle)]">
        <div ref={userMenuRef} className="relative">
          {userMenuOpen && (
            <div
              className="absolute bottom-full left-0 right-0 mb-2 rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--color-surface-card)] shadow-card-xl animate-slide-down"
            >
              <button
                onClick={() => { setUserMenuOpen(false); navigate('/account'); }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-[var(--color-text-soft)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <Icon name="user-circle" size={16} className="shrink-0" />
                Mi cuenta
              </button>
              <div className="h-px bg-[var(--border-subtle)] mx-3" />
              <button
                onClick={() => { setUserMenuOpen(false); logout(); }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors"
              >
                <Icon name="logout" size={16} className="shrink-0" />
                Cerrar Sesión
              </button>
            </div>
          )}

          <button
            onClick={() => setUserMenuOpen((o) => !o)}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[var(--color-surface-3)] border border-[var(--border-strong)] flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-[var(--color-text-main)]">{userInitial}</span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-medium text-[var(--color-text-main)] truncate leading-tight">{user?.name}</p>
              <p className="text-[10px] text-[var(--color-text-soft)] truncate leading-tight">{user?.email}</p>
            </div>
            <Icon
              name="chevron-down"
              size={14}
              strokeWidth={2}
              className={`text-[var(--color-text-muted)] shrink-0 transition-transform duration-150 ${userMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>
    </aside>
  );
}
