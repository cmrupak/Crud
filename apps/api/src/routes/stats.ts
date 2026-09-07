import { Router } from 'express';
import { asyncHandler, requireAuth, type AuthedRequest } from '../middleware.ts';
import { db } from '../db.ts';

export const statsRouter = Router();

statsRouter.get(
  '/dashboard',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const isAdmin = req.user!.role === 'admin';
    const records = isAdmin
      ? await db.execute(`SELECT status FROM records WHERE deleted = 0`)
      : await db.execute({
          sql: `SELECT status FROM records WHERE deleted = 0 AND user_id = ?`,
          args: [req.user!.uid],
        });

    const statuses = records.rows.map((row) => String(row.status));
    const stats = {
      totalRecords: statuses.length,
      activeRecords: statuses.filter((status) => status === 'active').length,
      inactiveRecords: statuses.filter((status) => status === 'inactive').length,
    };

    if (!isAdmin) {
      res.json({ stats });
      return;
    }

    const users = await db.execute(`SELECT status FROM users`);
    const userStatuses = users.rows.map((row) => String(row.status));
    res.json({
      stats: {
        ...stats,
        totalUsers: userStatuses.length,
        activeUsers: userStatuses.filter((status) => status === 'active').length,
        inactiveUsers: userStatuses.filter((status) => status === 'inactive').length,
      },
    });
  }),
);
