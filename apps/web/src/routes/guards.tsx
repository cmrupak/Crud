import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth-context.ts';
import { AppLayout } from '../layouts/AppLayout.tsx';

export function GuestRoute() {
  const { user, loading, deactivated } = useAuth();
  if (loading) return <div className="loading-state">Loading…</div>;
  if (deactivated) return <Navigate to="/account-deactivated" replace />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export function ProtectedRoute() {
  const { user, loading, deactivated } = useAuth();
  const location = useLocation();
  if (loading) return <div className="loading-state">Loading…</div>;
  if (deactivated) return <Navigate to="/account-deactivated" replace />;
  if (!user) return <Navigate to="/welcome" replace state={{ from: location }} />;
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

export function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-state">Loading…</div>;
  if (!user) return <Navigate to="/welcome" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
