/**
 * Lightweight in-process workers for single-instance launch.
 * Disable with KURUKOO_WORKERS=0. Intervals are env-tunable.
 */
import { runOrchestrationPass } from './tradeEngine.js';
import { expireDeferredIntentions, getDueIntentions, incrementAttempt } from './deferredRequestService.js';
import {
  ensureLivingMemorySchema,
  runDailyMemoryDecay,
  runWeeklyMemoryPrune,
  runMemoryCrystallize,
} from './livingMemoryEngine.js';
import { purgeExpiredData } from '../database.js';
import { find_worker } from './find-worker.js';
import { transitionEconomicRequest, getEconomicRequest } from './skillFlows.js';

let started = false;
const timers: NodeJS.Timeout[] = [];

function ms(envKey: string, fallbackMinutes: number): number {
  const raw = process.env[envKey];
  if (raw && Number.isFinite(Number(raw))) return Math.max(15_000, Number(raw) * 1000);
  return fallbackMinutes * 60 * 1000;
}

async function safe(label: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
  } catch (e) {
    console.error(`[Worker:${label}]`, e);
  }
}

/** Re-check deferred open intentions that are due. */
async function processDueDeferred(): Promise<void> {
  const due = await getDueIntentions(50);
  for (const intention of due) {
    const skill = String(intention.skill || intention.intent || '').trim();
    if (!skill) {
      await incrementAttempt(String(intention.phone), intention.id);
      continue;
    }
    const match = await find_worker({
      skill,
      location: intention.location || undefined,
      max: 3,
    });
    if (match.count > 0) {
      // Leave status transitions to orchestration when an economic request exists;
      // here we only bump attempt / next_check so the deferred worker stays healthy.
      await incrementAttempt(String(intention.phone), intention.id);
    } else {
      await incrementAttempt(String(intention.phone), intention.id);
    }
  }
}

export function startBackgroundWorkers(): void {
  if (started) return;
  if (process.env.KURUKOO_WORKERS === '0' || process.env.KURUKOO_WORKERS === 'false') {
    console.log('[Workers] Disabled via KURUKOO_WORKERS');
    return;
  }
  started = true;

  const orchestrationEvery = ms('KURUKOO_ORCHESTRATION_INTERVAL_SEC', 5); // default 5 min as seconds override? use minutes helper differently
  // Prefer second-based envs for finer control
  const orchMs = process.env.KURUKOO_ORCHESTRATION_INTERVAL_SEC
    ? Math.max(30_000, Number(process.env.KURUKOO_ORCHESTRATION_INTERVAL_SEC) * 1000)
    : 5 * 60 * 1000;
  const deferredMs = process.env.KURUKOO_DEFERRED_INTERVAL_SEC
    ? Math.max(60_000, Number(process.env.KURUKOO_DEFERRED_INTERVAL_SEC) * 1000)
    : 2 * 60 * 60 * 1000; // 2h
  const memoryMs = process.env.KURUKOO_MEMORY_INTERVAL_SEC
    ? Math.max(300_000, Number(process.env.KURUKOO_MEMORY_INTERVAL_SEC) * 1000)
    : 24 * 60 * 60 * 1000; // daily
  const purgeMs = process.env.KURUKOO_PURGE_INTERVAL_SEC
    ? Math.max(300_000, Number(process.env.KURUKOO_PURGE_INTERVAL_SEC) * 1000)
    : 24 * 60 * 60 * 1000;

  // Orchestration: match + quote + escrow release
  timers.push(
    setInterval(() => {
      void safe('orchestration', async () => {
        const result = await runOrchestrationPass();
        if (result.matched || result.quoted || result.released) {
          console.log(
            `[Worker:orchestration] matched=${result.matched} quoted=${result.quoted} released=${result.released} failed=${result.failed}`
          );
        }
      });
    }, orchMs)
  );

  // Deferred intentions + nightly expire
  timers.push(
    setInterval(() => {
      void safe('deferred', async () => {
        await processDueDeferred();
        await expireDeferredIntentions();
      });
    }, deferredMs)
  );

  // Memory lifecycle (decay daily; prune+crystallize on same cadence for launch simplicity)
  timers.push(
    setInterval(() => {
      void safe('memory', async () => {
        await ensureLivingMemorySchema();
        const decay = await runDailyMemoryDecay();
        const prune = await runWeeklyMemoryPrune();
        const crystallize = await runMemoryCrystallize();
        console.log(
          `[Worker:memory] decay=${decay.updated} prune=${prune.deleted} crystallize=${crystallize.promoted}`
        );
      });
    }, memoryMs)
  );

  // Data retention purge
  timers.push(
    setInterval(() => {
      void safe('purge', async () => {
        const r = await purgeExpiredData();
        console.log(
          `[Worker:purge] messages=${r.messagesDeleted} sessions=${r.tempSessionsDeleted} pulse=${r.pulseLocationsDeleted}`
        );
      });
    }, purgeMs)
  );

  for (const t of timers) t.unref?.();

  // Kick once shortly after boot (non-blocking)
  setTimeout(() => {
    void safe('orchestration:boot', () => runOrchestrationPass());
    void safe('memory:boot', async () => {
      await ensureLivingMemorySchema();
    });
  }, 15_000).unref?.();

  console.log(
    `[Workers] Started orchestration=${Math.round(orchMs / 1000)}s deferred=${Math.round(deferredMs / 1000)}s memory=${Math.round(memoryMs / 1000)}s purge=${Math.round(purgeMs / 1000)}s`
  );
}

export function stopBackgroundWorkers(): void {
  for (const t of timers) clearInterval(t);
  timers.length = 0;
  started = false;
}
