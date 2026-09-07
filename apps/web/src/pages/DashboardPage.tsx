import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getErrorMessage, type DashboardStats } from '@nexora/shared';
import { useAuth } from '../context/auth-context.ts';
import { useBackend } from '../context/backend-context.ts';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="card stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </article>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const backend = useBackend();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    backend.stats
      .getDashboardStats()
      .then((result) => {
        if (active) setStats(result);
      })
      .catch((err: unknown) => {
        if (active) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [backend]);

  return (
    <section>
      <h1 className="page-title">Welcome, {user?.firstName}</h1>
      <p className="page-sub">
        {user?.role === 'admin'
          ? 'You have administrator access to users and all records.'
          : 'Create and manage your records from one dashboard.'}
      </p>
      {loading ? (
        <div className="stats-grid">
          <div className="card card-pad">
            <div className="skeleton" />
          </div>
          <div className="card card-pad">
            <div className="skeleton" />
          </div>
          <div className="card card-pad">
            <div className="skeleton" />
          </div>
        </div>
      ) : null}
      {error ? <div className="error-state">{error}</div> : null}
      {stats ? (
        <div className="stats-grid">
          <StatCard label="Total records" value={stats.totalRecords} />
          <StatCard label="Active records" value={stats.activeRecords} />
          <StatCard label="Inactive records" value={stats.inactiveRecords} />
          {user?.role === 'admin' ? (
            <>
              <StatCard label="Total users" value={stats.totalUsers ?? 0} />
              <StatCard label="Active users" value={stats.activeUsers ?? 0} />
              <StatCard label="Inactive users" value={stats.inactiveUsers ?? 0} />
            </>
          ) : null}
        </div>
      ) : null}
      <div className="toolbar">
        <Link className="btn btn-primary" to="/records/create">
          Create record
        </Link>
        <Link className="btn btn-secondary" to="/records">
          View records
        </Link>
      </div>
    </section>
  );
}
