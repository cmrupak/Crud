import serverless from 'serverless-http';
import { createApp } from '../../apps/api/src/app.ts';

type ServerlessHandler = ReturnType<typeof serverless>;

let cached: ServerlessHandler | null = null;

async function getServerlessHandler(): Promise<ServerlessHandler> {
  if (cached) return cached;
  const app = await createApp({ serveAvatars: false });
  cached = serverless(app);
  return cached;
}

export async function handler(event: unknown, context: unknown) {
  const run = await getServerlessHandler();
  return run(event as never, context as never);
}
