import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/auth.context';
import { PrivateRoute } from './routes/PrivateRoute';
import { LoginPage } from './pages/LoginPage';
import { PosPage } from './pages/PosPage';
import { OrdersPage } from './pages/OrdersPage';
import { ReportPage } from './pages/ReportPage';
import { ProductsPage } from './pages/ProductsPage';
import { AppLayout } from './components/layout/AppLayout';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/pos" replace />} />
            <Route path="/pos" element={<PosPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/products" element={<ProductsPage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
