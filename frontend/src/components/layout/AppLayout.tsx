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
  const [sidebarCollapsed, setSidebarCollapsed]     = useState(() => localStorage.getItem('pos_sidebar') === '1');

  const toggleSidebar = () => setSidebarCollapsed((c) => {
    localStorage.setItem('pos_sidebar', c ? '0' : '1');
    return !c;
  });
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
        <div className="rounded-2xl border border-[var(--border-subtle)] p-8 max-w-sm w-full text-center animate-in shadow-card-xl bg-[var(--color-surface-card)]">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Icon name="warning" size={28} className="text-amber-500" />
          </div>
          <h2 className="text-base font-bold text-[var(--color-text-main)] mb-2 font-heading">Sin sucursal asignada</h2>
          <p className="text-sm text-[var(--color-text-soft)] mb-6">
            Tu cuenta no tiene una sucursal asignada. Comunícate con el administrador para que te asigne una.
          </p>
          <button
            onClick={logout}
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] underline transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar collapsed={sidebarCollapsed} />

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          data-print-hide
          className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        data-print-hide
        className={`lg:hidden fixed top-0 left-0 h-full w-72 z-50 flex flex-col bg-[var(--color-surface-sidebar)] border-r border-[var(--border-subtle)] transition-transform duration-300 ease-in-out ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="px-4 pt-5 pb-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center shrink-0 shadow-md shadow-primary-500/20">
              <Icon name="cart" size={16} strokeWidth={2} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-[var(--color-text-main)] truncate font-heading">
                {user?.tenantName || 'Mi Negocio'}
              </h1>
              <p className="text-xs text-[var(--color-text-soft)] truncate">{user?.name}</p>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-2)] transition-colors"
            aria-label="Cerrar menú"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Branch selector for OWNER */}
        {isOwner && (
          <div className="px-4 pt-3 pb-3 border-b border-[var(--border-subtle)] relative">
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
          <div className="px-4 pt-3 pb-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-500/10 border border-primary-500/20 text-xs text-primary-600 dark:text-primary-400">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse-dot shrink-0" />
              <span className="truncate font-semibold">Sucursal asignada</span>
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

        {/* Drawer footer — user dropdown */}
        <div className="px-3 py-3 border-t border-[var(--border-subtle)]">
          <div ref={drawerUserMenuRef} className="relative">
            {/* Dropdown (opens upward) */}
            {drawerUserMenuOpen && (
              <div
                className="absolute bottom-full left-0 right-0 mb-2 rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--color-surface-card)] shadow-card-xl animate-slide-down"
              >
                <button
                  onClick={() => { setDrawerUserMenuOpen(false); setDrawerOpen(false); navigate('/account'); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-[var(--color-text-soft)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <Icon name="user-circle" size={16} className="shrink-0" />
                  Mi cuenta
                </button>
                <div className="h-px bg-[var(--border-subtle)] mx-3" />
                <button
                  onClick={() => { setDrawerUserMenuOpen(false); setDrawerOpen(false); logout(); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                >
                  <Icon name="logout" size={16} className="shrink-0" />
                  Cerrar Sesión
                </button>
              </div>
            )}

            {/* Trigger */}
            <button
              onClick={() => setDrawerUserMenuOpen((o) => !o)}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[var(--color-surface-3)] border border-[var(--border-strong)] flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-[var(--color-text-main)]">{(user?.name ?? '?')[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium text-[var(--color-text-main)] truncate leading-tight">{user?.name}</p>
                <p className="text-[10px] text-[var(--color-text-soft)] truncate leading-tight">{user?.email}</p>
              </div>
              <Icon
                name="chevron-down"
                size={14}
                strokeWidth={2}
                className={`text-[var(--color-text-muted)] shrink-0 transition-transform duration-150 ${drawerUserMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      <div data-print-main className={`${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'} flex flex-col flex-1 min-w-0 min-h-screen transition-[margin] duration-200`}>
        <Header
          onMenuOpen={() => setDrawerOpen(true)}
          onToggleSidebar={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className="flex-1 overflow-auto bg-[var(--color-surface-page)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
