import { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { NavBrand, NavList, UserMenu } from './NavParts';
import { useAuth } from '../../context/auth.context';
import { useSocketEvent } from '../../context/socket.context';
import { useCashSessionStore } from '../../store/cashSession.store';
import { useCartStore } from '../../store/cart.store';
import { cashSessionApi } from '../../api/cash-session.api';
import type { CashSessionDto } from '@pos/shared';
import { SOCKET_EVENTS } from '@pos/shared';


export function AppLayout() {
  const { user, logout, refreshUser, currentBranchId } = useAuth();
  const [drawerOpen, setDrawerOpen]             = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('pos_sidebar') === '1');
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Menú móvil abierto: el foco entra al menú, Escape lo cierra desde cualquier lugar y al
  // cerrarse el foco vuelve al botón que lo abrió.
  useEffect(() => {
    if (!drawerOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    drawerRef.current?.querySelector<HTMLElement>('button, a[href]')?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); opener?.focus?.(); };
  }, [drawerOpen]);

  const toggleSidebar = () => setSidebarCollapsed((c) => {
    localStorage.setItem('pos_sidebar', c ? '0' : '1');
    return !c;
  });
  const clearCart = useCartStore((s) => s.clear);
  const prevBranchRef = useRef<string | null>(null);

  // Clear cart when OWNER switches branches — items from branch A must not carry to branch B
  useEffect(() => {
    if (prevBranchRef.current !== null && prevBranchRef.current !== currentBranchId) {
      clearCart();
    }
    prevBranchRef.current = currentBranchId;
  }, [currentBranchId, clearCart]);

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
  // El dueño cambió mi sucursal: sin recargar, el POS pasa a la nueva o al aviso de sin sucursal.
  useSocketEvent<void>(SOCKET_EVENTS.USER_SESSION_UPDATED, handleModulesUpdated);


  if (user?.role === 'CASHIER' && !user.branchId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-card border border-line bg-surface-card p-8 text-center shadow-raised animate-in">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-card bg-amber-500/10 text-amber-700 dark:text-amber-300">
            <Icon name="warning" size={24} />
          </span>
          <h2 className="mt-4 font-heading text-heading font-bold text-main">Sin sucursal asignada</h2>
          <p className="mt-1 text-body text-soft">
            Tu cuenta todavía no tiene sucursal. Pídele al dueño del negocio que te asigne una desde Equipo.
          </p>
          <Button variant="secondary" fullWidth className="mt-6" onClick={logout}>
            Cerrar sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      {/* Menú móvil: mismas piezas que el Sidebar (NavParts) para que muestren lo mismo. */}
      {drawerOpen && (
        <div
          data-print-hide
          className="lg:hidden fixed inset-0 bg-surface-overlay/50 z-40 backdrop-blur-sm animate-fade"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}
      <div
        data-print-hide
        role="dialog"
        aria-modal={drawerOpen || undefined}
        aria-label="Menú"
        // Cerrado queda fuera de pantalla: `inert` evita que sus enlaces reciban foco con Tab.
        inert={!drawerOpen}
        ref={drawerRef}
        className={`lg:hidden fixed top-0 left-0 h-full w-72 max-w-[85vw] z-50 flex flex-col bg-surface-sidebar border-r border-line shadow-overlay transition-transform duration-300 ease-out ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavBrand
          trailing={
            <button
              onClick={closeDrawer}
              aria-label="Cerrar menú"
              className="w-10 h-10 -mr-2 shrink-0 flex items-center justify-center rounded-full text-muted hover:text-main hover:bg-surface-2 transition-colors"
            >
              <Icon name="x" size={20} />
            </button>
          }
        />
        <NavList onNavigate={closeDrawer} />
        <UserMenu onNavigate={closeDrawer} />
      </div>

      <div data-print-main className={`${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'} flex flex-col flex-1 min-w-0 min-h-screen transition-[margin] duration-200`}>
        <Header onMenuOpen={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-auto bg-surface-page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
