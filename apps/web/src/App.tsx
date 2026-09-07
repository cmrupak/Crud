import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminRoute, GuestRoute, ProtectedRoute } from './routes/guards.tsx';
import { useAuth } from './context/auth-context.ts';
import { WelcomePage } from './pages/WelcomePage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { ExistingUserPage } from './pages/ExistingUserPage.tsx';
import { AccountDeactivatedPage } from './pages/PasswordPages.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { RecordsPage } from './pages/RecordsPage.tsx';
import { RecordDetailPage, RecordFormPage } from './pages/RecordFormPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { AdminUserDetailPage, AdminUsersPage } from './pages/AdminUsersPage.tsx';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-state">Loading…</div>;
  return <Navigate to={user ? '/dashboard' : '/welcome'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/get-started" element={<Navigate to="/welcome" replace />} />
        <Route path="/login" element={<ExistingUserPage />} />
        <Route path="/continue" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route path="/account-deactivated" element={<AccountDeactivatedPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/records/create" element={<RecordFormPage mode="create" />} />
        <Route path="/records/:id" element={<RecordDetailPage />} />
        <Route path="/records/:id/edit" element={<RecordFormPage mode="edit" />} />
        <Route element={<AdminRoute />}>
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
          <Route path="/admin/records" element={<RecordsPage adminView />} />
        </Route>
      </Route>
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
