import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/auth.context';

export function OwnerRoute() {
  const { user } = useAuth();
  if (user?.role !== 'OWNER') return <Navigate to="/pos" replace />;
  return <Outlet />;
}
