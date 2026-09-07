import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useState, type ReactNode } from 'react';
import { APP_WEB_NAME, MESSAGES, displayName, resolveProfilePhotoUrl } from '@nexora/shared';
import { useAuth } from '../context/auth-context.ts';
import { useToast } from '../context/ToastProvider.tsx';
import { getAssetBaseUrl } from '../services/api-url.ts';

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/records', label: 'Records' },
  { to: '/profile', label: 'Profile' },
];

const ADMIN_NAV = [
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/records', label: 'All Records' },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { showSuccess } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const isAdmin = user?.role === 'admin';
  const photoUri = useMemo(
    () =>
      user
        ? resolveProfilePhotoUrl(
            {
              photoURL: user.photoURL,
              avatarId: user.avatarId,
              photoManual: user.photoManual,
            },
            getAssetBaseUrl(),
          )
        : null,
    [user],
  );

  async function handleLogout() {
    await logout();
    showSuccess(MESSAGES.LOGOUT_SUCCESS);
    navigate('/welcome');
  }

  return (
    <div className="app-shell">
      <div className={`drawer-backdrop ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <NavLink to="/dashboard" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">C</span>
          <span>
            <strong>CRUD</strong>
            <span>{APP_WEB_NAME}</span>
          </span>
        </NavLink>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setOpen(false)}
          >
            {item.label}
          </NavLink>
        ))}
        {isAdmin ? (
          <>
            <div className="nav-section">Admin</div>
            {ADMIN_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </>
        ) : null}
        <div className="sidebar-spacer" />
        <button type="button" className="nav-link" onClick={handleLogout}>
          Logout
        </button>
      </aside>
      <div className="main">
        <header className="header">
          <button type="button" className="btn menu-btn" onClick={() => setOpen(true)}>
            Menu
          </button>
          <div>
            <div className="muted">{location.pathname}</div>
          </div>
          <div className="user-chip">
            <div className="avatar">
              {photoUri ? <img src={photoUri} alt="" /> : user?.firstName?.charAt(0)}
            </div>
            <div>
              <strong>{user ? displayName(user) : ''}</strong>
              <div className="muted">{user?.role}</div>
            </div>
          </div>
        </header>
        <div className="page">{children}</div>
      </div>
    </div>
  );
}
