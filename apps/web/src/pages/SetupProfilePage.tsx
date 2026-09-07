import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RELATION_OPTIONS,
  displayName,
  getErrorMessage,
  pickAvatarId,
  resolveProfilePhotoUrl,
  validateProfileSetup,
  type Gender,
} from '@nexora/shared';
import { Button, FormError, Input } from '../components/form/Fields.tsx';
import { useAuth } from '../context/auth-context.ts';
import { useToast } from '../context/ToastProvider.tsx';
import { getAssetBaseUrl } from '../services/api-url.ts';

export function SetupProfilePage() {
  const { user, setupProfile, skipProfileSetup } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(user ? displayName(user) : '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [gender, setGender] = useState<Gender | ''>(user?.gender ?? '');
  const [relation, setRelation] = useState(
    RELATION_OPTIONS.some((o) => o.value === user?.relation)
      ? (user?.relation as string)
      : user?.relation
        ? 'other'
        : '',
  );
  const [relationOther, setRelationOther] = useState(
    RELATION_OPTIONS.some((o) => o.value === user?.relation) ? '' : (user?.relation ?? ''),
  );
  const [manualPhoto, setManualPhoto] = useState<string | null>(
    user?.photoManual ? user.photoURL : null,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const apiBase = useMemo(() => getAssetBaseUrl(), []);

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  const previewUri = useMemo(() => {
    if (manualPhoto) return manualPhoto;
    if (gender === 'male' || gender === 'female') {
      const avatarId = pickAvatarId(fullName || 'User', gender);
      return resolveProfilePhotoUrl({ photoURL: null, avatarId, photoManual: false }, apiBase);
    }
    return user
      ? resolveProfilePhotoUrl(
          {
            photoURL: user.photoURL,
            avatarId: user.avatarId,
            photoManual: user.photoManual,
          },
          apiBase,
        )
      : null;
  }, [apiBase, fullName, gender, manualPhoto, user]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    const input = {
      fullName,
      email,
      gender: gender as Gender,
      relation,
      relationOther,
      photoURL: manualPhoto,
    };
    const validation = validateProfileSetup(input);
    setErrors(validation.errors);
    setFormError('');
    if (!validation.valid) return;
    setLoading(true);
    try {
      await setupProfile(input);
      showSuccess('Profile saved');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error));
      showError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function onSkip() {
    setLoading(true);
    try {
      await skipProfileSetup();
      navigate('/dashboard', { replace: true });
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  function onFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setManualPhoto(String(reader.result));
    reader.readAsDataURL(file);
  }

  if (!user) return null;

  return (
    <div className="auth-screen">
      <section className="auth-panel" style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="auth-card">
          <h2>Set up your profile</h2>
          <p className="muted">Full name, email, photo, gender, and how you relate to the admin.</p>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            {previewUri ? (
              <img src={previewUri} alt="" width={112} height={112} style={{ borderRadius: 56 }} />
            ) : (
              <div
                style={{
                  width: 112,
                  height: 112,
                  borderRadius: 56,
                  background: '#e2e8f0',
                  margin: '0 auto',
                }}
              />
            )}
            <div style={{ marginTop: 8 }}>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => onFile(event.target.files?.[0] ?? null)}
              />
            </div>
            {manualPhoto ? (
              <button type="button" className="linkish" onClick={() => setManualPhoto(null)}>
                Use auto avatar from name + gender
              </button>
            ) : null}
          </div>
          <form onSubmit={onSave} noValidate>
            <Input
              label="Full name"
              name="fullName"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              error={errors.fullName}
            />
            <Input
              label="Email address"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={errors.email}
            />
            <label className="field-label">Gender</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {(['male', 'female'] as Gender[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGender(value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: '1px solid #e2e8f0',
                    background: gender === value ? '#0F766E' : '#fff',
                    color: gender === value ? '#fff' : '#0f172a',
                    fontWeight: 700,
                  }}
                >
                  {value === 'male' ? 'Male' : 'Female'}
                </button>
              ))}
            </div>
            {errors.gender ? <FormError message={errors.gender} /> : null}
            <label className="field-label">Who are you? (related to admin)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {RELATION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRelation(option.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: '1px solid #e2e8f0',
                    background: relation === option.value ? '#0F766E' : '#fff',
                    color: relation === option.value ? '#fff' : '#0f172a',
                    fontWeight: 700,
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {relation === 'other' ? (
              <Input
                label="Other relation"
                name="relationOther"
                value={relationOther}
                onChange={(event) => setRelationOther(event.target.value)}
                error={errors.relationOther}
              />
            ) : null}
            {errors.relation ? <FormError message={errors.relation} /> : null}
            <FormError message={formError} />
            <Button type="submit" loading={loading} style={{ width: '100%' }}>
              Save profile
            </Button>
          </form>
          <Button type="button" loading={loading} style={{ width: '100%', marginTop: 10 }} onClick={() => void onSkip()}>
            Skip for now / Setup later
          </Button>
        </div>
      </section>
    </div>
  );
}
