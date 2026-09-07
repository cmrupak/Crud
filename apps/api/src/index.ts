import cors from 'cors';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMigrations } from './auth.ts';
import { sendError } from './middleware.ts';
import { adminRouter } from './routes/admin.ts';
import { authRouter } from './routes/auth.ts';
import { recordsRouter } from './routes/records.ts';
import { statsRouter } from './routes/stats.ts';
import { usersRouter } from './routes/users.ts';

const port = Number(process.env.PORT ?? 8787);
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const here = dirname(fileURLToPath(import.meta.url));
const avatarsDir = resolve(here, '../../../avatars/id');

async function main() {
  await runMigrations();

  const app = express();
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
  app.use('/avatars', express.static(avatarsDir));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, database: 'postgres', mode: 'local' });
  });

  app.use('/auth', authRouter);
  app.use('/users', usersRouter);
  app.use('/records', recordsRouter);
  app.use('/admin', adminRouter);
  app.use('/stats', statsRouter);

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    sendError(res, error);
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`CRUD API (Postgres) listening on http://0.0.0.0:${port}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
