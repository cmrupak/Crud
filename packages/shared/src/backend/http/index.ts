import { AppError, ERROR_CODES, type ErrorCode } from '../../errors';
import type {
  IdentifyInput,
  IdentifyResult,
  ListQuery,
  LoginInput,
  PaginatedResult,
  ProfileSetupInput,
  ProfileUpdateInput,
  RecordInput,
  RecordItem,
  RegisterInput,
  UserProfile,
  UserRole,
} from '../../types';
import type { KeyValueStorage } from '../../storage';
import type { NexoraBackend } from '../types';

const TOKEN_KEY = 'nexora.api.token';

type ApiErrorBody = {
  code?: ErrorCode;
  message?: string;
  fieldErrors?: Record<string, string>;
};

export function createHttpBackend(options: {
  baseUrl: string;
  storage: KeyValueStorage;
}): NexoraBackend {
  const { baseUrl, storage } = options;

  async function request<T>(
    path: string,
    init: RequestInit = {},
    auth = true,
  ): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    if (auth) {
      const token = await storage.getItem(TOKEN_KEY);
      if (token) headers.set('Authorization', `Bearer ${token}`);
    }

    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, { ...init, headers });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'network error';
      throw new AppError(
        ERROR_CODES.UNKNOWN,
        `Cannot reach API at ${baseUrl}${path} (${detail}). Check internet connection.`,
      );
    }

    const raw = await response.text();
    let data = {} as T & ApiErrorBody;
    if (raw) {
      try {
        data = JSON.parse(raw) as T & ApiErrorBody;
      } catch {
        throw new AppError(
          ERROR_CODES.UNKNOWN,
          `API returned non-JSON (${response.status}) from ${baseUrl}${path}.`,
        );
      }
    }

    if (!response.ok) {
      throw new AppError(
        (data.code as ErrorCode) ?? ERROR_CODES.UNKNOWN,
        data.message ?? `Request failed (${response.status}).`,
        data.fieldErrors,
      );
    }
    return data;
  }

  function queryString(query?: ListQuery): string {
    if (!query) return '';
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', String(query.status));
    if (query.role) params.set('role', String(query.role));
    if (query.page) params.set('page', String(query.page));
    if (query.pageSize) params.set('pageSize', String(query.pageSize));
    if (query.sortBy) params.set('sortBy', query.sortBy);
    if (query.sortDir) params.set('sortDir', query.sortDir);
    const value = params.toString();
    return value ? `?${value}` : '';
  }

  return {
    kind: 'api',
    auth: {
      async identify(input: IdentifyInput) {
        const result = await request<IdentifyResult>(
          '/auth/identify',
          { method: 'POST', body: JSON.stringify(input) },
          false,
        );
        if (result.status === 'authenticated') {
          await storage.setItem(TOKEN_KEY, result.token);
        }
        return result;
      },
      async loginByUid(uid: string) {
        const result = await request<{ token: string; user: UserProfile }>(
          '/auth/login-uid',
          { method: 'POST', body: JSON.stringify({ uid }) },
          false,
        );
        await storage.setItem(TOKEN_KEY, result.token);
        return result.user;
      },
      async register(input: RegisterInput) {
        const result = await request<{ token: string; user: UserProfile }>(
          '/auth/register',
          { method: 'POST', body: JSON.stringify(input) },
          false,
        );
        await storage.setItem(TOKEN_KEY, result.token);
        return result.user;
      },
      async setupProfile(input: ProfileSetupInput) {
        const result = await request<{ user: UserProfile }>('/auth/setup-profile', {
          method: 'POST',
          body: JSON.stringify(input),
        });
        return result.user;
      },
      async login(input: LoginInput) {
        const result = await request<{ token: string; user: UserProfile }>(
          '/auth/login',
          { method: 'POST', body: JSON.stringify(input) },
          false,
        );
        await storage.setItem(TOKEN_KEY, result.token);
        return result.user;
      },
      async logout() {
        try {
          await request('/auth/logout', { method: 'POST' });
        } finally {
          await storage.removeItem(TOKEN_KEY);
        }
      },
      async resetPassword(email: string) {
        await request('/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ email }),
        }, false);
      },
      async confirmPasswordReset(email: string, password: string) {
        await request(
          '/auth/confirm-password-reset',
          { method: 'POST', body: JSON.stringify({ email, password }) },
          false,
        );
      },
      async getCurrentUser() {
        const token = await storage.getItem(TOKEN_KEY);
        if (!token) return null;
        try {
          const result = await request<{ user: UserProfile }>('/auth/me');
          return result.user;
        } catch (error) {
          if (error instanceof AppError && error.code === ERROR_CODES.ACCOUNT_INACTIVE) {
            await storage.removeItem(TOKEN_KEY);
            throw error;
          }
          await storage.removeItem(TOKEN_KEY);
          return null;
        }
      },
      async refreshUser() {
        return this.getCurrentUser();
      },
    },
    users: {
      async getById(uid: string) {
        const result = await request<{ user: UserProfile }>(`/users/${uid}`);
        return result.user;
      },
      async updateProfile(uid: string, input: ProfileUpdateInput) {
        const result = await request<{ user: UserProfile }>(`/users/${uid}`, {
          method: 'PATCH',
          body: JSON.stringify(input),
        });
        return result.user;
      },
      async deactivateSelf() {
        await request('/users/me/deactivate', { method: 'POST' });
        await storage.removeItem(TOKEN_KEY);
      },
    },
    records: {
      async create(input: RecordInput) {
        const result = await request<{ record: RecordItem }>('/records', {
          method: 'POST',
          body: JSON.stringify(input),
        });
        return result.record;
      },
      async getById(id: string) {
        const result = await request<{ record: RecordItem }>(`/records/${id}`);
        return result.record;
      },
      async listMine(query?: ListQuery) {
        return request<PaginatedResult<RecordItem>>(`/records/mine${queryString(query)}`);
      },
      async listAll(query?: ListQuery) {
        return request<PaginatedResult<RecordItem>>(`/records/all${queryString(query)}`);
      },
      async update(id: string, input: RecordInput) {
        const result = await request<{ record: RecordItem }>(`/records/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(input),
        });
        return result.record;
      },
      async softDelete(id: string) {
        await request(`/records/${id}`, { method: 'DELETE' });
      },
    },
    admin: {
      async listUsers(query?: ListQuery) {
        return request<PaginatedResult<UserProfile>>(`/admin/users${queryString(query)}`);
      },
      async getUser(uid: string) {
        const result = await request<{ user: UserProfile }>(`/admin/users/${uid}`);
        return result.user;
      },
      async updateUser(uid: string, input: ProfileUpdateInput & { role?: UserRole }) {
        const result = await request<{ user: UserProfile }>(`/admin/users/${uid}`, {
          method: 'PATCH',
          body: JSON.stringify(input),
        });
        return result.user;
      },
      async activateUser(uid: string) {
        const result = await request<{ user: UserProfile }>(`/admin/users/${uid}/activate`, {
          method: 'POST',
        });
        return result.user;
      },
      async deactivateUser(uid: string) {
        const result = await request<{ user: UserProfile }>(`/admin/users/${uid}/deactivate`, {
          method: 'POST',
        });
        return result.user;
      },
      async changeRole(uid: string, role: UserRole) {
        const result = await request<{ user: UserProfile }>(`/admin/users/${uid}/role`, {
          method: 'POST',
          body: JSON.stringify({ role }),
        });
        return result.user;
      },
    },
    files: {
      async uploadProfileImage(file: Blob, _fileName: string, contentType: string) {
        const photoURL = await blobToDataUrl(file);
        if (!contentType.startsWith('image/')) {
          throw new AppError(ERROR_CODES.VALIDATION, 'Use a JPEG, PNG, or WebP image.');
        }
        const result = await request<{ photoURL: string }>('/users/me/photo', {
          method: 'POST',
          body: JSON.stringify({ photoURL }),
        });
        return result.photoURL;
      },
    },
    stats: {
      async getDashboardStats() {
        const result = await request<{ stats: Awaited<ReturnType<NexoraBackend['stats']['getDashboardStats']>> }>(
          '/stats/dashboard',
        );
        return result.stats;
      },
    },
  };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new AppError(ERROR_CODES.UNKNOWN, 'Unable to read the selected file.'));
    reader.readAsDataURL(blob);
  });
}
