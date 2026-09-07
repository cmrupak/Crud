import { createContext, useContext } from 'react';
import type {
  IdentifyInput,
  IdentifyResult,
  LoginInput,
  ProfileSetupInput,
  RegisterInput,
  UserProfile,
} from '@nexora/shared';

export interface AuthContextValue {
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

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
