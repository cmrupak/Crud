import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

// ---------------------------------------------------------------------------
// Turso (kept for later server deploy — do not delete)
// ---------------------------------------------------------------------------
// import { createClient, type Client } from '@libsql/client';
// const tursoUrl = process.env.TURSO_DATABASE_URL;
// const tursoToken = process.env.TURSO_AUTH_TOKEN;
// if (!tursoUrl || !tursoToken) {
//   throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required');
// }
// export const db: Client = createClient({ url: tursoUrl, authToken: tursoToken });
// ---------------------------------------------------------------------------

const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, '../.env') });

type SqlInput = string | { sql: string; args?: unknown[] };

export type DbResult = {
  rows: Record<string, unknown>[];
};

export type DbClient = {
  execute(input: SqlInput): Promise<DbResult>;
  batch(
    statements: Array<{ sql: string; args?: unknown[] } | string>,
    _mode?: string,
  ): Promise<void>;
};

function toPgParams(sql: string): string {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function normalize(input: SqlInput): { sql: string; args: unknown[] } {
  if (typeof input === 'string') return { sql: input, args: [] };
  return { sql: input.sql, args: input.args ?? [] };
}

function createPostgresClient(): DbClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is required for local Postgres. Example: postgresql://postgres:PASSWORD@localhost:5432/nexora',
    );
  }

  const pool = new pg.Pool({ connectionString });

  return {
    async execute(input) {
      const { sql, args } = normalize(input);
      const result = await pool.query(toPgParams(sql), args);
      return { rows: result.rows as Record<string, unknown>[] };
    },
    async batch(statements) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (const statement of statements) {
          const { sql, args } = normalize(statement);
          await client.query(toPgParams(sql), args);
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
  };
}

/** Active driver: local Postgres. Switch to Turso later by restoring the block above. */
export const db: DbClient = createPostgresClient();

export function nowIso(): string {
  return new Date().toISOString();
}

export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
}
