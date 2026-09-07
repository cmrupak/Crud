import cors from 'cors';
import express, { type Express } from 'express';
import { resolve } from 'node:path';
import { runMigrations } from './auth.ts';
import { databaseLabel } from './db.ts';
import { sendError } from './middleware.ts';
import { adminRouter } from './routes/admin.ts';
import { authRouter } from './routes/auth.ts';
import { recordsRouter } from './routes/records.ts';
import { statsRouter } from './routes/stats.ts';
import { usersRouter } from './routes/users.ts';

export async function createApp(options?: { serveAvatars?: boolean }): Promise<Express> {
  await runMigrations();

  const app = express();
  const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  // Netlify function paths may include /.netlify/functions/api or /api prefixes
  app.use((req, _res, next) => {
    const prefixes = ['/.netlify/functions/api', '/api'];
    for (const prefix of prefixes) {
      if (req.url === prefix || req.url.startsWith(`${prefix}/`)) {
        req.url = req.url.slice(prefix.length) || '/';
        break;
      }
    }
    next();
  });

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
    const avatarsDir = resolve(process.cwd(), 'avatars/id');
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
