import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/auth.context';
import { SocketProvider } from './context/socket.context';
import { PrivateRoute } from './routes/PrivateRoute';
import { useSettingsStore } from './store/settings.store';
import { LoginPage } from './pages/LoginPage';
import { PosPage } from './pages/PosPage';
import { OrdersPage } from './pages/OrdersPage';
import { ReportPage } from './pages/ReportPage';
import { ProductsPage } from './pages/ProductsPage';
import { SettingsPage } from './pages/SettingsPage';
import { TeamPage } from './pages/TeamPage';
import { KitchenPage } from './pages/KitchenPage';
import { CashPage } from './pages/CashPage';
import { AppLayout } from './components/layout/AppLayout';
import { OwnerRoute } from './routes/OwnerRoute';
import { BranchesPage } from './pages/BranchesPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { CustomersPage } from './pages/CustomersPage';
import { RafflesPage } from './pages/RafflesPage';
import { RaffleDetailPage } from './pages/RaffleDetailPage';
import { AdminPage } from './pages/AdminPage';
import { LandingPage } from './pages/LandingPage';

/**
 * Guards a route behind a module flag.
 * When the module is disabled by the SaaS admin, any attempt to access
 * the route directly (via URL) redirects to /pos.
 */
function ModuleRoute({ enabled, element }: { enabled: boolean; element: React.ReactElement }) {
  return enabled ? element : <Navigate to="/pos" replace />;
}

function AppRoutes() {
  const { ordersEnabled, cashEnabled, teamEnabled, branchesEnabled, kitchenEnabled, rafflesEnabled } =
    useSettingsStore();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminPage />} />

      <Route element={<PrivateRoute />}>
        {/* Kitchen: fullscreen, no sidebar */}
        <Route
          path="/kitchen"
          element={<ModuleRoute enabled={kitchenEnabled} element={<KitchenPage />} />}
        />

        <Route element={<AppLayout />}>
          <Route path="/pos" element={<PosPage />} />

          <Route
            path="/orders"
            element={<ModuleRoute enabled={ordersEnabled} element={<OrdersPage />} />}
          />
          <Route
            path="/cash"
            element={<ModuleRoute enabled={cashEnabled} element={<CashPage />} />}
          />

          <Route element={<OwnerRoute />}>
            <Route path="/report"    element={<ReportPage />} />
            <Route path="/expenses"  element={<ExpensesPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route
              path="/raffles"
              element={<ModuleRoute enabled={rafflesEnabled} element={<RafflesPage />} />}
            />
            <Route
              path="/raffles/:id"
              element={<ModuleRoute enabled={rafflesEnabled} element={<RaffleDetailPage />} />}
            />
            <Route path="/products"  element={<ProductsPage />} />
            <Route path="/settings"  element={<SettingsPage />} />

            <Route
              path="/team"
              element={<ModuleRoute enabled={teamEnabled} element={<TeamPage />} />}
            />
            <Route
              path="/branches"
              element={<ModuleRoute enabled={branchesEnabled} element={<BranchesPage />} />}
            />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppRoutes />
      </SocketProvider>
    </AuthProvider>
  );
}
