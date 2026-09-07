import type { Gender } from './types';
import { RELATION_OPTIONS } from './types';

/** Boy avatars AV1–AV50, girl avatars AV51–AV100 (avatars/id folder). */
const BOY_AVATAR_IDS = Array.from({ length: 50 }, (_, i) => `AV${i + 1}`);
const GIRL_AVATAR_IDS = Array.from({ length: 50 }, (_, i) => `AV${i + 51}`);
const ALL_AVATAR_IDS = [...BOY_AVATAR_IDS, ...GIRL_AVATAR_IDS];

export function hashName(value: string): number {
  let hash = 0;
  const normalized = value.trim().toLowerCase();
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Gender picks boy/girl pool; without gender uses all avatars from name hash. */
export function pickAvatarId(fullName: string, gender?: Gender | null): string {
  const pool =
    gender === 'female' ? GIRL_AVATAR_IDS : gender === 'male' ? BOY_AVATAR_IDS : ALL_AVATAR_IDS;
  return pool[hashName(fullName || 'user') % pool.length] ?? 'AV1';
}

/** Relative path stored in DB / served by API static route. */
export function avatarPath(avatarId: string): string {
  return `/avatars/${avatarId}.png`;
}

export function resolveProfilePhotoUrl(
  user: {
    photoURL: string | null;
    avatarId: string | null;
    photoManual: boolean;
  },
  apiBaseUrl?: string,
): string | null {
  if (user.photoManual && user.photoURL) return user.photoURL;

  const relative =
    user.avatarId
      ? avatarPath(user.avatarId)
      : user.photoURL?.startsWith('/avatars/')
        ? user.photoURL
        : null;

  if (relative) {
    if (apiBaseUrl) return `${apiBaseUrl.replace(/\/$/, '')}${relative}`;
    return relative;
  }

  return user.photoURL;
}

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  const firstName = parts[0] ?? '';
  if (parts.length === 1) return { firstName, lastName: '' };
  return { firstName, lastName: parts.slice(1).join(' ') };
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '').trim();
}

export function displayRelation(relation: string | null | undefined): string {
  if (!relation) return '';
  const found = RELATION_OPTIONS.find((option) => option.value === relation);
  if (found) return found.label;
  return relation;
}
