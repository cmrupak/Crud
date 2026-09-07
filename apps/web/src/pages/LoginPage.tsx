import { useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  getErrorMessage,
  resolveProfilePhotoUrl,
  validateIdentify,
  type LoginCandidate,
} from '@nexora/shared';
import { Button, FormError, Input } from '../components/form/Fields.tsx';
import { useAuth } from '../context/auth-context.ts';
import { useToast } from '../context/ToastProvider.tsx';
import { getAssetBaseUrl } from '../services/api-url.ts';

export function LoginPage() {
  const { identify, loginByUid } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/dashboard';
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<LoginCandidate[]>([]);
  const apiBase = useMemo(() => getAssetBaseUrl(), []);

  async function onContinue(event: FormEvent) {
    event.preventDefault();
    const validation = validateIdentify({ email, name, phone });
    setErrors(validation.errors);
    setFormError('');
    setCandidates([]);
    if (!validation.valid) return;
    setLoading(true);
    try {
      const result = await identify({ email, name, phone });
      if (result.status === 'authenticated') {
        showSuccess('Welcome back');
        navigate(from, { replace: true });
        return;
      }
      if (result.status === 'candidates') {
        setCandidates(result.candidates);
        return;
      }
      setFormError(result.message);
    } catch (error) {
      setFormError(getErrorMessage(error));
      showError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function onPick(uid: string) {
    setLoading(true);
    try {
      await loginByUid(uid);
      showSuccess('Welcome back');
      navigate(from, { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error));
      showError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <section className="auth-art">
        <div>
          <div className="brand" style={{ padding: 0 }}>
            <span className="brand-mark">C</span>
            <strong>CRUD</strong>
          </div>
        </div>
        <h1>Keep records, people, and operations in one calm workspace.</h1>
        <p className="muted">Sign in with email, name, or phone — no password.</p>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <h2>Welcome</h2>
          <p className="muted" style={{ margin: '6px 0 18px' }}>
            Email and phone are unique. If several people share a name, pick the right account.
          </p>
          <form onSubmit={onContinue} noValidate>
            <Input
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={errors.email || errors.identifier}
              autoComplete="email"
            />
            <Input
              label="Name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              error={errors.fullName}
              autoComplete="name"
            />
            <Input
              label="Phone number"
              name="phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              error={errors.phone}
              autoComplete="tel"
            />
            <FormError message={formError} />
            <Button type="submit" loading={loading} style={{ width: '100%' }}>
              {loading ? 'Please wait...' : 'Continue'}
            </Button>
          </form>
          <Button type="button" style={{ width: '100%', marginTop: 10 }} onClick={() => navigate('/register')}>
            Create account
          </Button>

          {candidates.length > 0 ? (
            <div style={{ marginTop: 18 }}>
              <strong>Multiple people match that name</strong>
              <p className="muted">Choose your account:</p>
              <div style={{ display: 'grid', gap: 10 }}>
                {candidates.map((item) => {
                  const uri = resolveProfilePhotoUrl(
                    { photoURL: item.photoURL, avatarId: item.avatarId, photoManual: false },
                    apiBase,
                  );
                  return (
                    <button
                      key={item.uid}
                      type="button"
                      className="candidate-row"
                      onClick={() => void onPick(item.uid)}
                      style={{
                        display: 'flex',
                        gap: 12,
                        alignItems: 'center',
                        textAlign: 'left',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: 12,
                        background: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      {uri ? (
                        <img src={uri} alt="" width={44} height={44} style={{ borderRadius: 22 }} />
                      ) : (
                        <span
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            background: '#e2e8f0',
                            display: 'inline-block',
                          }}
                        />
                      )}
                      <span>
                        <strong>{item.fullName}</strong>
                        <br />
                        <span className="muted">{item.email}</span>
                        {item.phone ? (
                          <>
                            <br />
                            <span className="muted">{item.phone}</span>
                          </>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <p className="muted" style={{ marginTop: 16 }}>
            Demo: <Link to="/login">admin@nexora.app</Link> / Jane Carter / +910000000002
          </p>
        </div>
      </section>
    </div>
  );
}
