import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/auth.context';
import { Spinner } from '../components/ui/Spinner';

export function PrivateRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-page">
        <Spinner size="md" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
