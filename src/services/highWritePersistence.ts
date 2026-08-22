import { getCanonicalPersistenceMode, getCanonicalPersistenceStatus } from './canonicalPersistence.js';

export type HighWriteDomain = 'messages_conversations' | 'durable_jobs' | 'commercial_ledger';
export type HighWritePersistenceMode = 'sqljs_single_worker' | 'postgres_unactivated' | 'postgres_shared';
export interface HighWritePersistenceStatus {
  activeMode: HighWritePersistenceMode;
  domains: HighWriteDomain[];
  concurrentWriterSafe: boolean;
  postgresAdapter: 'not_configured' | 'configured_unactivated' | 'integrated';
  migrationPolicy: 'single-owner-no-dual-write';
  note: string;
}

function present(value: unknown) {
  const text = String(value ?? '').trim().toLowerCase();
  return Boolean(text) && !text.startsWith('change_me') && text !== 'stub' && text !== 'unconfigured';
}

function requestedWorkers() {
  const workers = Number(process.env.KURUKOO_WORKERS || 1);
  return Number.isFinite(workers) ? Math.max(1, Math.floor(workers)) : 1;
}

function postgresSignalled() {
  return present(process.env.DATABASE_URL) || present(process.env.POSTGRES_URL) || present(process.env.PGHOST);
}

export function getHighWritePersistenceStatus(): HighWritePersistenceStatus {
  const mode = getCanonicalPersistenceMode();
  const canonical = getCanonicalPersistenceStatus();
  const configured = postgresSignalled();
  if (mode === 'postgres' && canonical.applicationAdapterReady) {
    return {
      activeMode: 'postgres_shared',
      domains: ['messages_conversations', 'durable_jobs', 'commercial_ledger'],
      concurrentWriterSafe: true,
      postgresAdapter: 'integrated',
      migrationPolicy: 'single-owner-no-dual-write',
      note: configured
        ? 'PostgreSQL is the sole canonical shared persistence owner.'
        : 'PostgreSQL application integration is complete but no external connection is configured.',
    };
  }
  return {
    activeMode: 'sqljs_single_worker',
    domains: ['messages_conversations', 'durable_jobs', 'commercial_ledger'],
    concurrentWriterSafe: false,
    postgresAdapter: configured ? 'configured_unactivated' : 'not_configured',
    migrationPolicy: 'single-owner-no-dual-write',
    note: configured
      ? 'A PostgreSQL connection signal exists, but SQL.js remains the active owner until async application migration and cutover validation are completed.'
      : 'SQL.js is the active persistence owner. Keep KURUKOO_WORKERS=1 until PostgreSQL application integration and cutover validation are completed.',
  };
}

export function assertHighWritePersistence(domain: HighWriteDomain): void {
  const status = getHighWritePersistenceStatus();
  if (requestedWorkers() > 1 && !status.concurrentWriterSafe) {
    throw new Error(`Unsafe multi-worker write blocked for ${domain}: ${status.note}`);
  }
}
