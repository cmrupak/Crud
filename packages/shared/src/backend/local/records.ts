import { DEFAULT_PAGE_SIZE } from '../../constants';
import { AppError, ERROR_CODES } from '../../errors';
import type { ListQuery, PaginatedResult, RecordInput, RecordItem } from '../../types';
import { validateRecord } from '../../validation';
import { createId, matchesSearch, nowIso, paginate } from '../../utils';
import type { RecordService } from '../types';
import type { LocalDatabase } from './database';

function sortRecords(items: RecordItem[], sortBy = 'createdAt', sortDir: 'asc' | 'desc' = 'desc') {
  const dir = sortDir === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    const left = String(a[sortBy as keyof RecordItem] ?? '');
    const right = String(b[sortBy as keyof RecordItem] ?? '');
    return left.localeCompare(right) * dir;
  });
}

function filterRecords(items: RecordItem[], query: ListQuery | undefined, userId?: string) {
  return items.filter((item) => {
    if (userId && item.userId !== userId) return false;
    if (!query?.includeDeleted && item.deleted) return false;
    if (query?.status && query.status !== 'all' && item.status !== query.status) return false;
    const haystack = `${item.title} ${item.description}`;
    return matchesSearch(haystack, query?.search);
  });
}

export function createLocalRecordService(db: LocalDatabase): RecordService {
  return {
    async create(input: RecordInput): Promise<RecordItem> {
      const session = await db.requireSession();
      const validation = validateRecord(input);
      if (!validation.valid) {
        throw new AppError(ERROR_CODES.VALIDATION, 'Please fix the highlighted fields.', validation.errors);
      }
      const now = nowIso();
      const record: RecordItem = {
        id: createId('rec'),
        userId: session.profile.uid,
        title: input.title.trim(),
        description: input.description.trim(),
        status: input.status,
        deleted: false,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      await db.update((data) => {
        data.records[record.id] = record;
      });
      await db.writeAudit({
        action: 'RECORD_CREATED',
        performedBy: session.profile.uid,
        targetRecord: record.id,
      });
      return record;
    },

    async getById(id: string): Promise<RecordItem> {
      const session = await db.requireSession();
      const store = await db.load();
      const record = store.records[id];
      if (!record || record.deleted) {
        throw new AppError(ERROR_CODES.NOT_FOUND, 'Record was not found.');
      }
      if (record.userId !== session.profile.uid && session.profile.role !== 'admin') {
        throw new AppError(ERROR_CODES.FORBIDDEN, 'You cannot view this record.');
      }
      return record;
    },

    async listMine(query?: ListQuery): Promise<PaginatedResult<RecordItem>> {
      const session = await db.requireSession();
      const store = await db.load();
      const filtered = sortRecords(
        filterRecords(Object.values(store.records), query, session.profile.uid),
        query?.sortBy,
        query?.sortDir,
      );
      return paginate(filtered, query?.page ?? 1, query?.pageSize ?? DEFAULT_PAGE_SIZE);
    },

    async listAll(query?: ListQuery): Promise<PaginatedResult<RecordItem>> {
      await db.requireAdmin();
      const store = await db.load();
      const filtered = sortRecords(
        filterRecords(Object.values(store.records), query),
        query?.sortBy,
        query?.sortDir,
      );
      return paginate(filtered, query?.page ?? 1, query?.pageSize ?? DEFAULT_PAGE_SIZE);
    },

    async update(id: string, input: RecordInput): Promise<RecordItem> {
      const session = await db.requireSession();
      const validation = validateRecord(input);
      if (!validation.valid) {
        throw new AppError(ERROR_CODES.VALIDATION, 'Please fix the highlighted fields.', validation.errors);
      }
      let updated: RecordItem | null = null;
      await db.update((data) => {
        const record = data.records[id];
        if (!record || record.deleted) {
          throw new AppError(ERROR_CODES.NOT_FOUND, 'Record was not found.');
        }
        if (record.userId !== session.profile.uid && session.profile.role !== 'admin') {
          throw new AppError(ERROR_CODES.FORBIDDEN, 'You cannot update this record.');
        }
        updated = {
          ...record,
          title: input.title.trim(),
          description: input.description.trim(),
          status: input.status,
          updatedAt: nowIso(),
        };
        data.records[id] = updated;
      });
      await db.writeAudit({
        action: 'RECORD_UPDATED',
        performedBy: session.profile.uid,
        targetRecord: id,
      });
      return updated!;
    },

    async softDelete(id: string): Promise<void> {
      const session = await db.requireSession();
      await db.update((data) => {
        const record = data.records[id];
        if (!record || record.deleted) {
          throw new AppError(ERROR_CODES.NOT_FOUND, 'Record was not found.');
        }
        if (record.userId !== session.profile.uid && session.profile.role !== 'admin') {
          throw new AppError(ERROR_CODES.FORBIDDEN, 'You cannot delete this record.');
        }
        data.records[id] = {
          ...record,
          deleted: true,
          deletedAt: nowIso(),
          updatedAt: nowIso(),
        };
      });
      await db.writeAudit({
        action: 'RECORD_DELETED',
        performedBy: session.profile.uid,
        targetRecord: id,
      });
    },
  };
}
