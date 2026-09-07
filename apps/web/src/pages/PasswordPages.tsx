import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MESSAGES, getErrorMessage, validateEmail, validatePasswordReset } from '@nexora/shared';
import { Button, FormError, Input, PasswordInput } from '../components/form/Fields.tsx';
import { useAuth } from '../context/auth-context.ts';
import { useToast } from '../context/ToastProvider.tsx';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const emailError = validateEmail(email);
    setError(emailError ?? '');
    if (emailError) return;
    setLoading(true);
    try {
      await resetPassword(email);
      showSuccess(MESSAGES.RESET_EMAIL_SENT);
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <section className="auth-art">
        <h1>Reset access without exposing account existence.</h1>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <h2>Forgot password</h2>
          <p className="muted" style={{ margin: '6px 0 18px' }}>
            Local/API mode opens the reset form next.
          </p>
          <form onSubmit={onSubmit} noValidate>
            <Input
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={error}
            />
            <Button type="submit" loading={loading} style={{ width: '100%' }}>
              Send reset link
            </Button>
          </form>
          <p style={{ marginTop: 16 }}>
            <Link to="/login">Back to login</Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export function ResetPasswordPage() {
  const { confirmPasswordReset } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const [email, setEmail] = useState(params.get('email') ?? '');
  const oobCode = params.get('oobCode') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const validation = validatePasswordReset(password, confirmPassword);
    const emailError = validateEmail(email);
    const nextErrors = { ...validation.errors };
    if (emailError) nextErrors.email = emailError;
    setErrors(nextErrors);
    if (!validation.valid || emailError) return;
    setLoading(true);
    try {
      await confirmPasswordReset(oobCode || email, password);
      showSuccess(MESSAGES.PASSWORD_RESET);
      navigate('/login');
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
        <h1>Choose a new password.</h1>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <h2>Reset password</h2>
          <form onSubmit={onSubmit} noValidate>
            <Input
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={errors.email}
            />
            <PasswordInput
              label="New password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={errors.password}
            />
            <PasswordInput
              label="Confirm password"
              name="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              error={errors.confirmPassword}
            />
            <FormError message={formError} />
            <Button type="submit" loading={loading} style={{ width: '100%' }}>
              Update password
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}

export function AccountDeactivatedPage() {
  return (
    <div className="auth-screen">
      <section className="auth-panel" style={{ gridColumn: '1 / -1' }}>
        <div className="auth-card">
          <h2>Account deactivated</h2>
          <p className="muted" style={{ margin: '12px 0 18px' }}>
            Your account has been deactivated. Please contact an administrator.
          </p>
          <Link className="btn btn-primary" to="/login">
            Back to login
          </Link>
        </div>
      </section>
    </div>
  );
}
