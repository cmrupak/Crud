import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  DEFAULT_PAGE_SIZE,
  MESSAGES,
  displayName,
  formatDate,
  formatDateTime,
  getErrorMessage,
  validateProfile,
  type AccountStatus,
  type PaginatedResult,
  type UserProfile,
  type UserRole,
} from '@nexora/shared';
import { Button, FormError, Input, Select } from '../components/form/Fields.tsx';
import { useBackend } from '../context/backend-context.ts';
import { useConfirm } from '../context/ConfirmProvider.tsx';
import { useToast } from '../context/ToastProvider.tsx';
import { useAuth } from '../context/auth-context.ts';

export function AdminUsersPage() {
  const backend = useBackend();
  const { confirm } = useConfirm();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | AccountStatus>('all');
  const [role, setRole] = useState<'all' | UserRole>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PaginatedResult<UserProfile> | null>(null);

  const query = useMemo(
    () => ({ search, status, role, page, pageSize: DEFAULT_PAGE_SIZE }),
    [page, role, search, status],
  );

  async function load() {
    setLoading(true);
    setError('');
    try {
      setResult(await backend.admin.listUsers(query));
    } catch (err) {
      setError(getErrorMessage(err) || MESSAGES.LOAD_USERS_ERROR);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function toggleStatus(user: UserProfile) {
    if (user.status === 'active') {
      const ok = await confirm({
        title: 'Deactivate User',
        message: `Are you sure you want to deactivate ${displayName(user)}? The user will no longer be able to access the application.`,
        confirmLabel: 'Deactivate',
        danger: true,
      });
      if (!ok) return;
      try {
        await backend.admin.deactivateUser(user.uid);
        showSuccess(MESSAGES.USER_DEACTIVATED);
        await load();
      } catch (err) {
        showError(getErrorMessage(err));
      }
      return;
    }
    try {
      await backend.admin.activateUser(user.uid);
      showSuccess(MESSAGES.USER_ACTIVATED);
      await load();
    } catch (err) {
      showError(getErrorMessage(err));
    }
  }

  return (
    <section>
      <h1 className="page-title">Users</h1>
      <p className="page-sub">Search, filter, activate, and assign roles.</p>
      <div className="toolbar">
        <input
          placeholder="Search name or email"
          value={search}
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
          style={{ minWidth: 220, padding: '10px 12px', borderRadius: 11, border: '1px solid var(--line)' }}
        />
        <Select label="Status" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as 'all' | AccountStatus); }}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
        <Select label="Role" value={role} onChange={(event) => { setPage(1); setRole(event.target.value as 'all' | UserRole); }}>
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </Select>
      </div>
      <div className="card">
        {loading ? <div className="loading-state">Loading users...</div> : null}
        {error ? <div className="error-state">{error}</div> : null}
        {!loading && result && result.items.length === 0 ? <div className="empty">No users found.</div> : null}
        {result && result.items.length > 0 ? (
          <>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created date</th>
                    <th>Last login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((item) => (
                    <tr key={item.uid}>
                      <td>{displayName(item)}</td>
                      <td>{item.email}</td>
                      <td>
                        <span className={`badge ${item.role}`}>{item.role}</span>
                      </td>
                      <td>
                        <span className={`badge ${item.status}`}>{item.status}</span>
                      </td>
                      <td>{formatDate(item.createdAt)}</td>
                      <td>{formatDateTime(item.lastLoginAt)}</td>
                      <td>
                        <div className="row-actions">
                          <button type="button" className="btn btn-sm btn-secondary" onClick={() => navigate(`/admin/users/${item.uid}`)}>
                            View
                          </button>
                          <button type="button" className="btn btn-sm btn-secondary" onClick={() => navigate(`/admin/users/${item.uid}?edit=1`)}>
                            Edit
                          </button>
                          <button type="button" className="btn btn-sm btn-danger" onClick={() => void toggleStatus(item)}>
                            {item.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pager">
              <span>
                Page {result.page} of {result.totalPages}
              </span>
              <div className="row-actions">
                <button type="button" className="btn btn-sm btn-secondary" disabled={result.page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  disabled={result.page >= result.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

export function AdminUserDetailPage() {
  const { id } = useParams();
  const backend = useBackend();
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!id) return;
    let active = true;
    backend.admin
      .getUser(id)
      .then((profile) => {
        if (!active) return;
        setUser(profile);
        setFirstName(profile.firstName);
        setLastName(profile.lastName);
        setRole(profile.role);
      })
      .catch((err: unknown) => {
        if (active) setError(getErrorMessage(err));
      });
    return () => {
      active = false;
    };
  }, [backend, id]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    const validation = validateProfile({ firstName, lastName });
    setErrors(validation.errors);
    if (!validation.valid) return;
    setSaving(true);
    try {
      const updated = await backend.admin.updateUser(user.uid, { firstName, lastName, role });
      setUser(updated);
      showSuccess(MESSAGES.USER_UPDATED);
    } catch (err) {
      setFormError(getErrorMessage(err));
      showError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (error) return <div className="error-state">{error}</div>;
  if (!user) return <div className="loading-state">Loading user...</div>;

  return (
    <section>
      <h1 className="page-title">{displayName(user)}</h1>
      <p className="page-sub">{user.email}</p>
      <div className="card card-pad" style={{ marginTop: 20, maxWidth: 680 }}>
        <form onSubmit={onSubmit}>
          <Input
            label="First name"
            name="firstName"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            error={errors.firstName}
          />
          <Input
            label="Last name"
            name="lastName"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            error={errors.lastName}
          />
          <Select
            label="Role"
            name="role"
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole)}
            disabled={currentUser?.uid === user.uid}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </Select>
          <FormError message={formError} />
          <div className="row-actions">
            <Button type="submit" loading={saving}>
              {saving ? 'Updating...' : 'Save user'}
            </Button>
            <Link className="btn btn-secondary" to="/admin/users">
              Back
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
