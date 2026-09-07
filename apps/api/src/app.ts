import cors from 'cors';
import express, { type Express } from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMigrations } from './auth.ts';
import { databaseLabel } from './db.ts';
import { sendError } from './middleware.ts';
import { adminRouter } from './routes/admin.ts';
import { authRouter } from './routes/auth.ts';
import { recordsRouter } from './routes/records.ts';
import { statsRouter } from './routes/stats.ts';
import { usersRouter } from './routes/users.ts';

const here = dirname(fileURLToPath(import.meta.url));
const avatarsDir = resolve(here, '../../../avatars/id');

export async function createApp(options?: { serveAvatars?: boolean }): Promise<Express> {
  await runMigrations();

  const app = express();
  const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true);
          return;
        }
        callback(null, allowedOrigins.includes(origin));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '3mb' }));

  if (options?.serveAvatars !== false) {
    app.use('/avatars', express.static(avatarsDir));
  }

  app.get('/health', (_req, res) => {
    res.json({ ok: true, database: databaseLabel(), mode: 'live' });
  });

  app.use('/auth', authRouter);
  app.use('/users', usersRouter);
  app.use('/records', recordsRouter);
  app.use('/admin', adminRouter);
  app.use('/stats', statsRouter);

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    sendError(res, error);
  });

  return app;
}
