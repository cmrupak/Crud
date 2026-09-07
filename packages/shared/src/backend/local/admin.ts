import { DEFAULT_PAGE_SIZE } from '../../constants';
import { AppError, ERROR_CODES } from '../../errors';
import type { ListQuery, PaginatedResult, ProfileUpdateInput, UserProfile, UserRole } from '../../types';
import { validateProfile } from '../../validation';
import { matchesSearch, nowIso, paginate } from '../../utils';
import type { AdminService } from '../types';
import type { LocalDatabase } from './database';

export function createLocalAdminService(db: LocalDatabase): AdminService {
  return {
    async listUsers(query?: ListQuery): Promise<PaginatedResult<UserProfile>> {
      await db.requireAdmin();
      const store = await db.load();
      let items = Object.values(store.users);
      if (query?.status && query.status !== 'all') {
        items = items.filter((user) => user.status === query.status);
      }
      if (query?.role && query.role !== 'all') {
        items = items.filter((user) => user.role === query.role);
      }
      items = items.filter((user) =>
        matchesSearch(`${user.firstName} ${user.lastName} ${user.email}`, query?.search),
      );
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return paginate(items, query?.page ?? 1, query?.pageSize ?? DEFAULT_PAGE_SIZE);
    },

    async getUser(uid: string): Promise<UserProfile> {
      await db.requireAdmin();
      const store = await db.load();
      const user = store.users[uid];
      if (!user) throw new AppError(ERROR_CODES.NOT_FOUND, 'User was not found.');
      return user;
    },

    async updateUser(
      uid: string,
      input: ProfileUpdateInput & { role?: UserRole },
    ): Promise<UserProfile> {
      const session = await db.requireAdmin();
      const validation = validateProfile(input);
      if (!validation.valid) {
        throw new AppError(ERROR_CODES.VALIDATION, 'Please fix the highlighted fields.', validation.errors);
      }
      if (input.role && uid === session.profile.uid) {
        throw new AppError(ERROR_CODES.FORBIDDEN, 'You cannot change your own role.');
      }
      let updated: UserProfile | null = null;
      await db.update((data) => {
        const user = data.users[uid];
        if (!user) throw new AppError(ERROR_CODES.NOT_FOUND, 'User was not found.');
        updated = {
          ...user,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          role: input.role ?? user.role,
          updatedAt: nowIso(),
        };
        data.users[uid] = updated;
      });
      await db.writeAudit({
        action: 'USER_UPDATED',
        performedBy: session.profile.uid,
        targetUser: uid,
      });
      if (input.role) {
        await db.writeAudit({
          action: 'ROLE_CHANGED',
          performedBy: session.profile.uid,
          targetUser: uid,
          metadata: { role: input.role },
        });
      }
      return updated!;
    },

    async activateUser(uid: string): Promise<UserProfile> {
      const session = await db.requireAdmin();
      let updated: UserProfile | null = null;
      await db.update((data) => {
        const user = data.users[uid];
        if (!user) throw new AppError(ERROR_CODES.NOT_FOUND, 'User was not found.');
        updated = {
          ...user,
          status: 'active',
          deactivatedAt: null,
          updatedAt: nowIso(),
        };
        data.users[uid] = updated;
      });
      await db.writeAudit({
        action: 'USER_ACTIVATED',
        performedBy: session.profile.uid,
        targetUser: uid,
      });
      return updated!;
    },

    async deactivateUser(uid: string): Promise<UserProfile> {
      const session = await db.requireAdmin();
      if (uid === session.profile.uid) {
        throw new AppError(ERROR_CODES.FORBIDDEN, 'You cannot deactivate your own admin account here.');
      }
      let updated: UserProfile | null = null;
      await db.update((data) => {
        const user = data.users[uid];
        if (!user) throw new AppError(ERROR_CODES.NOT_FOUND, 'User was not found.');
        updated = {
          ...user,
          status: 'inactive',
          deactivatedAt: nowIso(),
          updatedAt: nowIso(),
        };
        data.users[uid] = updated;
      });
      await db.writeAudit({
        action: 'USER_DEACTIVATED',
        performedBy: session.profile.uid,
        targetUser: uid,
      });
      return updated!;
    },

    async changeRole(uid: string, role: UserRole): Promise<UserProfile> {
      const session = await db.requireAdmin();
      if (uid === session.profile.uid) {
        throw new AppError(ERROR_CODES.FORBIDDEN, 'You cannot change your own role.');
      }
      let updated: UserProfile | null = null;
      await db.update((data) => {
        const user = data.users[uid];
        if (!user) throw new AppError(ERROR_CODES.NOT_FOUND, 'User was not found.');
        updated = { ...user, role, updatedAt: nowIso() };
        data.users[uid] = updated;
      });
      await db.writeAudit({
        action: 'ROLE_CHANGED',
        performedBy: session.profile.uid,
        targetUser: uid,
        metadata: { role },
      });
      return updated!;
    },
  };
}
