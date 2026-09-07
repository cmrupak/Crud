import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DEFAULT_PAGE_SIZE,
  MESSAGES,
  displayName,
  formatDate,
  formatDateTime,
  getErrorMessage,
  type PaginatedResult,
  type RecordItem,
  type RecordStatus,
} from '@nexora/shared';
import { useAuth } from '../context/auth-context.ts';
import { useBackend } from '../context/backend-context.ts';
import { useConfirm } from '../context/ConfirmProvider.tsx';
import { useToast } from '../context/ToastProvider.tsx';
import { Select } from '../components/form/Fields.tsx';

interface RecordsPageProps {
  adminView?: boolean;
}

export function RecordsPage({ adminView = false }: RecordsPageProps) {
  const backend = useBackend();
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | RecordStatus>('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PaginatedResult<RecordItem> | null>(null);

  const query = useMemo(
    () => ({ search, status, sortBy, sortDir: 'desc' as const, page, pageSize: DEFAULT_PAGE_SIZE }),
    [page, search, sortBy, status],
  );

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = adminView
        ? await backend.records.listAll(query)
        : await backend.records.listMine(query);
      setResult(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, adminView]);

  async function handleDelete(record: RecordItem) {
    const ok = await confirm({
      title: 'Delete Record',
      message: 'Are you sure you want to delete this record?',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await backend.records.softDelete(record.id);
      showSuccess(MESSAGES.RECORD_DELETED);
      await load();
    } catch (err) {
      showError(getErrorMessage(err));
    }
  }

  return (
    <section>
      <h1 className="page-title">{adminView ? 'All records' : 'Records'}</h1>
      <p className="page-sub">
        {adminView ? 'Administrator view of every workspace record.' : 'Your records, including search and filters.'}
      </p>
      <div className="toolbar">
        <input
          placeholder="Search title or description"
          value={search}
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
          style={{ minWidth: 220, padding: '10px 12px', borderRadius: 11, border: '1px solid var(--line)' }}
        />
        <Select label="Status" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as 'all' | RecordStatus); }}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
        <Select label="Sort" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
          <option value="createdAt">Created</option>
          <option value="updatedAt">Updated</option>
          <option value="title">Title</option>
        </Select>
        {!adminView ? (
          <Link className="btn btn-primary" to="/records/create">
            Create record
          </Link>
        ) : null}
      </div>
      <div className="card">
        {loading ? <div className="loading-state">Loading records...</div> : null}
        {error ? <div className="error-state">{error}</div> : null}
        {!loading && result && result.items.length === 0 ? (
          <div className="empty">No records match the current filters.</div>
        ) : null}
        {result && result.items.length > 0 ? (
          <>
            <div className="table-wrap">
              <table className="data desktop-only">
                <thead>
                  <tr>
                    <th>Title</th>
                    {adminView ? <th>Owner</th> : null}
                    <th>Description</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((record) => (
                    <tr key={record.id}>
                      <td>{record.title}</td>
                      {adminView ? <td>{record.userId === user?.uid ? displayName(user) : record.userId}</td> : null}
                      <td>{record.description.slice(0, 60)}{record.description.length > 60 ? '…' : ''}</td>
                      <td>
                        <span className={`badge ${record.status}`}>{record.status}</span>
                      </td>
                      <td>{formatDate(record.createdAt)}</td>
                      <td>{formatDateTime(record.updatedAt)}</td>
                      <td>
                        <div className="row-actions">
                          <Link className="btn btn-sm btn-secondary" to={`/records/${record.id}`}>
                            View
                          </Link>
                          <Link className="btn btn-sm btn-secondary" to={`/records/${record.id}/edit`}>
                            Edit
                          </Link>
                          <button type="button" className="btn btn-sm btn-danger" onClick={() => void handleDelete(record)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="record-grid">
              {result.items.map((record) => (
                <article key={record.id} className="card card-pad">
                  <strong>{record.title}</strong>
                  <p className="muted">{record.description}</p>
                  <p>
                    <span className={`badge ${record.status}`}>{record.status}</span>
                  </p>
                  <div className="row-actions">
                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => navigate(`/records/${record.id}`)}>
                      View
                    </button>
                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => navigate(`/records/${record.id}/edit`)}>
                      Edit
                    </button>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => void handleDelete(record)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <div className="pager">
              <span>
                Page {result.page} of {result.totalPages} · {result.total} records
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
