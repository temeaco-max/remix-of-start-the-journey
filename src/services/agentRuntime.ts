import crypto from 'node:crypto';
import { getDb, saveDb } from '../database.js';
import { getEconomicRequest } from './skillFlows.js';
import { getDueIntentions } from './deferredRequestService.js';
import { sendFcmPush } from './pushNotifications.js';
import { executeAgentTool, type AgentToolName, type AgentToolResult } from './agentToolRegistry.js';
import { coordinatorEventForAgentGoal, internalCoordinator } from './internalCoordinator.js';

export type AgentGoalStatus = 'active' | 'waiting' | 'needs_user' | 'blocked' | 'completed' | 'cancelled' | 'failed' | 'expired';
export type AgentGoalSource = 'conversation' | 'request' | 'reminder' | 'proactive' | 'network' | 'contributor' | 'qr' | 'event';
export type AgentAutonomyLevel = 'observe' | 'suggest' | 'assist' | 'act_with_confirmation' | 'act_within_permission';
export type AgentRiskLevel = 'read_only' | 'reversible' | 'user_confirmation_required' | 'high_risk';
export interface AgentPlanStep { id: string; action: string; tool: AgentToolName; risk: AgentRiskLevel; status: 'pending' | 'running' | 'waiting' | 'completed' | 'blocked' | 'failed'; authorization: string; idempotencyKey: string; evidence?: string; result?: string; }
export interface AgentPlan { objective: string; currentStep: number; status: AgentGoalStatus; requiredInputs: string[]; dependencies: string[]; confirmationRequired: boolean; riskLevel: AgentRiskLevel; expiresAt: string; steps: AgentPlanStep[]; }

