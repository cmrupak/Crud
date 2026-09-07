export type UserRole = 'admin' | 'user';
export type AccountStatus = 'active' | 'inactive';
export type RecordStatus = 'active' | 'inactive';
export type DataSource = 'local' | 'api';
export type Gender = 'male' | 'female';

export const RELATION_OPTIONS = [
  { value: 'cousin', label: 'Cousin' },
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'office_colleague', label: 'Office colleague' },
  { value: 'friend', label: 'Friend' },
  { value: 'neighbor', label: 'Neighbor' },
  { value: 'other', label: 'Other' },
] as const;

export type RelationValue = (typeof RELATION_OPTIONS)[number]['value'];

export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: AccountStatus;
  gender: Gender | null;
  relation: string | null;
  photoURL: string | null;
  avatarId: string | null;
  photoManual: boolean;
  profileSetupComplete: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  deactivatedAt?: string | null;
}

export interface LoginCandidate {
  uid: string;
  fullName: string;
  email: string;
  phone: string | null;
  photoURL: string | null;
  avatarId: string | null;
}

export interface IdentifyInput {
  email?: string;
  name?: string;
  phone?: string;
}

export type IdentifyResult =
  | { status: 'authenticated'; token: string; user: UserProfile }
  | { status: 'candidates'; candidates: LoginCandidate[] }
  | { status: 'not_found'; message: string };

export interface RecordItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: RecordStatus;
  deleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AuditAction =
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_ACTIVATED'
  | 'USER_DEACTIVATED'
  | 'ROLE_CHANGED'
  | 'RECORD_CREATED'
  | 'RECORD_UPDATED'
  | 'RECORD_DELETED';

export interface AuditLog {
  id: string;
  action: AuditAction;
  performedBy: string;
  targetUser?: string;
  targetRecord?: string;
  metadata?: Record<string, string>;
  createdAt: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
}

/** @deprecated password login retained for legacy local demos */
export interface LoginInput {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RecordInput {
  title: string;
  description: string;
  status: RecordStatus;
}

export interface ProfileUpdateInput {
  firstName: string;
  lastName: string;
}

export interface ProfileSetupInput {
  fullName: string;
  email: string;
  gender: Gender;
  relation: string;
  relationOther?: string;
  photoURL?: string | null;
  skip?: boolean;
}

export interface ListQuery {
  search?: string;
  status?: AccountStatus | RecordStatus | 'all';
  role?: UserRole | 'all';
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  includeDeleted?: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardStats {
  totalRecords: number;
  activeRecords: number;
  inactiveRecords: number;
  totalUsers?: number;
  activeUsers?: number;
  inactiveUsers?: number;
}

export interface SessionUser {
  profile: UserProfile;
  rememberMe: boolean;
}
