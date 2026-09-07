import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  MESSAGES,
  formatDateTime,
  getErrorMessage,
  validateRecord,
  type RecordInput,
  type RecordItem,
} from '@nexora/shared';
import { Button, FormError, Input, Select, Textarea } from '../components/form/Fields.tsx';
import { useBackend } from '../context/backend-context.ts';
import { useToast } from '../context/ToastProvider.tsx';

const EMPTY: RecordInput = { title: '', description: '', status: 'active' };

export function RecordFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const backend = useBackend();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState<RecordInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    let active = true;
    backend.records
      .getById(id)
      .then((record) => {
        if (!active) return;
        setForm({
          title: record.title,
          description: record.description,
          status: record.status,
        });
      })
      .catch((error: unknown) => {
        if (active) setFormError(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [backend, id, mode]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const validation = validateRecord(form);
    setErrors(validation.errors);
    if (!validation.valid) return;
    setSaving(true);
    try {
      if (mode === 'create') {
        const created = await backend.records.create(form);
        showSuccess(MESSAGES.RECORD_CREATED);
        navigate(`/records/${created.id}`);
      } else if (id) {
        await backend.records.update(id, form);
        showSuccess(MESSAGES.RECORD_UPDATED);
        navigate(`/records/${id}`);
      }
    } catch (error) {
      const message = getErrorMessage(error);
      setFormError(message);
      showError(MESSAGES.SAVE_RECORD_ERROR);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading-state">Loading record...</div>;

  return (
    <section>
      <h1 className="page-title">{mode === 'create' ? 'Create record' : 'Edit record'}</h1>
      <div className="card card-pad" style={{ maxWidth: 720, marginTop: 20 }}>
        <form onSubmit={onSubmit} noValidate>
          <Input
            label="Title"
            name="title"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            error={errors.title}
          />
          <Textarea
            label="Description"
            name="description"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            error={errors.description}
          />
          <Select
            label="Status"
            name="status"
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({ ...current, status: event.target.value as RecordInput['status'] }))
            }
            error={errors.status}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <FormError message={formError} />
          <div className="row-actions">
            <Button type="submit" loading={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Link className="btn btn-secondary" to="/records">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}

export function RecordDetailPage() {
  const { id } = useParams();
  const backend = useBackend();
  const [record, setRecord] = useState<RecordItem | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let active = true;
    backend.records
      .getById(id)
      .then((item) => {
        if (active) setRecord(item);
      })
      .catch((err: unknown) => {
        if (active) setError(getErrorMessage(err));
      });
    return () => {
      active = false;
    };
  }, [backend, id]);

  if (error) return <div className="error-state">{error}</div>;
  if (!record) return <div className="loading-state">Loading record...</div>;

  return (
    <section>
      <h1 className="page-title">{record.title}</h1>
      <p className="page-sub">Created {formatDateTime(record.createdAt)}</p>
      <div className="card card-pad" style={{ marginTop: 20, maxWidth: 760 }}>
        <p>
          <span className={`badge ${record.status}`}>{record.status}</span>
        </p>
        <p style={{ marginTop: 16, whiteSpace: 'pre-wrap' }}>{record.description}</p>
        <p className="muted" style={{ marginTop: 16 }}>
          Updated {formatDateTime(record.updatedAt)}
        </p>
        <div className="toolbar">
          <Link className="btn btn-primary" to={`/records/${record.id}/edit`}>
            Edit
          </Link>
          <Link className="btn btn-secondary" to="/records">
            Back
          </Link>
        </div>
      </div>
    </section>
  );
}
