/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
/**
 * Execution Audit Service — user-facing audit trail timeline.
 * Reads from existing coordinatorEvents / coordinatorRuns / agentGoals /
 * economicRequests / fulfilment state to produce a single "what I asked,
 * what's planned, what happened" timeline. Does NOT create a new engine —
 * reuses the existing event stores (AGENTS.md §31 change ownership).
 */
import { getCanonicalStore } from './canonicalStore.js';

export type AuditEntryKind = 'intent' | 'request' | 'goal' | 'action' | 'outcome' | 'evidence';

export interface AuditEntry {
  id: string; kind: AuditEntryKind; title: string; description?: string | null;
  status: string; occurredAt: string; actor?: string | null; ref?: string | null;
}

export interface AuditTimeline { phone: string; generatedAt: string; entries: AuditEntry[]; total: number; }

function normalizePhone(phone: string | undefined): string { return String(phone || '').trim(); }

export async function getAuditTimeline(phone: string, limit = 100): Promise<AuditTimeline> {
  const owner = normalizePhone(phone);
  const store = await getCanonicalStore();
  const entries: AuditEntry[] = [];

  // 1. Intent events from coordinator_events (chat.turn.completed, intent.classified)
  if (owner) {
    const intentRows = await store.all<any>(
      `SELECT id, type, payload_json, occurred_at FROM coordinator_events
       WHERE owner_phone = ? AND (type LIKE 'intent.%' OR type LIKE 'chat.%' OR type = 'conversation.turn')
       ORDER BY occurred_at DESC LIMIT ?`, [owner, limit]);
    for (const r of intentRows) {
      let payload: any = {};
      try { payload = JSON.parse(r.payload_json || '{}'); } catch { }
      entries.push({
        id: String(r.id), kind: 'intent',
        title: payload?.intentClass || payload?.type || String(r.type),
        description: payload?.requestText || payload?.text || null,
        status: payload?.status || 'recorded',
        occurredAt: String(r.occurred_at),
        actor: payload?.producer || null,
      });
    }
  }

  // 2. Agent goals (planned + active + completed)
  if (owner) {
    const goalRows = await store.all<any>(
      `SELECT id, objective, status, source, created_at, completed_at FROM agent_goals
       WHERE phone = ? ORDER BY created_at DESC LIMIT ?`, [owner, limit]);
    for (const r of goalRows) {
      entries.push({
        id: String(r.id), kind: 'goal', title: String(r.objective || 'Agent goal'),
        description: `Source: ${r.source || 'unknown'}`, status: String(r.status),
        occurredAt: String(r.completed_at || r.created_at), actor: 'agent',
      });
    }
  }

  // 3. Economic requests + fulfilment
  if (owner) {
    const reqRows = await store.all<any>(
      `SELECT id, skill, category, status, created_at, updated_at FROM economic_requests
       WHERE phone = ? ORDER BY updated_at DESC LIMIT ?`, [owner, limit]);
    for (const r of reqRows) {
      entries.push({
        id: String(r.id), kind: 'request', title: `${r.skill} request`,
        description: r.category || null, status: String(r.status),
        occurredAt: String(r.updated_at || r.created_at),
      });
    }
  }

  // 4. Coordinator runs (action outcomes)
  if (owner) {
    const runRows = await store.all<any>(
      `SELECT cr.id, cr.capability, cr.state, cr.failure_reason, cr.created_at, ce.owner_phone
       FROM coordinator_runs cr
       JOIN coordinator_events ce ON ce.id = cr.event_id
       WHERE ce.owner_phone = ? ORDER BY cr.created_at DESC LIMIT ?`, [owner, limit]);
    for (const r of runRows) {
      entries.push({
        id: String(r.id), kind: 'action',
        title: r.capability ? String(r.capability) : 'Action',
        description: r.failure_reason ? String(r.failure_reason) : null,
        status: String(r.state), occurredAt: String(r.created_at), actor: 'system',
      });
    }
  }

  // Sort by time desc, cap
  entries.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  const capped = entries.slice(0, limit);
  return { phone: owner, generatedAt: new Date().toISOString(), entries: capped, total: entries.length };
}

export async function getAuditEntry(phone: string, id: string): Promise<AuditEntry | null> {
  const owner = normalizePhone(phone);
  if (!owner || !id) return null;
  const timeline = await getAuditTimeline(owner, 500);
  return timeline.entries.find((e) => e.id === id) ?? null;
}

export async function exportAuditTimeline(phone: string): Promise<{ phone: string; exportedAt: string; entries: AuditEntry[] }> {
  const timeline = await getAuditTimeline(phone, 1000);
  return { phone: timeline.phone, exportedAt: new Date().toISOString(), entries: timeline.entries };
}
