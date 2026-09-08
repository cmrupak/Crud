import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AppError,
  ERROR_CODES,
  type IdentifyInput,
  type LoginInput,
  type ProfileSetupInput,
  type RegisterInput,
  type UserProfile,
} from '@nexora/shared';
import { useBackend } from './backend-context.ts';
import { AuthContext } from './auth-context.ts';

const SETUP_SKIP_KEY = 'nexora.profile.setup.skipped';

export function AuthProvider({ children }: { children: ReactNode }) {
  const backend = useBackend();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deactivated, setDeactivated] = useState(false);
  const [setupSkipped, setSetupSkipped] = useState(
    () => localStorage.getItem(SETUP_SKIP_KEY) === '1',
  );

  const refreshUser = useCallback(async () => {
    try {
      setSetupSkipped(localStorage.getItem(SETUP_SKIP_KEY) === '1');
      const profile = await backend.auth.getCurrentUser();
      setDeactivated(false);
      setUser(profile);
      return profile;
    } catch (error) {
      if (error instanceof AppError && error.code === ERROR_CODES.ACCOUNT_INACTIVE) {
        setUser(null);
        setDeactivated(true);
        return null;
      }
      // Keep existing session on transient network / cold-start errors
      if (
        error instanceof AppError &&
        (error.code === ERROR_CODES.NETWORK || error.code === ERROR_CODES.UNKNOWN)
      ) {
        return null;
      }
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [backend]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const needsProfileSetup = Boolean(user && !user.profileSetupComplete && !setupSkipped);

  const value = useMemo(
    () => ({
      user,
      loading,
      deactivated,
      needsProfileSetup,
      async identify(input: IdentifyInput) {
        const result = await backend.auth.identify(input);
        if (result.status === 'authenticated') {
          localStorage.setItem(SETUP_SKIP_KEY, '1');
          setSetupSkipped(true);
          setDeactivated(false);
          setUser(result.user);
        }
        return result;
      },
      async loginByUid(uid: string) {
        const profile = await backend.auth.loginByUid(uid);
        localStorage.setItem(SETUP_SKIP_KEY, '1');
        setSetupSkipped(true);
        setDeactivated(false);
        setUser(profile);
        return profile;
      },
      async login(input: LoginInput) {
        const profile = await backend.auth.login(input);
        localStorage.setItem(SETUP_SKIP_KEY, '1');
        setSetupSkipped(true);
        setDeactivated(false);
        setUser(profile);
        return profile;
      },
      async register(input: RegisterInput) {
        const profile = await backend.auth.register(input);
        localStorage.setItem(SETUP_SKIP_KEY, '1');
        setSetupSkipped(true);
        setDeactivated(false);
        setUser(profile);
        return profile;
      },
      async setupProfile(input: ProfileSetupInput) {
        const profile = await backend.auth.setupProfile(input);
        if (input.skip) {
          localStorage.setItem(SETUP_SKIP_KEY, '1');
          setSetupSkipped(true);
        } else {
          localStorage.removeItem(SETUP_SKIP_KEY);
          setSetupSkipped(false);
        }
        setUser(profile);
        return profile;
      },
      async skipProfileSetup() {
        await backend.auth.setupProfile({
          skip: true,
          fullName: '',
          email: '',
          gender: 'male',
          relation: '',
        });
        localStorage.setItem(SETUP_SKIP_KEY, '1');
        setSetupSkipped(true);
      },
      async logout() {
        await backend.auth.logout();
        localStorage.removeItem(SETUP_SKIP_KEY);
        setSetupSkipped(false);
        setDeactivated(false);
        setUser(null);
      },
      async resetPassword(email: string) {
        await backend.auth.resetPassword(email);
      },
      async confirmPasswordReset(email: string, password: string) {
        await backend.auth.confirmPasswordReset(email, password);
      },
      refreshUser,
    }),
    [backend, deactivated, loading, needsProfileSetup, refreshUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
