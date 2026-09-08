import { config } from 'dotenv';
import { resolve } from 'node:path';
import pg from 'pg';

// ---------------------------------------------------------------------------
// Turso (kept for later — do not delete)
// ---------------------------------------------------------------------------
// import { createClient, type Client } from '@libsql/client';
// const tursoUrl = process.env.TURSO_DATABASE_URL;
// const tursoToken = process.env.TURSO_AUTH_TOKEN;
// if (!tursoUrl || !tursoToken) {
//   throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required');
// }
// export const db: Client = createClient({ url: tursoUrl, authToken: tursoToken });
// ---------------------------------------------------------------------------

// Load local .env when present. On Netlify, env vars come from the dashboard.
config({ path: resolve(process.cwd(), 'apps/api/.env') });
config({ path: resolve(process.cwd(), '.env') });
config();

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

function isRemotePostgres(connectionString: string): boolean {
  return /supabase\.(co|com)|pooler\.supabase|sslmode=require/i.test(connectionString);
}

function isServerlessRuntime(): boolean {
  return process.env.NETLIFY === 'true' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
}

function isTransientDbError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String((error as { code: unknown }).code) : '';
  const message = 'message' in error ? String((error as { message: unknown }).message) : '';
  return (
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNREFUSED' ||
    code === '57P01' ||
    code === '57P03' ||
    code === '53300' ||
    code === '08006' ||
    code === '08001' ||
    /timeout|terminat|connection|too many clients/i.test(message)
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createPostgresClient(): DbClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is required. Use your Supabase Postgres URI (Project Settings → Database).',
    );
  }

  const serverless = isServerlessRuntime();
  // Serverless must use a tiny pool or Supabase pooler connections get exhausted.
  const pool = new pg.Pool({
    connectionString,
    ssl: isRemotePostgres(connectionString) ? { rejectUnauthorized: false } : undefined,
    max: serverless ? 1 : 10,
    idleTimeoutMillis: serverless ? 1_000 : 30_000,
    connectionTimeoutMillis: 12_000,
    allowExitOnIdle: serverless,
  });

  async function withRetry<T>(run: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await run();
      } catch (error) {
        lastError = error;
        if (attempt < 3 && isTransientDbError(error)) {
          await sleep(200 * attempt);
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }

  return {
    async execute(input) {
      const { sql, args } = normalize(input);
      return withRetry(async () => {
        const result = await pool.query(toPgParams(sql), args);
        return { rows: result.rows as Record<string, unknown>[] };
      });
    },
    async batch(statements) {
      return withRetry(async () => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          for (const statement of statements) {
            const { sql, args } = normalize(statement);
            await client.query(toPgParams(sql), args);
          }
          await client.query('COMMIT');
        } catch (error) {
          try {
            await client.query('ROLLBACK');
          } catch {
            // ignore rollback errors
          }
          throw error;
        } finally {
          client.release();
        }
      });
    },
  };
}

/** Active driver: Postgres (local Laragon or Supabase). */
export const db: DbClient = createPostgresClient();

export function databaseLabel(): string {
  const url = process.env.DATABASE_URL ?? '';
  if (/supabase/i.test(url)) return 'supabase';
  if (process.env.TURSO_DATABASE_URL) return 'turso';
  return 'postgres';
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
}
