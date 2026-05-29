import { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BranchSelector } from './BranchSelector';
import { Header } from './Header';
import { Icon } from '../ui/Icon';
import { useAuth } from '../../context/auth.context';
import { useSettingsStore } from '../../store/settings.store';
import { useSocketEvent } from '../../context/socket.context';
import { useCashSessionStore } from '../../store/cashSession.store';
import { useCartStore } from '../../store/cart.store';
import { useBranchSelector } from '../../hooks/useBranchSelector';
import { cashSessionApi } from '../../api/cash-session.api';
import type { CashSessionDto } from '@pos/shared';
import { SOCKET_EVENTS } from '@pos/shared';

const Icons = {
  pos:       <Icon name="cart"     size={20} />,
  orders:    <Icon name="orders"   size={20} />,
  cash:      <Icon name="cash"     size={20} />,
  kitchen:   <Icon name="flame"    size={20} />,
  report:    <Icon name="chart"    size={20} />,
  products:  <Icon name="box"      size={20} />,
  settings:  <Icon name="settings" size={20} />,
  expenses:  <Icon name="receipt"  size={20} />,
  customers: <Icon name="users"    size={20} />,
  team:      <Icon name="team"     size={20} />,
  branches:  <Icon name="building" size={20} />,
  raffles:   <Icon name="ticket"   size={20} />,
};

