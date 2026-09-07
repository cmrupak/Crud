import { MESSAGES } from '../../constants';
import { AppError, ERROR_CODES } from '../../errors';
import type { ProfileUpdateInput, UserProfile } from '../../types';
import { validateProfile } from '../../validation';
import { avatarPath, pickAvatarId } from '../../avatar';
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
        const firstName = input.firstName.trim();
        const lastName = input.lastName.trim();
        const gender =
          input.gender === 'male' || input.gender === 'female' ? input.gender : user.gender;
        const relationRaw = typeof input.relation === 'string' ? input.relation.trim() : user.relation;
        const relation =
          relationRaw === 'other'
            ? String(input.relationOther ?? '').trim() || user.relation
            : relationRaw;
        const next = {
          ...user,
          firstName,
          lastName,
          gender,
          relation,
          updatedAt: nowIso(),
        };
        if (!user.photoManual && gender) {
          const avatarId = pickAvatarId(`${firstName} ${lastName}`.trim(), gender);
          next.avatarId = avatarId;
          next.photoURL = avatarPath(avatarId);
        }
        updated = next;
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
