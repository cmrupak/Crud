/** Embedded so Netlify functions do not depend on import.meta.url / filesystem paths. */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  uid TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  gender TEXT CHECK (gender IS NULL OR gender IN ('male', 'female')),
  relation TEXT,
  photo_url TEXT,
  avatar_id TEXT,
  photo_manual INTEGER NOT NULL DEFAULT 0,
  profile_setup_complete INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT,
  deactivated_at TEXT
);

CREATE TABLE IF NOT EXISTS accounts (
  email TEXT PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE REFERENCES users(uid) ON DELETE CASCADE,
  password_hash TEXT
);

CREATE TABLE IF NOT EXISTS password_resets (
  email TEXT PRIMARY KEY,
  allowed INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(uid),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  deleted INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  target_user TEXT,
  target_record TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_records_user ON records(user_id);
CREATE INDEX IF NOT EXISTS idx_records_deleted ON records(deleted);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`.trim();
