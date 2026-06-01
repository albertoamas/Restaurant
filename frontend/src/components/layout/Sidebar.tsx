import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth.context';
import { useSettingsStore } from '../../store/settings.store';
import { useBranchSelector } from '../../hooks/useBranchSelector';
import { BranchSelector } from './BranchSelector';
import { Icon } from '../ui/Icon';

const cashNavItem    = { to: '/cash',     label: 'Caja',          icon: <Icon name="cash"     /> };
const rafflesNavItem = { to: '/raffles',  label: 'Sorteos',       icon: <Icon name="ticket"   /> };
const kitchenNavItem = { to: '/kitchen', label: 'Cocina',        icon: <Icon name="flame"    /> };

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

export function Sidebar() {
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

  return (
    <aside
      data-print-hide
      className="hidden lg:flex lg:flex-col w-60 h-screen fixed left-0 top-0 border-r border-white/5"
      style={{
        background: 'linear-gradient(165deg, oklch(0.16 0.028 40) 0%, oklch(0.10 0.014 38) 100%)',
      }}
    >
      {/* Brand header */}
      <div className="px-4 pt-5 pb-4 border-b border-white/8">
        <div className="flex items-center gap-3 mb-3">
          {/* Logo mark */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0 shadow-[0_2px_8px_oklch(0.60_0.22_42/0.45)]">
            <Icon name="cart" size={16} strokeWidth={2} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white truncate font-heading">
              {user?.tenantName || 'Mi Negocio'}
            </h1>
            <p className="text-xs text-white/40 truncate">{user?.name}</p>
          </div>
        </div>

        {/* Branch selector for OWNER */}
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

        {/* Fixed branch for CASHIER */}
        {user?.role === 'CASHIER' && user.branchId && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-500/12 border border-primary-500/20 text-xs text-primary-300">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse-dot shrink-0" />
            <span className="truncate">Sucursal asignada</span>
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
                  ? 'text-white bg-white/10 border border-white/8 shadow-[inset_0_1px_0_oklch(1_0_0/0.06)]'
                  : 'text-white/45 hover:text-white/80 hover:bg-white/5',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary-400 rounded-full" />
                )}
                <span className={isActive ? 'text-primary-400' : 'text-white/35'}>
                  {item.icon}
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User menu */}
      <div className="px-3 py-3 border-t border-white/8">
        <div ref={userMenuRef} className="relative">
          {/* Dropdown — opens upward */}
          {userMenuOpen && (
            <div
              className="absolute bottom-full left-0 right-0 mb-2 rounded-xl overflow-hidden border border-white/8 shadow-[0_-8px_24px_oklch(0.08_0.010_255/0.8)] animate-slide-down"
              style={{ background: 'oklch(0.18 0.022 40)' }}
            >
              <button
                onClick={() => { setUserMenuOpen(false); navigate('/account'); }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-white/65 hover:text-white/90 hover:bg-white/8 transition-colors"
              >
                <Icon name="user-circle" size={16} className="shrink-0" />
                Mi cuenta
              </button>
              <div className="h-px bg-white/6 mx-3" />
              <button
                onClick={() => { setUserMenuOpen(false); logout(); }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-white/45 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Icon name="logout" size={16} className="shrink-0" />
                Cerrar Sesión
              </button>
            </div>
          )}

          {/* Trigger button */}
          <button
            onClick={() => setUserMenuOpen((o) => !o)}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-white/6 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white/70">{userInitial}</span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-medium text-white/75 truncate leading-tight">{user?.name}</p>
              <p className="text-[10px] text-white/40 truncate leading-tight">{user?.email}</p>
            </div>
            <Icon
              name="chevron-down"
              size={14}
              strokeWidth={2}
              className={`text-white/30 shrink-0 transition-transform duration-150 ${userMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>
    </aside>
  );
}
