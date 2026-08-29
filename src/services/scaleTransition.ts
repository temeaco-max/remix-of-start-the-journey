/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
/**
 * Scale transition readiness signals.
 *
 * This module does not provision Postgres, Redis, or queues.
 * It reports when the current single-process SQL.js + process-local
 * limits are still appropriate, and when an approved multi-process
 * boundary is required before activation.
 */

export type ScaleReadinessState = 'READY' | 'PENDING' | 'REQUIRED' | 'NOT_CONFIGURED';

export interface ScaleReadinessItem {
  state: ScaleReadinessState;
  note: string;
}

export interface ScaleTransitionReport {
  generatedAt: string;
  persistence: ScaleReadinessItem;
  rateLimiting: ScaleReadinessItem;
  presence: ScaleReadinessItem;
  agentWorkers: ScaleReadinessItem;
  objectStorage: ScaleReadinessItem;
  recommendation: string;
}

function present(value: unknown): boolean {
  const text = String(value ?? '').trim().toLowerCase();
  return Boolean(text) && !text.startsWith('change_me') && text !== 'stub' && text !== 'unconfigured';
}

export function getScaleTransitionReport(env: NodeJS.ProcessEnv = process.env): ScaleTransitionReport {
  const workers = Number(env.KURUKOO_WORKERS || 1);
  const multiWorkerRequested = Number.isFinite(workers) && workers > 1;
  const postgresUrl = present(env.DATABASE_URL) || present(env.POSTGRES_URL) || present(env.PGHOST);
  const redisUrl = present(env.REDIS_URL) || present(env.REDIS_HOST);
  const objectStorage = present(env.S3_BUCKET) || present(env.GCS_BUCKET) || present(env.OBJECT_STORAGE_BUCKET) || present(env.AWS_S3_BUCKET);

  const persistence: ScaleReadinessItem = multiWorkerRequested
    ? postgresUrl
      ? { state: 'READY', note: 'Multi-worker mode is requested and a Postgres-style connection signal is present; runtime adapter activation still requires deployment validation.' }
      : { state: 'REQUIRED', note: `KURUKOO_WORKERS=${workers} requests multi-process writes, but no Postgres-style DATABASE_URL/POSTGRES_URL is configured. Keep one worker or provision an approved multi-process database boundary.` }
    : { state: 'READY', note: 'Single-worker SQL.js file persistence remains the intentional low-cost launch path.' };

  const rateLimiting: ScaleReadinessItem = multiWorkerRequested
    ? redisUrl
      ? { state: 'READY', note: 'Redis connection signal is present for distributed limiting; process-local buckets must not be assumed across replicas.' }
      : { state: 'REQUIRED', note: 'Multiple workers require shared rate-limit state (Redis or equivalent) before activation.' }
    : { state: 'READY', note: 'Process-local rate limits are appropriate for the single-instance launch model.' };

  const presence: ScaleReadinessItem = multiWorkerRequested
    ? redisUrl
      ? { state: 'PENDING', note: 'Shared presence coordination requires Redis/queue activation and field validation.' }
      : { state: 'REQUIRED', note: 'Distributed presence/Pulse coordination is not safe across multiple workers without shared state.' }
    : { state: 'READY', note: 'In-process presence is suitable for single-instance Nearby/Pulse.' };

  const agentWorkers: ScaleReadinessItem = process.env.KURUKOO_AGENT_ENABLED === 'true' && multiWorkerRequested
    ? redisUrl
      ? { state: 'PENDING', note: 'Agent goals need a shared lease/queue before horizontally scaled workers process due goals.' }
      : { state: 'REQUIRED', note: 'Bounded agent runtime must remain single-process until a shared lease/queue exists.' }
    : process.env.KURUKOO_AGENT_ENABLED === 'true'
      ? { state: 'READY', note: 'Agent runtime is constrained to the single-instance model.' }
      : { state: 'NOT_CONFIGURED', note: 'Agent runtime is disabled.' };

  const objectStorageItem: ScaleReadinessItem = objectStorage
    ? { state: 'PENDING', note: 'Object-storage bucket signal is present; malware scanning, signed URLs, and retention policy still require deployment validation.' }
    : { state: 'NOT_CONFIGURED', note: 'Local attachment directory remains the launch path; move to protected object storage before high-volume media.' };

  let recommendation = 'Remain on single-instance SQL.js until concurrent multi-instance writes, sustained marketplace traffic, or HA requirements appear.';
  if (multiWorkerRequested && (!postgresUrl || !redisUrl)) {
    recommendation = 'Do not activate multiple workers against SQL.js. Provision Postgres + Redis (or equivalent) first, or set KURUKOO_WORKERS=1.';
  } else if (multiWorkerRequested && postgresUrl && redisUrl) {
    recommendation = 'Multi-process signals are present. Validate adapters, migrations, leases, and failover before production traffic.';
  }

  return { generatedAt: new Date().toISOString(), persistence, rateLimiting, presence, agentWorkers, objectStorage: objectStorageItem, recommendation };
}
