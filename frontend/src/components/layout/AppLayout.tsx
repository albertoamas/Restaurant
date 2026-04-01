import { Outlet, NavLink } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../../context/auth.context';
import { useSettingsStore } from '../../store/settings.store';

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
};

export function AppLayout() {
  const { user, logout } = useAuth();
  const { kitchenEnabled, ordersEnabled, cashEnabled, branchesEnabled, teamEnabled } = useSettingsStore();

  const isOwner = user?.role === 'OWNER';

  // Build mobile nav respecting role + module settings
  const mobileNav = [
    { to: '/pos',      label: 'POS',        icon: Icons.pos,      show: true },
    { to: '/orders',   label: 'Pedidos',    icon: Icons.orders,   show: ordersEnabled },
    { to: '/cash',     label: 'Caja',       icon: Icons.cash,     show: cashEnabled },
    { to: '/kitchen',  label: 'Cocina',     icon: Icons.kitchen,  show: kitchenEnabled },
    { to: '/report',   label: 'Reporte',    icon: Icons.report,   show: isOwner },
    { to: '/expenses',  label: 'Gastos',    icon: Icons.expenses,  show: isOwner },
    { to: '/customers', label: 'Clientes',  icon: Icons.customers, show: isOwner },
    { to: '/products',  label: 'Productos', icon: Icons.products,  show: isOwner },
    { to: '/settings', label: 'Ajustes',    icon: Icons.settings, show: isOwner || (!isOwner && (branchesEnabled || teamEnabled)) },
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

      <div className="lg:ml-60 flex flex-col min-h-screen pb-16 lg:pb-0">
        <Header />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/92 backdrop-blur-xl border-t border-gray-200/80 z-40 flex overflow-x-auto scrollbar-hide"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {mobileNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center h-16 gap-0.5 transition-colors relative shrink-0 px-1
              ${mobileNav.length <= 5 ? 'flex-1' : 'min-w-[64px]'}
              ${isActive ? 'text-primary-600' : 'text-gray-400'}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute inset-x-1.5 inset-y-1.5 rounded-xl bg-primary-50" />
                )}
                <span className="relative z-10">{item.icon}</span>
                <span className={`relative z-10 text-[10px] font-medium leading-none ${isActive ? 'font-semibold text-primary-700' : ''}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
