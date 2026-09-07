import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getErrorMessage,
  splitFullName,
  validateEmail,
  validatePhone,
  validateRegistration,
} from '@nexora/shared';
import { Button, FormError, Input } from '../components/form/Fields.tsx';
import { useAuth } from '../context/auth-context.ts';
import { useToast } from '../context/ToastProvider.tsx';

export function RegisterPage() {
  const { register } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  function onNext(event: FormEvent) {
    event.preventDefault();
    const { firstName } = splitFullName(fullName);
    if (!firstName) {
      setErrors({ fullName: 'Please enter your full name.' });
      return;
    }
    setErrors({});
    setStep(2);
  }

  async function onContinue(event: FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    const emailError = validateEmail(email);
    const phoneError = validatePhone(phone);
    if (emailError) nextErrors.email = emailError;
    if (phoneError) nextErrors.phone = phoneError;
    setErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length > 0) return;

    const validation = validateRegistration({ fullName, email, phone });
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      await register({ fullName, email, phone });
      showSuccess('Account created');
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
        <p className="onboard-kicker brand-color">Create Account</p>
        <h1>{step === 1 ? 'What is your full name?' : 'How can we reach you?'}</h1>
        <p className="muted">{step === 1 ? 'Step 1 of 2' : 'Step 2 of 2 — email and phone must be unique.'}</p>

        {step === 1 ? (
          <form onSubmit={onNext} noValidate className="onboard-fade">
            <Input
              label="Full Name"
              name="fullName"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              error={errors.fullName}
              autoFocus
            />
            <Button type="submit" style={{ width: '100%' }}>
              Next
            </Button>
          </form>
        ) : (
          <form onSubmit={onContinue} noValidate className="onboard-fade">
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={errors.email}
            />
            <Input
              label="Phone Number"
              name="phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              error={errors.phone}
            />
            <FormError message={formError} />
            <Button type="submit" loading={loading} style={{ width: '100%' }}>
              Continue
            </Button>
            <button type="button" className="linkish" onClick={() => setStep(1)} style={{ marginTop: 12 }}>
              Back
            </button>
          </form>
        )}

        <p className="muted" style={{ marginTop: 18, textAlign: 'center' }}>
          Have an Account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