export interface AgentGoal {
  id: string;
  phone: string;
  conversationId?: string;
  economicRequestId?: string;
  source: AgentGoalSource;
  goalType: string;
  objective: string;
  status: AgentGoalStatus;
  priority: number;
  autonomy: AgentAutonomyLevel;
  plan: AgentPlan;
  nextActionAt?: string;
  completedAt?: string;
  failureReason?: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentGoalEvent {
  id: number;
  goalId: string;
  action: string;
  tool?: string;
  result: 'success' | 'waiting' | 'needs_user' | 'blocked' | 'failed';
  evidence?: string;
  detail?: string;
  idempotencyKey?: string;
  createdAt: string;
}

const GOAL_STATUSES = new Set<AgentGoalStatus>(['active', 'waiting', 'needs_user', 'blocked', 'completed', 'cancelled', 'failed', 'expired']);
const AUTONOMY = new Set<AgentAutonomyLevel>(['observe', 'suggest', 'assist', 'act_with_confirmation', 'act_within_permission']);
const ECONOMIC_SKILLS = new Set(['ride_request', 'order_food', 'find_worker', 'universal_vendor_order', 'security_booking', 'product_sourcing', 'repair', 'buy_car', 'buy_ticket', 'verified_artist']);

function enabled(): boolean { return process.env.KURUKOO_AGENT_ENABLED === 'true'; }
function autonomousEnabled(): boolean { return enabled() && process.env.KURUKOO_AGENT_AUTONOMOUS === 'true'; }
function maxActions(): number { return Math.max(1, Math.min(20, Number(process.env.KURUKOO_AGENT_MAX_ACTIONS_PER_CYCLE || 8))); }
function maxConcurrent(): number { return Math.max(1, Math.min(50, Number(process.env.KURUKOO_AGENT_MAX_CONCURRENT_GOALS || 5))); }
function maxRetries(): number { return Math.max(0, Math.min(5, Number(process.env.KURUKOO_AGENT_MAX_RETRIES || 2))); }
function cooldownMs(): number { return Math.max(5, Math.min(3600, Number(process.env.KURUKOO_AGENT_COOLDOWN_SECONDS || 30))) * 1000; }

type AgentWorkerHealth = {
  startedAt: string | null;
  lastCycleStartedAt: string | null;
  lastCycleCompletedAt: string | null;
  lastCycleGoalCount: number;
  lastCycleUpdatedCount: number;
  lastCycleError: string | null;
  cycleRunning: boolean;
  cycleCount: number;
};

const workerHealth: AgentWorkerHealth = { startedAt: null, lastCycleStartedAt: null, lastCycleCompletedAt: null, lastCycleGoalCount: 0, lastCycleUpdatedCount: 0, lastCycleError: null, cycleRunning: false, cycleCount: 0 };
export function markAgentWorkerStarted(): void { workerHealth.startedAt = new Date().toISOString(); workerHealth.lastCycleError = null; }
export function markAgentWorkerCycleStarted(): boolean { if (workerHealth.cycleRunning) return false; workerHealth.cycleRunning = true; workerHealth.lastCycleStartedAt = new Date().toISOString(); workerHealth.lastCycleError = null; return true; }
export function markAgentWorkerCycleCompleted(goalCount: number, updatedCount: number): void { workerHealth.cycleRunning = false; workerHealth.lastCycleCompletedAt = new Date().toISOString(); workerHealth.lastCycleGoalCount = Math.max(0, goalCount); workerHealth.lastCycleUpdatedCount = Math.max(0, updatedCount); workerHealth.cycleCount += 1; }
export function markAgentWorkerCycleFailed(error: unknown): void { workerHealth.cycleRunning = false; workerHealth.lastCycleError = String(error instanceof Error ? error.message : error || 'Unknown worker error').slice(0, 500); workerHealth.cycleCount += 1; }
export function markAgentWorkerStopped(): void { workerHealth.cycleRunning = false; }

export type AgentWorkerRun = { id: number; startedAt: string; completedAt?: string; status: 'running' | 'completed' | 'failed'; dueGoalCount: number; updatedGoalCount: number; error?: string };
export async function recordAgentWorkerRun(input: Omit<AgentWorkerRun, 'id'>): Promise<void> { await ensureAgentRuntimeSchema(); const db = await getDb(); db.run(`INSERT INTO agent_worker_runs (started_at, completed_at, status, due_goal_count, updated_goal_count, error) VALUES (?, ?, ?, ?, ?, ?)`, [input.startedAt, input.completedAt || null, input.status, input.dueGoalCount, input.updatedGoalCount, input.error || null]); saveDb(); }
export async function listAgentWorkerRuns(limit = 20): Promise<AgentWorkerRun[]> { await ensureAgentRuntimeSchema(); const db = await getDb(); const stmt = db.prepare(`SELECT * FROM agent_worker_runs ORDER BY id DESC LIMIT ?`); stmt.bind([Math.max(1, Math.min(100, limit))]); const runs: AgentWorkerRun[] = []; while (stmt.step()) { const row = stmt.getAsObject() as any; runs.push({ id: Number(row.id), startedAt: String(row.started_at || ''), completedAt: row.completed_at ? String(row.completed_at) : undefined, status: String(row.status) as AgentWorkerRun['status'], dueGoalCount: Number(row.due_goal_count || 0), updatedGoalCount: Number(row.updated_goal_count || 0), error: row.error ? String(row.error) : undefined }); } stmt.free(); return runs; }

export async function ensureAgentRuntimeSchema(): Promise<void> {
  const db = await getDb();
  db.run(`CREATE TABLE IF NOT EXISTS agent_goals (id TEXT PRIMARY KEY, phone TEXT NOT NULL, conversation_id TEXT, economic_request_id TEXT, source TEXT NOT NULL, goal_type TEXT NOT NULL, objective TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', priority INTEGER NOT NULL DEFAULT 50, autonomy TEXT NOT NULL DEFAULT 'assist', next_action_at TEXT, completed_at TEXT, failure_reason TEXT, summary TEXT, plan_json TEXT, risk_level TEXT DEFAULT 'read_only', confirmation_required INTEGER DEFAULT 0, expires_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  const goalColumns = db.exec(`PRAGMA table_info(agent_goals)`)[0]?.values?.map((row: any[]) => String(row[1])) || [];
  for (const [name, declaration] of Object.entries({ conversation_id: 'TEXT', economic_request_id: 'TEXT', source: "TEXT DEFAULT 'conversation'", goal_type: "TEXT DEFAULT 'general'", priority: 'INTEGER DEFAULT 50', autonomy: "TEXT DEFAULT 'assist'", next_action_at: 'TEXT', completed_at: 'TEXT', failure_reason: 'TEXT', summary: 'TEXT', plan_json: 'TEXT', risk_level: "TEXT DEFAULT 'read_only'", confirmation_required: 'INTEGER DEFAULT 0', expires_at: 'TEXT' })) if (!goalColumns.includes(name)) { try { db.run(`ALTER TABLE agent_goals ADD COLUMN ${name} ${declaration}`); } catch {} }
  try { db.run("UPDATE agent_goals SET goal_type = COALESCE(NULLIF(goal_type, ''), skill, 'general') WHERE goal_type IS NULL OR goal_type = ''"); } catch {}
  try { db.run("UPDATE agent_goals SET source = COALESCE(NULLIF(source, ''), 'conversation') WHERE source IS NULL OR source = ''"); } catch {}
  db.run(`CREATE TABLE IF NOT EXISTS agent_goal_events (id INTEGER PRIMARY KEY AUTOINCREMENT, goal_id TEXT NOT NULL, action TEXT NOT NULL, tool TEXT, result TEXT NOT NULL, evidence TEXT, detail TEXT, idempotency_key TEXT UNIQUE, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
  db.run(`CREATE TABLE IF NOT EXISTS agent_worker_runs (id INTEGER PRIMARY KEY AUTOINCREMENT, started_at TEXT NOT NULL, completed_at TEXT, status TEXT NOT NULL, due_goal_count INTEGER NOT NULL DEFAULT 0, updated_goal_count INTEGER NOT NULL DEFAULT 0, error TEXT)`);
  const eventColumns = db.exec(`PRAGMA table_info(agent_goal_events)`)[0]?.values?.map((row: any[]) => String(row[1])) || [];
  for (const [name, declaration] of Object.entries({ action: "TEXT DEFAULT 'legacy'", tool: 'TEXT', result: "TEXT DEFAULT ''", evidence: 'TEXT', detail: 'TEXT', idempotency_key: 'TEXT' })) if (!eventColumns.includes(name)) { try { db.run(`ALTER TABLE agent_goal_events ADD COLUMN ${name} ${declaration}`); } catch {} }
  db.run(`CREATE INDEX IF NOT EXISTS idx_agent_goals_phone_status ON agent_goals(phone, status, updated_at DESC)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_agent_goals_due ON agent_goals(status, next_action_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_agent_goal_events_goal ON agent_goal_events(goal_id, created_at DESC)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_agent_worker_runs_started ON agent_worker_runs(started_at DESC)`); saveDb();
}

function rowToGoal(row: any): AgentGoal { return { id: String(row.id), phone: String(row.phone), conversationId: row.conversation_id ? String(row.conversation_id) : undefined, economicRequestId: row.economic_request_id ? String(row.economic_request_id) : undefined, source: String(row.source) as AgentGoalSource, goalType: String(row.goal_type), objective: String(row.objective), status: String(row.status) as AgentGoalStatus, priority: Number(row.priority || 50), autonomy: String(row.autonomy) as AgentAutonomyLevel, nextActionAt: row.next_action_at ? String(row.next_action_at) : undefined, completedAt: row.completed_at ? String(row.completed_at) : undefined, failureReason: row.failure_reason ? String(row.failure_reason) : undefined, summary: row.summary ? String(row.summary) : undefined, plan: row.plan_json ? JSON.parse(String(row.plan_json)) : buildGoalPlan(String(row.objective || ''), String(row.goal_type || ''), row.economic_request_id ? String(row.economic_request_id) : undefined), createdAt: String(row.created_at || ''), updatedAt: String(row.updated_at || '') }; }

export async function listAgentGoals(phone: string, includeClosed = false): Promise<AgentGoal[]> { await ensureAgentRuntimeSchema(); const db = await getDb(); const stmt = db.prepare(includeClosed ? `SELECT * FROM agent_goals WHERE phone=? ORDER BY updated_at DESC LIMIT 50` : `SELECT * FROM agent_goals WHERE phone=? AND status IN ('active','waiting','needs_user','blocked') ORDER BY priority DESC, updated_at DESC LIMIT 25`); stmt.bind([phone]); const goals: AgentGoal[] = []; while (stmt.step()) goals.push(rowToGoal(stmt.getAsObject())); stmt.free(); return goals; }
export async function getAgentGoal(phone: string, goalId: string): Promise<AgentGoal | null> { await ensureAgentRuntimeSchema(); const db = await getDb(); const stmt = db.prepare(`SELECT * FROM agent_goals WHERE id=? AND phone=?`); stmt.bind([goalId, phone]); const goal = stmt.step() ? rowToGoal(stmt.getAsObject()) : null; stmt.free(); return goal; }
export async function listAgentGoalEvents(phone: string, goalId: string): Promise<AgentGoalEvent[]> { const goal = await getAgentGoal(phone, goalId); if (!goal) return []; const db = await getDb(); const stmt = db.prepare(`SELECT e.* FROM agent_goal_events e JOIN agent_goals g ON g.id=e.goal_id WHERE e.goal_id=? AND g.phone=? ORDER BY e.id ASC LIMIT 100`); stmt.bind([goalId, phone]); const events: AgentGoalEvent[] = []; while (stmt.step()) { const row = stmt.getAsObject() as any; events.push({ id: Number(row.id), goalId: String(row.goal_id), action: String(row.action), tool: row.tool ? String(row.tool) : undefined, result: String(row.result) as AgentGoalEvent['result'], evidence: row.evidence ? String(row.evidence) : undefined, detail: row.detail ? String(row.detail) : undefined, idempotencyKey: row.idempotency_key ? String(row.idempotency_key) : undefined, createdAt: String(row.created_at || '') }); } stmt.free(); return events; }

async function recordEvent(goal: AgentGoal, action: string, result: AgentGoalEvent['result'], detail: string, options: { tool?: string; evidence?: string; idempotencyKey?: string } = {}): Promise<void> { const db = await getDb(); const key = options.idempotencyKey; if (key) { const existing = db.prepare(`SELECT id FROM agent_goal_events WHERE idempotency_key=?`); existing.bind([key]); const exists = existing.step(); existing.free(); if (exists) return; } db.run(`INSERT INTO agent_goal_events (goal_id, action, tool, result, evidence, detail, idempotency_key) VALUES (?, ?, ?, ?, ?, ?, ?)`, [goal.id, action, options.tool || null, result, options.evidence || null, detail.slice(0, 1200), key || null]); saveDb(); }

async function updateGoal(goal: AgentGoal, patch: Partial<Pick<AgentGoal, 'status' | 'nextActionAt' | 'completedAt' | 'failureReason' | 'summary'>>): Promise<AgentGoal> { const db = await getDb(); const status = patch.status || goal.status; if (!GOAL_STATUSES.has(status)) throw new Error('Invalid goal state'); const nextActionAt = patch.nextActionAt === undefined ? goal.nextActionAt : patch.nextActionAt; const completedAt = patch.completedAt === undefined ? goal.completedAt : patch.completedAt; const failureReason = patch.failureReason === undefined ? goal.failureReason : patch.failureReason; const summary = patch.summary === undefined ? goal.summary : patch.summary; db.run(`UPDATE agent_goals SET status=?, next_action_at=?, completed_at=?, failure_reason=?, summary=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND phone=?`, [status, nextActionAt || null, completedAt || null, failureReason || null, summary || null, goal.id, goal.phone]); saveDb(); return (await getAgentGoal(goal.phone, goal.id)) || { ...goal, status, nextActionAt, completedAt, failureReason, summary }; }
function nextTime(): string { return new Date(Date.now() + cooldownMs()).toISOString(); }
function buildGoalPlan(objective: string, skill: string, requestId?: string): AgentPlan { const confirmationRequired = Boolean(requestId); const steps: AgentPlanStep[] = [{ id: 'inspect_request', action: 'Check the current request state', tool: 'get_request_state', risk: 'read_only', status: requestId ? 'pending' : 'blocked', authorization: 'owned_request_read', idempotencyKey: `inspect:${requestId || skill}` }]; if (requestId) steps.push({ id: 'await_confirmation', action: 'Wait for your approval before any consequential action', tool: 'get_request_state', risk: 'user_confirmation_required', status: 'pending', authorization: 'existing_request_confirmation', idempotencyKey: `confirm:${requestId}` }); return { objective: objective.slice(0, 1000), currentStep: 0, status: requestId ? 'active' : 'needs_user', requiredInputs: requestId ? [] : ['request details'], dependencies: requestId ? [`economic_request:${requestId}`] : [], confirmationRequired, riskLevel: confirmationRequired ? 'user_confirmation_required' : 'reversible', expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), steps }; }

export async function createConversationGoal(input: { phone: string; conversationId?: string; skill: string; objective: string; economicRequestId?: string; source?: AgentGoalSource }): Promise<AgentGoal | null> { if (!enabled() || !input.phone || input.phone.startsWith('anon_') || (!ECONOMIC_SKILLS.has(input.skill) && input.skill !== 'reminder')) return null; await ensureAgentRuntimeSchema(); const db = await getDb(); const countStmt = db.prepare(`SELECT COUNT(*) AS count FROM agent_goals WHERE phone=? AND status IN ('active','waiting','needs_user','blocked')`); countStmt.bind([input.phone]); const activeCount = countStmt.step() ? Number(countStmt.getAsObject().count || 0) : 0; countStmt.free(); if (activeCount >= maxConcurrent()) return null; const existing = db.prepare(`SELECT * FROM agent_goals WHERE phone=? AND conversation_id IS ? AND goal_type=? AND status IN ('active','waiting','needs_user','blocked') ORDER BY updated_at DESC LIMIT 1`); existing.bind([input.phone, input.conversationId || null, input.skill]); const prior = existing.step() ? rowToGoal(existing.getAsObject()) : null; existing.free(); if (prior) return prior; const autonomy: AgentAutonomyLevel = input.economicRequestId ? 'act_with_confirmation' : 'assist'; const plan = buildGoalPlan(input.objective, input.skill, input.economicRequestId); const goal: AgentGoal = { id: crypto.randomUUID(), phone: input.phone, conversationId: input.conversationId, economicRequestId: input.economicRequestId, source: input.source || 'conversation', goalType: input.skill, objective: input.objective.slice(0, 1000), status: input.economicRequestId ? 'active' : 'needs_user', priority: 50, autonomy, plan, nextActionAt: input.economicRequestId ? nextTime() : undefined, summary: input.economicRequestId ? 'Kurukoo is checking the existing request state.' : 'Kurukoo needs a few details before it can continue.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; db.run(`INSERT INTO agent_goals (id, phone, conversation_id, economic_request_id, source, goal_type, objective, status, priority, autonomy, next_action_at, summary, plan_json, risk_level, confirmation_required, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [goal.id, goal.phone, goal.conversationId || null, goal.economicRequestId || null, goal.source, goal.goalType, goal.objective, goal.status, goal.priority, goal.autonomy, goal.nextActionAt || null, goal.summary || null, JSON.stringify(plan), plan.riskLevel, plan.confirmationRequired ? 1 : 0, plan.expiresAt]); saveDb(); await recordEvent(goal, 'goal_created', goal.status === 'needs_user' ? 'needs_user' : 'success', goal.summary || 'Goal created.', { idempotencyKey: `goal:create:${goal.phone}:${goal.conversationId || 'none'}:${goal.goalType}` }); return goal; }

function messageForRequest(request: any): { status: AgentGoalStatus; summary: string; nextActionAt?: string; event: AgentGoalEvent['result'] } { if (['completed', 'fulfilled'].includes(request.status)) return { status: 'completed', summary: 'The canonical request records completion.', event: 'success' }; if (['cancelled', 'abandoned', 'expired'].includes(request.status)) return { status: 'cancelled', summary: 'The canonical request is no longer active.', event: 'success' }; if (['quoted', 'awaiting_confirmation', 'payment_pending'].includes(request.status)) return { status: 'needs_user', summary: 'A confirmed choice or payment step needs your approval.', event: 'needs_user' }; if (['awaiting_match', 'partially_matched', 'requested'].includes(request.status)) return { status: 'waiting', summary: 'Kurukoo is waiting for matching evidence and will re-check through the existing request flow.', nextActionAt: nextTime(), event: 'waiting' }; if (['matched', 'quoting', 'in_fulfillment', 'paid'].includes(request.status)) return { status: 'waiting', summary: 'The request has progressed and is waiting for the next verified provider or fulfilment event.', nextActionAt: nextTime(), event: 'waiting' }; return { status: 'blocked', summary: 'Kurukoo needs more verified information before it can continue this request.', event: 'blocked' }; }

async function evaluateGoal(goal: AgentGoal): Promise<AgentGoal> { if (!goal.economicRequestId) return updateGoal(goal, { status: 'needs_user', summary: 'Kurukoo needs a few details before it can continue.' });   const result = await internalCoordinator.handle(coordinatorEventForAgentGoal({ ownerPhone: goal.phone, agentGoalId: goal.id, economicRequestId: goal.economicRequestId, conversationId: goal.conversationId }));
  if (!result.ok) { const updated = await updateGoal(goal, { status: 'blocked', summary: result.message || 'The request could not be verified.', failureReason: result.message }); await recordEvent(updated, 'inspect_request', 'blocked', updated.summary || '', { tool: result.tool, evidence: result.evidence?.source, idempotencyKey: `goal:${goal.id}:inspect:${goal.updatedAt}` }); return updated; } const request = result.data || {}; const transition = messageForRequest(request);   const updated = await updateGoal(goal, { status: transition.status, summary: transition.summary, nextActionAt: transition.nextActionAt, completedAt: transition.status === 'completed' ? new Date().toISOString() : undefined }); await recordEvent(updated, 'inspect_request', transition.event, transition.summary, { tool: result.tool || 'get_request_state', evidence: result.evidence?.source, idempotencyKey: `goal:${goal.id}:request:${String(request.status)}` }); return updated; }

export async function runAgentGoal(goalId: string, phone?: string): Promise<AgentGoal | null> { if (!autonomousEnabled()) return null; await ensureAgentRuntimeSchema(); const db = await getDb(); const stmt = phone ? db.prepare(`SELECT * FROM agent_goals WHERE id=? AND phone=?`) : db.prepare(`SELECT * FROM agent_goals WHERE id=?`); stmt.bind(phone ? [goalId, phone] : [goalId]); const goal = stmt.step() ? rowToGoal(stmt.getAsObject()) : null; stmt.free(); if (!goal || !['active', 'waiting', 'needs_user', 'blocked'].includes(goal.status)) return goal; const events = await listAgentGoalEvents(goal.phone, goal.id); if (events.filter(event => event.result === 'failed').length > maxRetries()) return updateGoal(goal, { status: 'failed', summary: 'Kurukoo paused this goal after repeated safe failures.', failureReason: 'retry_limit' }); try { return await evaluateGoal(goal); } catch (error) { const message = error instanceof Error ? error.message : 'Unknown runtime failure'; const updated = await updateGoal(goal, { status: 'waiting', summary: 'Kurukoo could not re-check this yet and will wait before trying again.', nextActionAt: nextTime(), failureReason: message }); await recordEvent(updated, 'evaluate', 'failed', message, { idempotencyKey: `goal:${goal.id}:failure:${Math.floor(Date.now() / cooldownMs())}` }); return updated; } }
export async function runDueAgentGoals(limit = maxActions()): Promise<AgentGoal[]> { if (!autonomousEnabled()) return []; await ensureAgentRuntimeSchema(); const db = await getDb(); const bounded = Math.max(1, Math.min(maxActions(), limit)); const stmt = db.prepare(`SELECT * FROM agent_goals WHERE status IN ('active','waiting') AND next_action_at IS NOT NULL AND datetime(next_action_at) <= datetime('now') ORDER BY priority DESC, next_action_at ASC LIMIT ?`); stmt.bind([bounded]); const goals: AgentGoal[] = []; while (stmt.step()) goals.push(rowToGoal(stmt.getAsObject())); stmt.free(); const updated: AgentGoal[] = []; for (const goal of goals) { const next = await runAgentGoal(goal.id, goal.phone); if (next) updated.push(next); } return updated; }
export async function reenterDueDeferredGoals(limit = maxActions()): Promise<AgentGoal[]> { if (!autonomousEnabled()) return []; const due = await getDueIntentions(limit); const outcomes: AgentGoal[] = []; for (const intention of due) { if (!intention.economic_request_id || !intention.phone) continue; const goal = await createConversationGoal({ phone: String(intention.phone), skill: String(intention.skill || intention.intent || 'find_worker'), objective: String(intention.intent || 'Continue request'), economicRequestId: String(intention.economic_request_id), source: 'event' }); if (goal) { const updated = await runAgentGoal(goal.id, goal.phone); if (updated) outcomes.push(updated); } } return outcomes; }
export async function pauseAgentGoal(phone: string, goalId: string): Promise<AgentGoal | null> { const goal = await getAgentGoal(phone, goalId); if (!goal || ['completed', 'cancelled', 'failed', 'expired'].includes(goal.status)) return goal; const updated = await updateGoal(goal, { status: 'waiting', summary: 'Paused at your request. No further checks will run until you resume it.', nextActionAt: undefined }); await recordEvent(updated, 'paused_by_user', 'success', updated.summary || '', { idempotencyKey: `goal:${goalId}:pause` }); return updated; }
export async function resumeAgentGoal(phone: string, goalId: string): Promise<AgentGoal | null> { const goal = await getAgentGoal(phone, goalId); if (!goal || ['completed', 'cancelled', 'failed', 'expired'].includes(goal.status)) return goal; const updated = await updateGoal(goal, { status: goal.economicRequestId ? 'active' : 'needs_user', summary: goal.economicRequestId ? 'Resumed. Kurukoo will re-check the existing request through the bounded runtime.' : 'Resumed, but more request details are still required.', nextActionAt: goal.economicRequestId ? nextTime() : undefined }); await recordEvent(updated, 'resumed_by_user', 'success', updated.summary || '', { idempotencyKey: `goal:${goalId}:resume:${updated.updatedAt}` }); return updated; }
export async function cancelAgentGoal(phone: string, goalId: string): Promise<AgentGoal | null> { const goal = await getAgentGoal(phone, goalId); if (!goal || ['completed', 'cancelled', 'failed', 'expired'].includes(goal.status)) return goal; const updated = await updateGoal(goal, { status: 'cancelled', summary: 'You asked Kurukoo to stop following up on this objective.', nextActionAt: undefined, completedAt: new Date().toISOString() }); await recordEvent(updated, 'cancelled_by_user', 'success', updated.summary || '', { idempotencyKey: `goal:${goalId}:cancel` }); return updated; }

/** Resolve a conversational agent goal without ever guessing across contexts. */
export async function goalTimeline(phone: string, conversationId?: string): Promise<{ goal: AgentGoal | null; events: AgentGoalEvent[]; ambiguous?: boolean }> {
  const goals = await listAgentGoals(phone);
  if (conversationId) {
    const goal = goals.find(item => item.conversationId === conversationId) || null;
    return { goal, events: goal ? await listAgentGoalEvents(phone, goal.id) : [] };
  }
  if (goals.length === 1) {
    const goal = goals[0];
    return { goal, events: await listAgentGoalEvents(phone, goal.id) };
  }
  // No conversation identity and multiple live goals means the caller must
  // disambiguate instead of silently attaching another conversation's state.
  return { goal: null, events: [], ambiguous: goals.length > 1 };
}

async function autonomousNotificationsAllowed(phone: string): Promise<boolean> { const db = await getDb(); const row = db.exec('SELECT preferences FROM memory_profiles WHERE phone = ?', [phone])[0]?.values?.[0] as any[] | undefined; if (!row?.[0]) return true; try { const preferences = JSON.parse(String(row[0])); return preferences?.agent_notifications !== false && preferences?.notifications?.agent !== false && preferences?.notifications?.autonomous !== false; } catch { return true; } }
async function notificationAlreadyQueued(goal: AgentGoal, key: string): Promise<boolean> { const db = await getDb(); const row = db.exec('SELECT id FROM agent_goal_events WHERE goal_id = ? AND idempotency_key = ? LIMIT 1', [goal.id, key])[0]?.values?.[0]; return Boolean(row); }
export async function notifyGoalIfNeeded(goal: AgentGoal): Promise<void> { if (!['needs_user', 'blocked', 'completed'].includes(goal.status)) return; const message = goal.summary || 'Kurukoo has an update on your agent goal.'; if (!(await autonomousNotificationsAllowed(goal.phone))) return; const key = `goal:${goal.id}:notify:${goal.status}:${goal.updatedAt}`; if (await notificationAlreadyQueued(goal, key)) return; try { await sendFcmPush(goal.phone, 'Kurukoo update', message); } catch {} await recordEvent(goal, 'notification_queued', 'success', message, { idempotencyKey: key }); }

export function agentRuntimeStatus(): { enabled: boolean; autonomous: boolean; worker: AgentWorkerHealth; limits: { maxActions: number; maxConcurrentGoals: number; maxRetries: number; cooldownSeconds: number } } { return { enabled: enabled(), autonomous: autonomousEnabled(), worker: { ...workerHealth }, limits: { maxActions: maxActions(), maxConcurrentGoals: maxConcurrent(), maxRetries: maxRetries(), cooldownSeconds: cooldownMs() / 1000 } }; }
