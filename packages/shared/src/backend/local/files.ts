import { AppError, ERROR_CODES } from '../../errors';
import { validateImageFile } from '../../validation';
import { nowIso } from '../../utils';
import type { FileStorageService, StatsService } from '../types';
import type { LocalDatabase } from './database';

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new AppError(ERROR_CODES.UNKNOWN, 'Unable to read the selected file.'));
    reader.readAsDataURL(blob);
  });
}

export function createLocalFileService(db: LocalDatabase): FileStorageService {
  return {
    async uploadProfileImage(file: Blob, _fileName: string, contentType: string): Promise<string> {
      const session = await db.requireSession();
      const validation = validateImageFile({ type: contentType, size: file.size });
      if (!validation.valid) {
        throw new AppError(ERROR_CODES.VALIDATION, validation.errors.file ?? 'Invalid image.', validation.errors);
      }
      const photoURL = await blobToDataUrl(file);
      await db.update((data) => {
        const user = data.users[session.profile.uid];
        if (!user) return;
        const updated = { ...user, photoURL, updatedAt: nowIso() };
        data.users[session.profile.uid] = updated;
        if (data.session) data.session.profile = updated;
      });
      return photoURL;
    },
  };
}

export function createLocalStatsService(db: LocalDatabase): StatsService {
  return {
    async getDashboardStats() {
      const session = await db.requireSession();
      const store = await db.load();
      const visibleRecords = Object.values(store.records).filter((record) => {
        if (record.deleted) return false;
        if (session.profile.role === 'admin') return true;
        return record.userId === session.profile.uid;
      });

      const stats = {
        totalRecords: visibleRecords.length,
        activeRecords: visibleRecords.filter((record) => record.status === 'active').length,
        inactiveRecords: visibleRecords.filter((record) => record.status === 'inactive').length,
      };

      if (session.profile.role !== 'admin') return stats;

      const users = Object.values(store.users);
      return {
        ...stats,
        totalUsers: users.length,
        activeUsers: users.filter((user) => user.status === 'active').length,
        inactiveUsers: users.filter((user) => user.status === 'inactive').length,
      };
    },
  };
}
