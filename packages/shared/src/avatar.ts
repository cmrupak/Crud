import type { Gender } from '../types';

/** Boy avatars AV1–AV50, girl avatars AV51–AV100 (avatars/id folder). */
const BOY_AVATAR_IDS = Array.from({ length: 50 }, (_, i) => `AV${i + 1}`);
const GIRL_AVATAR_IDS = Array.from({ length: 50 }, (_, i) => `AV${i + 51}`);

export function hashName(value: string): number {
  let hash = 0;
  const normalized = value.trim().toLowerCase();
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function pickAvatarId(fullName: string, gender: Gender): string {
  const pool = gender === 'female' ? GIRL_AVATAR_IDS : BOY_AVATAR_IDS;
  return pool[hashName(fullName) % pool.length];
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
  if (user.avatarId) {
    const path = avatarPath(user.avatarId);
    if (apiBaseUrl) return `${apiBaseUrl.replace(/\/$/, '')}${path}`;
    return path;
  }
  if (user.photoURL?.startsWith('/avatars/') && apiBaseUrl) {
    return `${apiBaseUrl.replace(/\/$/, '')}${user.photoURL}`;
  }
  return user.photoURL;
}

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '').trim();
}

export function displayRelation(relation: string | null | undefined): string {
  if (!relation) return '';
  const map: Record<string, string> = {
    cousin: 'Cousin',
    brother: 'Brother',
    sister: 'Sister',
    father: 'Father',
    mother: 'Mother',
    uncle: 'Uncle',
    aunt: 'Aunt',
    office_colleague: 'Office colleague',
    friend: 'Friend',
    neighbor: 'Neighbor',
  };
  return map[relation] ?? relation;
}
