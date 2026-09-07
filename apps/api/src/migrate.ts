import { runMigrations } from './auth.ts';

runMigrations()
  .then(() => {
    console.log('Turso schema migrated and demo users seeded.');
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  });
