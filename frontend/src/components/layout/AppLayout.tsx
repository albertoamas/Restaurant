import { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../../context/auth.context';
import { useSettingsStore } from '../../store/settings.store';
import { useSocketEvent } from '../../context/socket.context';
import { useCashSessionStore } from '../../store/cashSession.store';
import { cashSessionApi } from '../../api/cash-session.api';
import { branchesApi } from '../../api/branches.api';
import type { BranchDto, CashSessionDto } from '@pos/shared';

// Icon helpers (kept inline to avoid re-importing heavy icon libs)
const Icons = {
  pos: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>,
  orders: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  cash: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  kitchen: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>,
  report: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  products: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  settings: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  expenses: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>,
  customers: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  team:      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  branches:  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  raffles:   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>,
};

export function AppLayout() {
  const { user, logout } = useAuth();
  const { kitchenEnabled, ordersEnabled, cashEnabled, branchesEnabled, teamEnabled, rafflesEnabled } = useSettingsStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [branchOpen, setBranchOpen] = useState(false);
  const { currentBranchId, setCurrentBranch } = useAuth();

  const isOwner = user?.role === 'OWNER';

  useEffect(() => {
    if (isOwner) {
      branchesApi.getAll().then((data) => {
        if (Array.isArray(data)) {
          const active = data.filter((b) => b.isActive);
          setBranches(active);
          const currentIsValid = active.some((b) => b.id === currentBranchId);
          if (active.length === 1 && !currentIsValid) {
            setCurrentBranch(active[0].id);
          }
        }
      }).catch(() => {});
    }
  }, [isOwner]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync cash session state globally so every page can read it
  const { setSession: setCashSession } = useCashSessionStore();

  useEffect(() => {
    if (!currentBranchId) return;
    cashSessionApi.getCurrent(currentBranchId)
      .then((s) => setCashSession(s))
      .catch(() => setCashSession(null));
  }, [currentBranchId, setCashSession]);

  const handleCashOpened = useCallback(
    (s: CashSessionDto) => setCashSession(s),
    [setCashSession],
  );
  const handleCashClosed = useCallback(
    (s: CashSessionDto) => setCashSession(s),
    [setCashSession],
  );

  useSocketEvent<CashSessionDto>('cash.opened', handleCashOpened);
  useSocketEvent<CashSessionDto>('cash.closed', handleCashClosed);

  const currentBranch = branches.find((b) => b.id === currentBranchId);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_oklch(0.13_0.012_260/0.10)] border border-gray-100 p-8 max-w-sm w-full text-center animate-in">
          <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
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
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-72 z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(165deg, oklch(0.36 0.16 236) 0%, oklch(0.20 0.09 252) 100%)',
        }}
      >
        {/* Drawer header */}
        <div className="px-4 pt-5 pb-4 border-b border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0 shadow-[0_2px_8px_oklch(0.50_0.24_225/0.40)]">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
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
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Branch selector for OWNER */}
        {isOwner && (
          <div className="px-4 pb-3 border-b border-white/8 relative">
            <button
              onClick={() => branches.length > 1 && setBranchOpen((o) => !o)}
              className={`w-full flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl bg-white/6 border border-white/10 text-xs text-white/65 transition-colors ${
                branches.length > 1 ? 'hover:bg-white/10 hover:text-white/90 cursor-pointer' : 'cursor-default'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <svg className="w-3 h-3 shrink-0 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">
                  {currentBranch ? currentBranch.name : (branches.length === 0 ? 'Sin sucursales' : 'Seleccionar sucursal')}
                </span>
              </div>
              {branches.length > 1 && (
                <svg className="w-3 h-3 shrink-0 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
            {branchOpen && branches.length > 1 && (
              <div className="absolute left-4 right-4 top-full mt-1 rounded-xl shadow-lg z-50 overflow-hidden border border-white/8"
                style={{ background: 'oklch(0.18 0.018 255)' }}>
                {branches.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => { setCurrentBranch(b.id); setBranchOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 text-xs hover:bg-white/8 transition-colors flex items-center gap-2 ${
                      b.id === currentBranchId ? 'text-primary-400 font-semibold' : 'text-white/65'
                    }`}
                  >
                    {b.id === currentBranchId && <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />}
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Branch indicator for CASHIER */}
        {user?.role === 'CASHIER' && user.branchId && (
          <div className="px-4 pb-3 border-b border-white/8">
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

        {/* Drawer footer */}
        <div className="px-3 py-4 border-t border-white/8">
          <div className="flex items-center gap-2.5 px-3 mb-2">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white/70">{(user?.name ?? '?')[0].toUpperCase()}</span>
            </div>
            <p className="text-xs text-white/50 truncate flex-1">{user?.email}</p>
          </div>
          <button
            onClick={() => { setDrawerOpen(false); logout(); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/35 hover:text-red-400 hover:bg-red-500/10 w-full transition-all duration-150"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="lg:ml-60 flex flex-col min-h-screen">
        <Header onMenuOpen={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
