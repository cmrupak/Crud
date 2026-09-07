import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  IDENTIFIER_PLACEHOLDERS,
  ONBOARDING_MESSAGES,
  getErrorMessage,
  resolveProfilePhotoUrl,
  toIdentifyInput,
  validateIdentifierInput,
  type LoginCandidate,
} from '@nexora/shared';
import { Button, FormError } from '../components/form/Fields.tsx';
import { useAuth } from '../context/auth-context.ts';
import { useToast } from '../context/ToastProvider.tsx';
import { getAssetBaseUrl } from '../services/api-url.ts';

export function ExistingUserPage() {
  const { identify, loginByUid } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [candidates, setCandidates] = useState<LoginCandidate[]>([]);
  const apiBase = useMemo(() => getAssetBaseUrl(), []);

  useEffect(() => {
    if (value.trim()) return undefined;
    const timer = setInterval(() => {
      setFade(false);
      window.setTimeout(() => {
        setPlaceholderIndex((current) => (current + 1) % IDENTIFIER_PLACEHOLDERS.length);
        setFade(true);
      }, 280);
    }, 2200);
    return () => clearInterval(timer);
  }, [value]);

  async function onVerify(event: FormEvent) {
    event.preventDefault();
    const validationError = validateIdentifierInput(value);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setLoading(true);
    setFormError('');
    setCandidates([]);
    try {
      const result = await identify(toIdentifyInput(value));
      if (result.status === 'authenticated') {
        showSuccess('Welcome back');
        navigate('/dashboard', { replace: true });
        return;
      }
      if (result.status === 'candidates') {
        setCandidates(result.candidates);
        return;
      }
      setFormError(ONBOARDING_MESSAGES.NOT_FOUND);
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
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error));
      showError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="onboard-screen">
      <div className="onboard-panel">
        <p className="onboard-kicker brand-color">Login</p>
        <h1>Welcome back</h1>
        <p className="muted">Enter first name, full name, email, or phone.</p>

        <form onSubmit={onVerify} noValidate>
          <div className="fading-input">
            <input
              className="field-input"
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setFormError('');
              }}
              autoCapitalize="off"
              disabled={loading}
            />
            {!value.trim() ? (
              <span className={`fading-placeholder ${fade ? 'in' : 'out'}`}>
                {IDENTIFIER_PLACEHOLDERS[placeholderIndex]}
              </span>
            ) : null}
          </div>
          <FormError message={formError} />
          <Button type="submit" loading={loading} style={{ width: '100%', marginTop: 12 }}>
            {loading ? ONBOARDING_MESSAGES.VERIFYING : 'Login'}
          </Button>
        </form>

        {candidates.length > 0 ? (
          <div style={{ marginTop: 18 }}>
            <strong>Multiple matches — choose your account</strong>
            <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
              {candidates.map((item) => {
                const uri = resolveProfilePhotoUrl(
                  { photoURL: item.photoURL, avatarId: item.avatarId, photoManual: false },
                  apiBase,
                );
                return (
                  <button
                    key={item.uid}
                    type="button"
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

        <p className="muted" style={{ marginTop: 18, textAlign: 'center' }}>
          Don't have an Account? <Link to="/register">Create Account</Link>
        </p>
      </div>
    </div>
  );
}
