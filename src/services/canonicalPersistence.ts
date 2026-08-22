export type CanonicalPersistenceMode = 'sqljs' | 'postgres';

export interface CanonicalPersistenceStatus {
  mode: CanonicalPersistenceMode;
  owner: 'kurukoo-persistence';
  applicationAdapterReady: boolean;
  durableSharedState: boolean;
  concurrentWriterSafe: boolean;
  note: string;
}

// An environment flag must never be able to claim that the asynchronous
// PostgreSQL migration is complete while routes still open SQL.js directly.
const POSTGRES_APPLICATION_CALL_SURFACE_MIGRATED = false;

export function getCanonicalPersistenceMode(env: NodeJS.ProcessEnv = process.env): CanonicalPersistenceMode {
  return String(env.KURUKOO_DATABASE_MODE || 'sqljs').trim().toLowerCase() === 'postgres' ? 'postgres' : 'sqljs';
}

/**
 * The semantic owner is always `kurukoo-persistence`; the selected backend is
 * an implementation detail. This helper intentionally does not dual-write.
 */
export function getCanonicalPersistenceStatus(env: NodeJS.ProcessEnv = process.env): CanonicalPersistenceStatus {
  const mode = getCanonicalPersistenceMode(env);
  const applicationAdapterReady = mode === 'sqljs' || POSTGRES_APPLICATION_CALL_SURFACE_MIGRATED;
  return mode === 'postgres'
    ? {
        mode,
        owner: 'kurukoo-persistence',
        applicationAdapterReady,
        durableSharedState: applicationAdapterReady,
        concurrentWriterSafe: applicationAdapterReady,
        note: applicationAdapterReady
          ? 'PostgreSQL is the sole canonical persistence owner.'
          : 'PostgreSQL backend and migration tooling exist, but the application retains direct synchronous SQL.js calls; startup must remain blocked until the call surface is migrated and reviewed.',
      }
    : {
        mode,
        owner: 'kurukoo-persistence',
        applicationAdapterReady: true,
        durableSharedState: false,
        concurrentWriterSafe: false,
        note: 'SQL.js is the lightweight single-process canonical persistence owner.',
      };
}

export function assertCanonicalPersistenceModeSafe(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV !== 'production') return;
  const status = getCanonicalPersistenceStatus(env);
  if (status.mode === 'postgres' && !status.applicationAdapterReady) {
    throw new Error('[Kurukoo Persistence] PostgreSQL mode is selected but the application persistence surface is not yet migrated to the async canonical adapter. Keep PostgreSQL mode blocked until cutover integration is complete.');
  }
}