export function AppLayout() {
  const { user, logout, refreshUser, currentBranchId } = useAuth();
  const { kitchenEnabled, ordersEnabled, cashEnabled, branchesEnabled, teamEnabled, rafflesEnabled } = useSettingsStore();
  const [drawerOpen, setDrawerOpen]                 = useState(false);
  const [drawerUserMenuOpen, setDrawerUserMenuOpen] = useState(false);
  const drawerUserMenuRef = useRef<HTMLDivElement>(null);
  const navigate          = useNavigate();

  const isOwner   = user?.role === 'OWNER';
  const clearCart = useCartStore((s) => s.clear);
  const prevBranchRef = useRef<string | null>(null);

  const branchSelector = useBranchSelector();

  // Clear cart when OWNER switches branches — items from branch A must not carry to branch B
  useEffect(() => {
    if (prevBranchRef.current !== null && prevBranchRef.current !== currentBranchId) {
      clearCart();
    }
    prevBranchRef.current = currentBranchId;
  }, [currentBranchId, clearCart]);

  // Close drawer user-menu on outside click
  useEffect(() => {
    if (!drawerUserMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (drawerUserMenuRef.current && !drawerUserMenuRef.current.contains(e.target as Node)) {
        setDrawerUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [drawerUserMenuOpen]);

  // Sync cash session state globally so every page can read it
  const { setSession: setCashSession } = useCashSessionStore();

  useEffect(() => {
    if (!currentBranchId) return;
    cashSessionApi.getCurrent(currentBranchId)
      .then((s) => setCashSession(s))
      .catch(() => setCashSession(null));
  }, [currentBranchId, setCashSession]);

  // Only update the global store when the event belongs to the currently selected branch
  const handleCashOpened = useCallback(
    (s: CashSessionDto) => { if (s.branchId === currentBranchId) setCashSession(s); },
    [setCashSession, currentBranchId],
  );
  const handleCashClosed = useCallback(
    (s: CashSessionDto) => { if (s.branchId === currentBranchId) setCashSession(s); },
    [setCashSession, currentBranchId],
  );

  useSocketEvent<CashSessionDto>(SOCKET_EVENTS.CASH_OPENED, handleCashOpened);
  useSocketEvent<CashSessionDto>(SOCKET_EVENTS.CASH_CLOSED, handleCashClosed);

  const handleModulesUpdated = useCallback(() => { refreshUser(); }, [refreshUser]);
  useSocketEvent<void>(SOCKET_EVENTS.TENANT_MODULES_UPDATED, handleModulesUpdated);

  const mobileNav = [
    { to: '/pos',       label: 'POS',        icon: Icons.pos,       show: true },
    { to: '/orders',    label: 'Pedidos',    icon: Icons.orders,    show: ordersEnabled },
    { to: '/cash',      label: 'Caja',       icon: Icons.cash,      show: cashEnabled },
    { to: '/kitchen',   label: 'Cocina',     icon: Icons.kitchen,   show: kitchenEnabled },
    { to: '/report',    label: 'Reporte',    icon: Icons.report,    show: isOwner },
    { to: '/expenses',  label: 'Gastos',     icon: Icons.expenses,  show: isOwner },
    { to: '/customers', label: 'Clientes',   icon: Icons.customers, show: isOwner },
    { to: '/raffles',   label: 'Sorteos',    icon: Icons.raffles,   show: isOwner && rafflesEnabled },
    { to: '/products',  label: 'Productos',  icon: Icons.products,  show: isOwner },
    { to: '/team',      label: 'Equipo',     icon: Icons.team,      show: isOwner && teamEnabled },
    { to: '/branches',  label: 'Sucursales', icon: Icons.branches,  show: isOwner && branchesEnabled },
    { to: '/settings',  label: 'Ajustes',    icon: Icons.settings,  show: isOwner || (!isOwner && (branchesEnabled || teamEnabled)) },
  ].filter((i) => i.show);

  if (user?.role === 'CASHIER' && !user.branchId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-sm w-full text-center animate-in shadow-lg">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Icon name="warning" size={28} className="text-amber-400" />
          </div>
          <h2 className="text-base font-bold text-gray-900 mb-2 font-heading">Sin sucursal asignada</h2>
          <p className="text-sm text-gray-500 mb-6">
            Tu cuenta no tiene una sucursal asignada. Comunícate con el administrador para que te asigne una.
          </p>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar />

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          data-print-hide
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        data-print-hide
        className={`lg:hidden fixed top-0 left-0 h-full w-72 z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(165deg, oklch(0.28 0.14 248) 0%, oklch(0.16 0.06 260) 100%)',
        }}
      >
        {/* Drawer header */}
        <div className="px-4 pt-5 pb-4 border-b border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0 shadow-[0_2px_8px_oklch(0.50_0.24_225/0.40)]">
              <Icon name="cart" size={16} strokeWidth={2} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-white truncate font-heading">
                {user?.tenantName || 'Mi Negocio'}
              </h1>
              <p className="text-xs text-white/40 truncate">{user?.name}</p>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/8 transition-colors"
            aria-label="Cerrar menú"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Branch selector for OWNER */}
        {isOwner && (
          <div className="px-4 pt-3 pb-3 border-b border-white/8 relative">
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

        {/* Branch indicator for CASHIER */}
        {user?.role === 'CASHIER' && user.branchId && (
          <div className="px-4 pt-3 pb-3 border-b border-white/8">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-500/12 border border-primary-500/20 text-xs text-primary-300">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse-dot shrink-0" />
              <span className="truncate">Sucursal asignada</span>
            </div>
          </div>
        )}

        {/* Drawer nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {mobileNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) =>
                [
                  'relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'text-white bg-white/10 border border-white/8'
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

        {/* Drawer footer — user dropdown */}
        <div className="px-3 py-3 border-t border-white/8">
          <div ref={drawerUserMenuRef} className="relative">
            {/* Dropdown (opens upward) */}
            {drawerUserMenuOpen && (
              <div
                className="absolute bottom-full left-0 right-0 mb-2 rounded-xl overflow-hidden border border-white/8 shadow-[0_-8px_24px_oklch(0.08_0.010_255/0.8)] animate-slide-down"
                style={{ background: 'oklch(0.18 0.018 255)' }}
              >
                <button
                  onClick={() => { setDrawerUserMenuOpen(false); setDrawerOpen(false); navigate('/account'); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-white/65 hover:text-white/90 hover:bg-white/8 transition-colors"
                >
                  <Icon name="user-circle" size={16} className="shrink-0" />
                  Mi cuenta
                </button>
                <div className="h-px bg-white/6 mx-3" />
                <button
                  onClick={() => { setDrawerUserMenuOpen(false); setDrawerOpen(false); logout(); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-white/45 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Icon name="logout" size={16} className="shrink-0" />
                  Cerrar Sesión
                </button>
              </div>
            )}

            {/* Trigger */}
            <button
              onClick={() => setDrawerUserMenuOpen((o) => !o)}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-white/6 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-white/70">{(user?.name ?? '?')[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium text-white/75 truncate leading-tight">{user?.name}</p>
                <p className="text-[10px] text-white/40 truncate leading-tight">{user?.email}</p>
              </div>
              <Icon
                name="chevron-down"
                size={14}
                strokeWidth={2}
                className={`text-white/30 shrink-0 transition-transform duration-150 ${drawerUserMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      <div data-print-main className="lg:ml-60 flex flex-col min-h-screen">
        <Header onMenuOpen={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
