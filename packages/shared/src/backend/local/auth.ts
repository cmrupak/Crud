import { MESSAGES } from '../../constants';
import { AppError, ERROR_CODES } from '../../errors';
import {
  avatarPath,
  normalizePhone,
  pickAvatarId,
  splitFullName,
} from '../../avatar';
import type {
  IdentifyInput,
  IdentifyResult,
  LoginInput,
  ProfileSetupInput,
  RegisterInput,
  UserProfile,
} from '../../types';
import {
  validateIdentify,
  validateLogin,
  validatePasswordReset,
  validateProfileSetup,
  validateRegistration,
} from '../../validation';
import { createId, displayName, hashPassword, nowIso } from '../../utils';
import type { AuthService } from '../types';
import type { LocalDatabase } from './database';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function withDefaults(profile: Partial<UserProfile> & Pick<UserProfile, 'uid' | 'firstName' | 'lastName' | 'email' | 'role' | 'status' | 'createdAt' | 'updatedAt'>): UserProfile {
  return {
    phone: null,
    gender: null,
    relation: null,
    photoURL: null,
    avatarId: null,
    photoManual: false,
    profileSetupComplete: false,
    lastLoginAt: null,
    ...profile,
  };
}

export function createLocalAuthService(db: LocalDatabase): AuthService {
  return {
    async identify(input: IdentifyInput): Promise<IdentifyResult> {
      const validation = validateIdentify(input);
      if (!validation.valid) {
        throw new AppError(ERROR_CODES.VALIDATION, 'Please fix the highlighted fields.', validation.errors);
      }
      const store = await db.load();
      const email = normalizeEmail(input.email ?? '');
      const phone = normalizePhone(input.phone ?? '');
      const name = (input.name ?? '').trim().toLowerCase();

      if (email) {
        const account = store.accounts[email];
        if (account) {
          const profile = store.users[account.uid];
          if (profile) {
            if (profile.status === 'inactive') {
              throw new AppError(ERROR_CODES.ACCOUNT_INACTIVE, MESSAGES.INACTIVE_LOGIN);
            }
            const now = nowIso();
            const next = { ...profile, lastLoginAt: now, updatedAt: now };
            await db.update((data) => {
              data.users[profile.uid] = next;
              data.session = { profile: next, rememberMe: true };
            });
            return { status: 'authenticated', token: 'local', user: next };
          }
        }
      }

      if (phone) {
        const match = Object.values(store.users).find((u) => u.phone === phone);
        if (match) {
          if (match.status === 'inactive') {
            throw new AppError(ERROR_CODES.ACCOUNT_INACTIVE, MESSAGES.INACTIVE_LOGIN);
          }
          const now = nowIso();
          const next = { ...match, lastLoginAt: now, updatedAt: now };
          await db.update((data) => {
            data.users[match.uid] = next;
            data.session = { profile: next, rememberMe: true };
          });
          return { status: 'authenticated', token: 'local', user: next };
        }
      }

      if (name) {
        const matches = Object.values(store.users).filter((u) => {
          const full = `${u.firstName} ${u.lastName}`.trim().toLowerCase();
          return (
            u.firstName.toLowerCase() === name ||
            u.lastName.toLowerCase() === name ||
            full === name ||
            full.includes(name)
          );
        });
        if (matches.length === 1) {
          const profile = matches[0]!;
          if (profile.status === 'inactive') {
            throw new AppError(ERROR_CODES.ACCOUNT_INACTIVE, MESSAGES.INACTIVE_LOGIN);
          }
          const now = nowIso();
          const next = { ...profile, lastLoginAt: now, updatedAt: now };
          await db.update((data) => {
            data.users[profile.uid] = next;
            data.session = { profile: next, rememberMe: true };
          });
          return { status: 'authenticated', token: 'local', user: next };
        }
        if (matches.length > 1) {
          return {
            status: 'candidates',
            candidates: matches.map((u) => ({
              uid: u.uid,
              fullName: displayName(u),
              email: u.email,
              phone: u.phone,
              photoURL: u.photoURL,
              avatarId: u.avatarId,
            })),
          };
        }
      }

      return {
        status: 'not_found',
        message: "We couldn't find an account with those details.",
      };
    },

    async loginByUid(uid: string): Promise<UserProfile> {
      const store = await db.load();
      const profile = store.users[uid];
      if (!profile) throw new AppError(ERROR_CODES.USER_NOT_FOUND, 'User profile was not found.');
      if (profile.status === 'inactive') {
        throw new AppError(ERROR_CODES.ACCOUNT_INACTIVE, MESSAGES.INACTIVE_LOGIN);
      }
      const now = nowIso();
      const next = { ...profile, lastLoginAt: now, updatedAt: now };
      await db.update((data) => {
        data.users[uid] = next;
        data.session = { profile: next, rememberMe: true };
      });
      return next;
    },

    async register(input: RegisterInput): Promise<UserProfile> {
      const validation = validateRegistration(input);
      if (!validation.valid) {
        throw new AppError(ERROR_CODES.VALIDATION, 'Please fix the highlighted fields.', validation.errors);
      }

      const email = normalizeEmail(input.email);
      const phone = normalizePhone(input.phone);
      const { firstName, lastName } = splitFullName(input.fullName);
      const store = await db.load();
      if (store.accounts[email]) {
        throw new AppError(ERROR_CODES.EMAIL_IN_USE, 'An account already exists with this email.');
      }
      if (Object.values(store.users).some((u) => u.phone === phone)) {
        throw new AppError(ERROR_CODES.VALIDATION, 'An account already exists with this phone number.');
      }

      const uid = createId('user');
      const now = nowIso();
      const fullName = `${firstName} ${lastName}`.trim();
      const relation =
        input.relation === 'other' ? String(input.relationOther ?? '').trim() : input.relation;
      const avatarId = pickAvatarId(fullName, input.gender);
      const profile = withDefaults({
        uid,
        firstName,
        lastName,
        email,
        phone,
        role: 'user',
        status: 'active',
        gender: input.gender,
        relation,
        avatarId,
        photoURL: avatarPath(avatarId),
        photoManual: false,
        profileSetupComplete: true,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      });

      await db.update((data) => {
        data.accounts[email] = { uid, email, passwordHash: '' };
        data.users[uid] = profile;
        data.session = { profile, rememberMe: true };
      });
      await db.writeAudit({
        action: 'USER_CREATED',
        performedBy: uid,
        targetUser: uid,
      });
      return profile;
    },

    async setupProfile(input: ProfileSetupInput): Promise<UserProfile> {
      const validation = validateProfileSetup(input);
      if (!validation.valid) {
        throw new AppError(ERROR_CODES.VALIDATION, 'Please fix the highlighted fields.', validation.errors);
      }
      const store = await db.load();
      const session = store.session;
      if (!session) throw new AppError(ERROR_CODES.UNAUTHENTICATED, 'Sign in required.');
      const current = store.users[session.profile.uid];
      if (!current) throw new AppError(ERROR_CODES.USER_NOT_FOUND, 'User profile was not found.');
      if (input.skip) return current;

      const email = normalizeEmail(input.email);
      const { firstName, lastName } = splitFullName(input.fullName);
      const other = Object.values(store.users).find((u) => u.email === email && u.uid !== current.uid);
      if (other) throw new AppError(ERROR_CODES.EMAIL_IN_USE, 'An account already exists with this email.');

      const relation =
        input.relation === 'other' ? String(input.relationOther ?? '').trim() : input.relation;
      const fullName = `${firstName} ${lastName}`.trim();
      const avatarId = pickAvatarId(fullName, input.gender);
      const manual = Boolean(input.photoURL?.startsWith('data:image/'));
      const now = nowIso();
      const next: UserProfile = {
        ...current,
        firstName,
        lastName,
        email,
        gender: input.gender,
        relation,
        avatarId,
        photoURL: manual ? input.photoURL! : avatarPath(avatarId),
        photoManual: manual,
        profileSetupComplete: true,
        updatedAt: now,
      };
      await db.update((data) => {
        const prevAccount = data.accounts[current.email];
        if (current.email !== email) delete data.accounts[current.email];
        data.accounts[email] = {
          uid: current.uid,
          email,
          passwordHash: prevAccount?.passwordHash ?? '',
        };
        data.users[current.uid] = next;
        data.session = { profile: next, rememberMe: true };
      });
      return next;
    },

    async login(input: LoginInput): Promise<UserProfile> {
      const validation = validateLogin(input.email, input.password);
      if (!validation.valid) {
        throw new AppError(ERROR_CODES.VALIDATION, 'Please fix the highlighted fields.', validation.errors);
      }

      const email = normalizeEmail(input.email);
      const store = await db.load();
      const account = store.accounts[email];
      if (!account?.passwordHash) {
        throw new AppError(ERROR_CODES.INVALID_CREDENTIAL, 'Invalid email or password.');
      }

      const passwordHash = await hashPassword(input.password);
      if (passwordHash !== account.passwordHash) {
        throw new AppError(ERROR_CODES.INVALID_CREDENTIAL, 'Invalid email or password.');
      }

      const profile = store.users[account.uid];
      if (!profile) {
        throw new AppError(ERROR_CODES.USER_NOT_FOUND, 'User profile was not found.');
      }
      if (profile.status === 'inactive') {
        throw new AppError(ERROR_CODES.ACCOUNT_INACTIVE, MESSAGES.INACTIVE_LOGIN);
      }

      const now = nowIso();
      const next: UserProfile = { ...profile, lastLoginAt: now, updatedAt: now };
      await db.update((data) => {
        data.users[profile.uid] = next;
        data.session = { profile: next, rememberMe: input.rememberMe };
      });
      return next;
    },

    async logout(): Promise<void> {
      await db.update((data) => {
        data.session = null;
      });
    },

    async resetPassword(email: string): Promise<void> {
      const normalized = normalizeEmail(email);
      const store = await db.load();
      if (store.accounts[normalized]) {
        await db.update((data) => {
          data.resetAllowlist[normalized] = true;
        });
      }
    },

    async confirmPasswordReset(email: string, password: string): Promise<void> {
      const validation = validatePasswordReset(password, password);
      if (!validation.valid) {
        throw new AppError(ERROR_CODES.VALIDATION, 'Please fix the highlighted fields.', validation.errors);
      }
      const normalized = normalizeEmail(email);
      const store = await db.load();
      const account = store.accounts[normalized];
      if (!account || !store.resetAllowlist[normalized]) {
        throw new AppError(
          ERROR_CODES.NOT_FOUND,
          'This reset link is invalid or has expired. Request a new one.',
        );
      }
      const passwordHash = await hashPassword(password);
      await db.update((data) => {
        const current = data.accounts[normalized];
        if (current) current.passwordHash = passwordHash;
        delete data.resetAllowlist[normalized];
      });
    },

    async getCurrentUser(): Promise<UserProfile | null> {
      const store = await db.load();
      if (!store.session) return null;
      const profile = store.users[store.session.profile.uid];
      if (!profile) {
        await db.update((data) => {
          data.session = null;
        });
        return null;
      }
      if (profile.status === 'inactive') {
        await db.update((data) => {
          data.session = null;
        });
        throw new AppError(ERROR_CODES.ACCOUNT_INACTIVE, MESSAGES.INACTIVE_LOGIN);
      }
      return withDefaults(profile);
    },

    async refreshUser(): Promise<UserProfile | null> {
      return this.getCurrentUser();
    },
  };
}
