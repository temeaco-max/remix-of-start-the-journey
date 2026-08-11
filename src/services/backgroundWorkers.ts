/**
 * Lightweight in-process workers for single-instance launch.
 * Disable with KURUKOO_WORKERS=0. Intervals are env-tunable.
 */
import { runOrchestrationPass } from './tradeEngine.js';
import {
  expireDeferredIntentions,
  getDueIntentions,
  incrementAttempt,
  resolveOpenIntention,
  markPartiallyMatched,
} from './deferredRequestService.js';
import {
  ensureLivingMemorySchema,
  runDailyMemoryDecay,
  runWeeklyMemoryPrune,
  runMemoryCrystallize,
} from './livingMemoryEngine.js';
import { purgeExpiredData } from '../database.js';
import { find_worker } from './find-worker.js';
import { sendFcmPush } from './pushNotifications.js';

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

/**
 * Re-check deferred open intentions that are due (Blueprint §4.1.3).
 * On match: resolve intention, notify user via FCM, leave economic_request
 * progression to orchestration / storefront when the user returns.
 */
async function processDueDeferred(): Promise<{ checked: number; matched: number; notified: number }> {
  const due = await getDueIntentions(50);
  let matched = 0;
  let notified = 0;

  for (const intention of due) {
    const phone = String(intention.phone || '');
    const skill = String(intention.skill || intention.intent || '').trim();
    if (!phone || !skill) {
      await incrementAttempt(phone || 'unknown', intention.id);
      continue;
    }

    const match = await find_worker({
      skill,
      location: intention.location ? String(intention.location) : undefined,
      max: 3,
    });

    if (match.count > 0) {
      matched += 1;
      const top = match.providers[0];
      const note = `Matched ${top.name} (${Number(top.rating || 0).toFixed(1)}★) on deferred re-check`;
      await resolveOpenIntention(
        phone,
        intention.id,
        'provider_matched',
        note,
        `Open chat and continue with ${skill}`
      ).catch(async () => {
        await markPartiallyMatched(phone, intention.id, note).catch(() => null);
      });

      const pushed = await sendFcmPush(
        phone,
        'Kurukoo found a match',
        `A provider is available for “${skill}”. Open the app or WhatsApp to continue.`,
        undefined
      ).catch(() => false);
      if (pushed) notified += 1;
    } else {
      await incrementAttempt(phone, intention.id);
    }
  }

  return { checked: due.length, matched, notified };
}

export function startBackgroundWorkers(): void {
  if (started) return;
  if (process.env.KURUKOO_WORKERS === '0' || process.env.KURUKOO_WORKERS === 'false') {
    console.log('[Workers] Disabled via KURUKOO_WORKERS');
    return;
  }
  started = true;

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

  // Deferred intentions + expire pass
  timers.push(
    setInterval(() => {
      void safe('deferred', async () => {
        const r = await processDueDeferred();
        await expireDeferredIntentions();
        if (r.checked || r.matched) {
          console.log(
            `[Worker:deferred] checked=${r.checked} matched=${r.matched} notified=${r.notified}`
          );
        }
      });
    }, deferredMs)
  );

  // Memory lifecycle
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
