import { Router } from 'express';
import { AppError, ERROR_CODES, validateProfile } from '@nexora/shared';
import { getUserByUid, writeAudit } from '../auth.ts';
import { db, nowIso } from '../db.ts';
import { asyncHandler, requireAuth, type AuthedRequest } from '../middleware.ts';

export const usersRouter = Router();

usersRouter.get(
  '/:uid',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const uid = String(req.params.uid);
    if (req.user!.uid !== uid && req.user!.role !== 'admin') {
      throw new AppError(ERROR_CODES.FORBIDDEN, 'You cannot view this profile.');
    }
    const user = await getUserByUid(uid);
    if (!user) throw new AppError(ERROR_CODES.NOT_FOUND, 'User was not found.');
    res.json({ user });
  }),
);

usersRouter.patch(
  '/:uid',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const uid = String(req.params.uid);
    if (req.user!.uid !== uid) {
      throw new AppError(ERROR_CODES.FORBIDDEN, 'You can only update your own profile.');
    }
    const validation = validateProfile(req.body);
    if (!validation.valid) {
      throw new AppError(ERROR_CODES.VALIDATION, 'Please fix the highlighted fields.', validation.errors);
    }
    await db.execute({
      sql: 'UPDATE users SET first_name = ?, last_name = ?, updated_at = ? WHERE uid = ?',
      args: [req.body.firstName.trim(), req.body.lastName.trim(), nowIso(), uid],
    });
    await writeAudit({ action: 'USER_UPDATED', performedBy: uid, targetUser: uid });
    res.json({ user: await getUserByUid(uid) });
  }),
);

usersRouter.post(
  '/me/deactivate',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const uid = req.user!.uid;
    const now = nowIso();
    await db.execute({
      sql: `UPDATE users SET status = 'inactive', deactivated_at = ?, updated_at = ? WHERE uid = ?`,
      args: [now, now, uid],
    });
    await writeAudit({ action: 'USER_DEACTIVATED', performedBy: uid, targetUser: uid });
    res.json({ ok: true });
  }),
);

usersRouter.post(
  '/me/photo',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const photoURL = String(req.body.photoURL ?? '');
    if (!photoURL.startsWith('data:image/')) {
      throw new AppError(ERROR_CODES.VALIDATION, 'Use a JPEG, PNG, or WebP image.');
    }
    if (photoURL.length > 2_800_000) {
      throw new AppError(ERROR_CODES.VALIDATION, 'Image must be 2 MB or smaller.');
    }
    await db.execute({
      sql: 'UPDATE users SET photo_url = ?, photo_manual = 1, updated_at = ? WHERE uid = ?',
      args: [photoURL, nowIso(), req.user!.uid],
    });
    res.json({ photoURL, user: await getUserByUid(req.user!.uid) });
  }),
);
