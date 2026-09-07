import { MESSAGES } from '../../constants';
import { AppError, ERROR_CODES } from '../../errors';
import type { ProfileUpdateInput, UserProfile } from '../../types';
import { validateProfile } from '../../validation';
import { nowIso } from '../../utils';
import type { UserService } from '../types';
import type { LocalDatabase } from './database';

export function createLocalUserService(db: LocalDatabase): UserService {
  return {
    async getById(uid: string): Promise<UserProfile> {
      const session = await db.requireSession();
      if (session.profile.uid !== uid && session.profile.role !== 'admin') {
        throw new AppError(ERROR_CODES.FORBIDDEN, 'You cannot view this profile.');
      }
      const store = await db.load();
      const user = store.users[uid];
      if (!user) throw new AppError(ERROR_CODES.NOT_FOUND, 'User was not found.');
      return user;
    },

    async updateProfile(uid: string, input: ProfileUpdateInput): Promise<UserProfile> {
      const session = await db.requireSession();
      if (session.profile.uid !== uid) {
        throw new AppError(ERROR_CODES.FORBIDDEN, 'You can only update your own profile.');
      }
      const validation = validateProfile(input);
      if (!validation.valid) {
        throw new AppError(ERROR_CODES.VALIDATION, 'Please fix the highlighted fields.', validation.errors);
      }
      let updated: UserProfile | null = null;
      await db.update((data) => {
        const user = data.users[uid];
        if (!user) throw new AppError(ERROR_CODES.NOT_FOUND, 'User was not found.');
        updated = {
          ...user,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          updatedAt: nowIso(),
        };
        data.users[uid] = updated;
        if (data.session) data.session.profile = updated;
      });
      await db.writeAudit({
        action: 'USER_UPDATED',
        performedBy: uid,
        targetUser: uid,
      });
      return updated!;
    },

    async deactivateSelf(): Promise<void> {
      const session = await db.requireSession();
      await db.update((data) => {
        const user = data.users[session.profile.uid];
        if (!user) return;
        data.users[session.profile.uid] = {
          ...user,
          status: 'inactive',
          deactivatedAt: nowIso(),
          updatedAt: nowIso(),
        };
        data.session = null;
      });
      await db.writeAudit({
        action: 'USER_DEACTIVATED',
        performedBy: session.profile.uid,
        targetUser: session.profile.uid,
      });
    },
  };
}

export { MESSAGES };
