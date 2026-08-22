import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

type Sql = any;
type PostgresFactory = (connectionString: string, options?: Record<string, unknown>) => Sql;

export interface PostgresPersistenceConfig {
  connectionString: string;
  maxConnections?: number;
  idleTimeoutSeconds?: number;
  connectTimeoutSeconds?: number;
  ssl?: boolean;
}

/**
 * Canonical PostgreSQL persistence boundary.
 *
 * Exactly one persistence owner is active at a time. PostgreSQL mode never
 * mirrors writes into SQL.js. The current application surface is synchronous
 * (db.run/db.exec/db.prepare), so this adapter deliberately exposes only an
 * asynchronous API; attempting to use PostgreSQL mode before the application
 * surface is migrated is blocked rather than emulated unsafely.
 */
export class PostgresPersistence {
  readonly sql: Sql;

  constructor(config: PostgresPersistenceConfig, factory: PostgresFactory = loadPostgres()) {
    if (!config.connectionString) throw new Error('DATABASE_URL is required for PostgreSQL persistence.');
    this.sql = factory(config.connectionString, {
      max: Math.max(1, Math.min(20, Math.floor(config.maxConnections ?? 5))),
      idle_timeout: Math.max(1, Math.floor(config.idleTimeoutSeconds ?? 30)),
      connect_timeout: Math.max(1, Math.floor(config.connectTimeoutSeconds ?? 5)),
      ssl: config.ssl ? 'require' : false,
    });
  }

  async ping(): Promise<void> {
    await this.sql`SELECT 1`;
  }

  async transaction<T>(fn: (tx: Sql) => Promise<T>): Promise<T> {
    return this.sql.begin(async (tx: Sql) => fn(tx));
  }

  async close(): Promise<void> {
    await this.sql.end({ timeout: 5 });
  }
}

function loadPostgres(): PostgresFactory {
  try {
    const module = require('postgres') as { default?: PostgresFactory } | PostgresFactory;
    return (typeof module === 'function' ? module : module.default) as PostgresFactory;
  } catch {
    throw new Error('PostgreSQL adapter dependency is not installed. Install the pinned postgres client before enabling PostgreSQL mode.');
  }
}

export function isPostgresClientInstalled(): boolean {
  try {
    loadPostgres();
    return true;
  } catch {
    return false;
  }
}

export function createPostgresPersistence(env: NodeJS.ProcessEnv = process.env): PostgresPersistence {
  const connectionString = String(env.DATABASE_URL || env.POSTGRES_URL || '').trim();
  if (!connectionString) throw new Error('DATABASE_URL must be configured for PostgreSQL persistence.');
  return new PostgresPersistence({
    connectionString,
    maxConnections: Number(env.KURUKOO_POSTGRES_POOL_MAX || 5),
    idleTimeoutSeconds: Number(env.KURUKOO_POSTGRES_IDLE_TIMEOUT_SECONDS || 30),
    connectTimeoutSeconds: Number(env.KURUKOO_POSTGRES_CONNECT_TIMEOUT_SECONDS || 5),
    ssl: String(env.KURUKOO_POSTGRES_SSL || 'true').toLowerCase() !== 'false',
  });
}
