import { createApp } from './app.ts';
import { databaseLabel } from './db.ts';

const port = Number(process.env.PORT ?? 8787);

async function main() {
  const app = await createApp({ serveAvatars: true });
  app.listen(port, '0.0.0.0', () => {
    console.log(`CRUD API (${databaseLabel()}) listening on http://0.0.0.0:${port}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
