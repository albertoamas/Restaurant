import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/auth.context';
import { SocketProvider } from './context/socket.context';
import { PrivateRoute } from './routes/PrivateRoute';
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
import { AdminPage } from './pages/AdminPage';
import { LandingPage } from './pages/LandingPage';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route element={<PrivateRoute />}>
            {/* Kitchen panel: fullscreen, no sidebar */}
            <Route path="/kitchen" element={<KitchenPage />} />

            <Route element={<AppLayout />}>
              <Route path="/pos" element={<PosPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/cash" element={<CashPage />} />
              <Route element={<OwnerRoute />}>
                <Route path="/report" element={<ReportPage />} />
                <Route path="/expenses" element={<ExpensesPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/branches" element={<BranchesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SocketProvider>
    </AuthProvider>
  );
}
