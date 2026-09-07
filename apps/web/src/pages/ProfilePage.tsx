import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  MESSAGES,
  RELATION_OPTIONS,
  displayName,
  displayRelation,
  getErrorMessage,
  resolveProfilePhotoUrl,
  validateProfile,
  type Gender,
} from '@nexora/shared';
import { Button, FileUpload, FormError, Input, Select } from '../components/form/Fields.tsx';
import { useAuth } from '../context/auth-context.ts';
import { useBackend } from '../context/backend-context.ts';
import { useConfirm } from '../context/ConfirmProvider.tsx';
import { useToast } from '../context/ToastProvider.tsx';
import { useNavigate } from 'react-router-dom';
import { getAssetBaseUrl } from '../services/api-url.ts';

function relationSelectState(stored: string | null | undefined) {
  if (!stored) return { relation: '', relationOther: '' };
  if (RELATION_OPTIONS.some((option) => option.value === stored)) {
    return { relation: stored, relationOther: '' };
  }
  return { relation: 'other', relationOther: stored };
}

export function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const backend = useBackend();
  const { confirm } = useConfirm();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [gender, setGender] = useState<Gender | ''>(user?.gender ?? '');
  const initialRelation = relationSelectState(user?.relation);
  const [relation, setRelation] = useState(initialRelation.relation);
  const [relationOther, setRelationOther] = useState(initialRelation.relationOther);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
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

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setGender(user.gender ?? '');
    const next = relationSelectState(user.relation);
    setRelation(next.relation);
    setRelationOther(next.relationOther);
  }, [user]);

  if (!user) return null;
  const profile = user;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (gender !== 'male' && gender !== 'female') nextErrors.gender = 'Select male or female.';
    if (!relation.trim()) nextErrors.relation = 'Select your relationship.';
    if (relation === 'other' && !relationOther.trim()) {
      nextErrors.relationOther = 'Please describe your relationship.';
    }
    const validation = validateProfile({
      firstName,
      lastName,
      gender: gender || null,
      relation,
      relationOther,
    });
    setErrors({ ...validation.errors, ...nextErrors });
    if (!validation.valid || Object.keys(nextErrors).length > 0) return;
    setSaving(true);
    try {
      await backend.users.updateProfile(profile.uid, {
        firstName,
        lastName,
        gender: gender as Gender,
        relation,
        relationOther,
      });
      await refreshUser();
      showSuccess(MESSAGES.PROFILE_UPDATED);
    } catch (error) {
      setFormError(getErrorMessage(error));
      showError(MESSAGES.UPDATE_PROFILE_ERROR);
    } finally {
      setSaving(false);
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      await backend.files.uploadProfileImage(file, file.name, file.type);
      await refreshUser();
      showSuccess(MESSAGES.PHOTO_UPDATED);
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  async function deactivate() {
    const ok = await confirm({
      title: 'Deactivate My Account',
      message: `Are you sure you want to deactivate ${displayName(profile)}? You will no longer be able to access the application.`,
      confirmLabel: 'Deactivate',
      danger: true,
    });
    if (!ok) return;
    try {
      await backend.users.deactivateSelf();
      await logout();
      showSuccess(MESSAGES.ACCOUNT_DEACTIVATED);
      navigate('/account-deactivated');
    } catch (error) {
      showError(getErrorMessage(error));
    }
  }

  return (
    <section>
      <h1 className="page-title">Profile</h1>
      <p className="page-sub">Manage your name, photo, and account status.</p>
      <div className="card card-pad" style={{ marginTop: 20, maxWidth: 680 }}>
        <div className="profile-head">
          <div className="avatar-lg">
            {photoUri ? <img src={photoUri} alt="" /> : profile.firstName.charAt(0)}
          </div>
          <div>
            <h2>{displayName(profile)}</h2>
            <p className="muted">{profile.email}</p>
            {profile.phone ? <p className="muted">{profile.phone}</p> : null}
            <p className="muted">
              {profile.gender ? `${profile.gender} · ` : ''}
              {displayRelation(profile.relation) || 'Relation not set'}
            </p>
            <p>
              <span className={`badge ${profile.role}`}>{profile.role}</span>{' '}
              <span className={`badge ${profile.status}`}>{profile.status}</span>
            </p>
          </div>
        </div>
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
          <Input label="Email" name="email" value={profile.email} disabled />
          <Input label="Phone" name="phone" value={profile.phone ?? '—'} disabled />
          <Select
            label="Gender"
            name="gender"
            value={gender}
            onChange={(event) => setGender(event.target.value as Gender | '')}
            error={errors.gender}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </Select>
          <Select
            label="Relationship"
            name="relation"
            value={relation}
            onChange={(event) => setRelation(event.target.value)}
            error={errors.relation}
          >
            <option value="">Select relationship</option>
            {RELATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          {relation === 'other' ? (
            <Input
              label="Describe relationship"
              name="relationOther"
              value={relationOther}
              onChange={(event) => setRelationOther(event.target.value)}
              error={errors.relationOther}
            />
          ) : null}
          <FileUpload
            label={uploading ? 'Uploading...' : 'Profile photo'}
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => void onFile(event.target.files?.[0])}
          />
          <FormError message={formError} />
          <Button type="submit" loading={saving}>
            {saving ? 'Updating...' : 'Save profile'}
          </Button>
        </form>
        <hr style={{ margin: '28px 0', border: 0, borderTop: '1px solid var(--line)' }} />
        <h3>Danger zone</h3>
        <p className="muted" style={{ margin: '8px 0 14px' }}>
          Deactivation keeps your data but blocks sign-in until an administrator reactivates the account.
        </p>
        <button type="button" className="btn btn-danger" onClick={() => void deactivate()}>
          Deactivate my account
        </button>
      </div>
    </section>
  );
}
