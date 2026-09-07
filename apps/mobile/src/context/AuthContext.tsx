import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AppError,
  ERROR_CODES,
  type IdentifyInput,
  type IdentifyResult,
  type LoginInput,
  type ProfileSetupInput,
  type RegisterInput,
  type UserProfile,
} from '@nexora/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBackend } from '../services/backend';

const SETUP_SKIP_KEY = 'nexora.profile.setup.skipped';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  deactivated: boolean;
  needsProfileSetup: boolean;
  identify: (input: IdentifyInput) => Promise<IdentifyResult>;
  loginByUid: (uid: string) => Promise<UserProfile>;
  login: (input: LoginInput) => Promise<UserProfile>;
  register: (input: RegisterInput) => Promise<UserProfile>;
  setupProfile: (input: ProfileSetupInput) => Promise<UserProfile>;
  skipProfileSetup: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmPasswordReset: (email: string, password: string) => Promise<void>;
  refreshUser: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is missing');
  return value;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const backend = getBackend();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deactivated, setDeactivated] = useState(false);
  const [setupSkipped, setSetupSkipped] = useState(false);

  async function refreshUser() {
    try {
      const skipped = (await AsyncStorage.getItem(SETUP_SKIP_KEY)) === '1';
      setSetupSkipped(skipped);
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
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshUser();
  }, []);

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
          await AsyncStorage.setItem(SETUP_SKIP_KEY, '1');
          setSetupSkipped(true);
          setDeactivated(false);
          setUser(result.user);
        }
        return result;
      },
      async loginByUid(uid: string) {
        const profile = await backend.auth.loginByUid(uid);
        await AsyncStorage.setItem(SETUP_SKIP_KEY, '1');
        setSetupSkipped(true);
        setDeactivated(false);
        setUser(profile);
        return profile;
      },
      async login(input: LoginInput) {
        const profile = await backend.auth.login(input);
        await AsyncStorage.setItem(SETUP_SKIP_KEY, '1');
        setSetupSkipped(true);
        setDeactivated(false);
        setUser(profile);
        return profile;
      },
      async register(input: RegisterInput) {
        const profile = await backend.auth.register(input);
        await AsyncStorage.setItem(SETUP_SKIP_KEY, '1');
        setSetupSkipped(true);
        setDeactivated(false);
        setUser(profile);
        return profile;
      },
      async setupProfile(input: ProfileSetupInput) {
        const profile = await backend.auth.setupProfile(input);
        if (input.skip) {
          await AsyncStorage.setItem(SETUP_SKIP_KEY, '1');
          setSetupSkipped(true);
        } else {
          await AsyncStorage.removeItem(SETUP_SKIP_KEY);
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
        await AsyncStorage.setItem(SETUP_SKIP_KEY, '1');
        setSetupSkipped(true);
      },
      async logout() {
        await backend.auth.logout();
        await AsyncStorage.removeItem(SETUP_SKIP_KEY);
        setSetupSkipped(false);
        setDeactivated(false);
        setUser(null);
      },
      resetPassword: (email: string) => backend.auth.resetPassword(email),
      confirmPasswordReset: (email: string, password: string) =>
        backend.auth.confirmPasswordReset(email, password),
      refreshUser,
    }),
    [backend, deactivated, loading, needsProfileSetup, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
