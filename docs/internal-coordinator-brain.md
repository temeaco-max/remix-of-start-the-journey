# Kurukoo Internal Coordinator Brain

## Purpose

The coordinator is a lightweight decision layer for continuing user-authorised work across canonical Kurukoo services. It is not a second Chat engine, a database owner, a payment processor, or an unrestricted autonomous model.

The coordinator reads a typed event, current canonical state, approved memory, and policy. It chooses at most one bounded capability per cycle, executes that capability through its canonical owner, persists the result, and either schedules continuation or asks the user for confirmation.

The recommended first model is **SmolLM2-1.7B-Instruct**, because Kurukoo already has a local-first SmolLM2 boundary. The checkpoint is configurable through `SMOLLM2_MODEL`, the local Transformers.js path defaults to CPU `q4` quantization, and constrained hosts may select `HuggingFaceTB/SmolLM2-360M-Instruct` without changing the canonical architecture. `scripts/test-smollm2-local.ts` proves direct local inference, `unifiedAiEngine` attribution, and the canonical Chat turn boundary all use the actually loaded checkpoint. In the sandbox, the 1.7B first-use load exceeded the available memory envelope, while the 360M q4 checkpoint loaded and passed the complete direct-to-Chat test. Use FastText and deterministic rules before invoking it. If local tool-selection quality is insufficient after evaluation, test **Qwen2.5-3B-Instruct** as a replacement candidate behind `unifiedAiEngine`; do not add both as permanent runtime authorities. Use Mistral Small or another approved hosted model as a selective teacher and escalation provider, not as the default for every turn.

## Learning strategy

Do not train production weights directly from raw conversations. Begin with operational learning:

1. Record redacted, structured interaction traces containing the event, selected capability, canonical result, latency, cost, user outcome, and policy decision.
2. Identify uncertain, failed, high-value, or expensive examples with deterministic rules and runtime telemetry.
3. Send only eligible redacted examples to the approved teacher provider.
4. Ask the teacher for structured labels, missing fields, capability choice, response candidates, and failure explanations.
5. Validate the teacher output against JSON schema, policy rules, safety rules, and canonical state transitions.
6. Store it as a `candidate` learning artifact with provenance and an expiry date.
7. Run the candidate against a frozen evaluation set and adversarial cases.
8. Require operator approval for changes affecting payment, safety, external messaging, privacy, or autonomous execution.
9. Promote only approved artifacts to retrieval, templates, routing rules, or a model-training dataset.
10. Canary the promoted version, compare cost, latency, task success, clarification rate, false-action rate, and truthfulness, then roll back if any guardrail worsens.

The first cost savings should come from better routing, retrieval, templates, and structured extraction. Fine-tuning should come later, after enough approved examples and a stable evaluation set exist.

## Training and fine-tuning pipeline

```text
Canonical event
  -> redaction and eligibility filter
  -> teacher request with structured-output schema
  -> policy/schema/provenance validation
  -> candidate learning artifact
  -> frozen evaluation set
  -> operator approval where required
  -> retrieval/template/routing promotion
  -> optional supervised fine-tuning dataset
  -> local adapter or model version
  -> canary runtime
  -> promotion or rollback
```

A supervised example should look like this:

```json
{
  "input": {
    "event_type": "economic_request.waiting_for_match",
    "user_message": "Find me a plumber in Ikeja tomorrow morning",
    "request_state": "awaiting_match",
    "known_requirements": {"skill": "plumber", "location": "Ikeja", "time": "tomorrow morning"},
    "missing_requirements": [],
    "available_capabilities": ["search_verified_providers", "schedule_recheck", "ask_user_confirmation"]
  },
  "target": {
    "capability": "search_verified_providers",
    "arguments": {"skill": "plumber", "location": "Ikeja"},
    "user_message": "I’m checking verified providers in Ikeja now. I’ll update you when I have a real match."
  },
  "labels": {
    "truthfulness": "no_external_match_claimed",
    "confirmation_required": false,
    "source": "approved_teacher_example_v3"
  }
}
```

Do not train from examples that include fabricated delivery, payment, inventory, verification, provider availability, or completion claims. Do not include raw secrets, authentication tokens, full payment details, or unredacted sensitive personal data.

## Typed event envelope

Create one shared type, for example `src/services/coordinatorTypes.ts`:

```ts
export type CoordinatorEventType =
  | 'chat.turn.completed'
  | 'economic_request.created'
  | 'economic_request.state_changed'
  | 'provider.offer.received'
  | 'notification.action_required'
  | 'notification.delivery_failed'
  | 'agent.goal.due'
  | 'channel.message.received'
  | 'payment.webhook.verified'
  | 'pwa.lifecycle.changed'
  | 'operator.policy_changed';

export type ConfirmationLevel = 'none' | 'user' | 'operator' | 'external_evidence';

export interface CoordinatorEventEnvelope<TPayload = Record<string, unknown>> {
  id: string;
  type: CoordinatorEventType;
  occurredAt: string;
  producer: string;
  correlationId: string;
  causationId?: string;
  ownerPhone?: string;
  economicRequestId?: string;
  agentGoalId?: string;
  payload: TPayload;
  sensitivity: 'public' | 'personal' | 'sensitive' | 'restricted';
  provenance: {
    source: 'user' | 'canonical_service' | 'provider' | 'operator' | 'teacher_model';
    sourceId?: string;
    evidenceLevel: 'assertion' | 'persisted_state' | 'verified_external';
  };
  policy: {
    autonomousAllowed: boolean;
    confirmationRequired: ConfirmationLevel;
    expiresAt?: string;
  };
  schemaVersion: 1;
}
```

The envelope is an observation and coordination input. It is not proof by itself. For example, a `payment.webhook.verified` event can carry verified-provider evidence only after the payment boundary validates the raw signature and metadata. A model-generated event must always have `source: 'teacher_model'` and `evidenceLevel: 'assertion'`.

## Typed capability contracts

Capabilities should be defined as typed tools with explicit risk and confirmation metadata:

```ts
export type CapabilityRisk = 'read' | 'low_risk_write' | 'user_commitment' | 'external_effect';

export interface CapabilityContext {
  event: CoordinatorEventEnvelope;
  ownerPhone?: string;
  economicRequestId?: string;
  correlationId: string;
  dryRun: boolean;
}

export interface CapabilityResult<T = unknown> {
  ok: boolean;
  state: 'observed' | 'persisted' | 'awaiting_confirmation' | 'completed' | 'failed' | 'deferred';
  data?: T;
  message?: string;
  evidence?: {
    source: string;
    reference?: string;
    level: 'assertion' | 'persisted_state' | 'verified_external';
  };
  nextEvent?: CoordinatorEventEnvelope;
}

export interface CoordinatorCapability<TArgs = unknown, TResult = unknown> {
  name: string;
  risk: CapabilityRisk;
  requires: ConfirmationLevel;
  schema: unknown;
  canRun(context: CapabilityContext): Promise<boolean>;
  run(args: TArgs, context: CapabilityContext): Promise<CapabilityResult<TResult>>;
}
```

The initial capability registry should be small:

```ts
export const capabilities = [
  searchVerifiedProviders,
  resumeDeferredRequest,
  scheduleRequestRecheck,
  askUserClarification,
  presentProviderOffer,
  requestUserConfirmation,
  enqueueInternalNotification,
  recordParticipantEvidence,
  createStripeIntentAfterConfirmedQuote,
  retryFailedNotification,
  openManualReview,
] satisfies CoordinatorCapability[];
```

The coordinator must never expose raw database access, arbitrary shell execution, unrestricted HTTP, credential access, or a generic “do anything” tool.

## Policy gate

```ts
export function authorizeCapability(
  capability: CoordinatorCapability,
  context: CapabilityContext,
): { allowed: boolean; reason: string } {
  if (!context.event.policy.autonomousAllowed && capability.risk !== 'read') {
    return { allowed: false, reason: 'Autonomous execution is disabled for this event.' };
  }

  if (capability.requires === 'user' && context.event.policy.confirmationRequired !== 'none') {
    return { allowed: false, reason: 'User confirmation is required before this capability.' };
  }

  if (capability.risk === 'external_effect' && context.event.provenance.evidenceLevel !== 'verified_external') {
    return { allowed: false, reason: 'External-effect capability lacks verified prerequisite evidence.' };
  }

  return { allowed: true, reason: 'Policy permits this bounded capability.' };
}
```

In production, the policy must also check feature flags, owner permissions, rate limits, cooldowns, request status, budget, retry count, notification preferences, and idempotency keys. Payment, dispatch, communication to external channels, and completion transitions should require additional canonical-service checks even when the coordinator is allowed to call them.

## Lightweight coordinator implementation

Add a service such as `src/services/internalCoordinator.ts`, but keep it behind `agentRuntime` rather than starting a second worker:

```ts
import crypto from 'node:crypto';
import { unifiedAiEngine } from './unifiedAiEngine.js';
import { authorizeCapability, capabilities } from './coordinatorCapabilities.js';
import type { CoordinatorEventEnvelope, CapabilityResult } from './coordinatorTypes.js';
import { persistCoordinatorRun, persistCoordinatorEvent } from './coordinatorStore.js';

export class InternalCoordinator {
  async handle(event: CoordinatorEventEnvelope): Promise<CapabilityResult> {
    const startedAt = Date.now();
    const correlationId = event.correlationId || crypto.randomUUID();

    await persistCoordinatorEvent(event);

    const context = {
      event: { ...event, correlationId },
      ownerPhone: event.ownerPhone,
      economicRequestId: event.economicRequestId,
      correlationId,
      dryRun: false,
    };

    const eligible = [];
    for (const capability of capabilities) {
      if (await capability.canRun(context)) eligible.push(capability);
    }

    if (!eligible.length) {
      const result = { ok: true, state: 'deferred', message: 'No permitted capability is ready; the event remains resumable.' } as const;
      await persistCoordinatorRun({ event, result, latencyMs: Date.now() - startedAt });
      return result;
    }

    const decision = await unifiedAiEngine.chooseCoordinatorAction({
      event,
      candidates: eligible.map(capability => ({
        name: capability.name,
        risk: capability.risk,
        requires: capability.requires,
        schema: capability.schema,
      })),
      mode: 'local_first',
    });

    const capability = eligible.find(item => item.name === decision.capability);
    if (!capability) {
      const result = { ok: false, state: 'failed', message: 'Model selected no eligible canonical capability.' } as const;
      await persistCoordinatorRun({ event, result, latencyMs: Date.now() - startedAt });
      return result;
    }

    const authorization = authorizeCapability(capability, context);
    if (!authorization.allowed) {
      const result = { ok: true, state: 'awaiting_confirmation', message: authorization.reason } as const;
      await persistCoordinatorRun({ event, result, latencyMs: Date.now() - startedAt, capability: capability.name });
      return result;
    }

    const result = await capability.run(decision.arguments, context);
    await persistCoordinatorRun({
      event,
      result,
      capability: capability.name,
      provider: decision.provider,
      model: decision.model,
      latencyMs: Date.now() - startedAt,
    });
    return result;
  }
}
```

`agentRuntime` should invoke `InternalCoordinator.handle()` for a due goal. It should not create a second timer, queue, or Chat path. A goal cycle should be idempotent, leased, bounded by maximum actions, and persisted as success, waiting, retryable failure, or dead-letter.

## Teacher interface

```ts
export interface TeacherRequest {
  task: 'label_intent' | 'choose_capability' | 'draft_clarification' | 'critique_response' | 'extract_requirements';
  redactedEvent: CoordinatorEventEnvelope;
  candidates?: Array<{ name: string; schema: unknown }>;
  evaluationPolicyVersion: string;
}

export interface TeacherResponse {
  provider: string;
  model: string;
  output: unknown;
  tokenUsage?: { input?: number; output?: number };
  candidateArtifactId: string;
}

export async function askTeacher(request: TeacherRequest): Promise<TeacherResponse> {
  // Call only through unifiedAiEngine with a configured budget and redaction.
  // Never allow this method to execute a tool or mutate canonical state.
  return unifiedAiEngine.generateStructuredTeacherOutput(request);
}
```

The teacher output should be passed to the evaluator, not directly to `InternalCoordinator`. The runtime uses only promoted artifacts or the standard local policy.

## Minimum data tables

A first repository implementation can add three small durable tables:

```sql
CREATE TABLE coordinator_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  causation_id TEXT,
  owner_phone TEXT,
  economic_request_id TEXT,
  payload_json TEXT NOT NULL,
  provenance_json TEXT NOT NULL,
  policy_json TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE coordinator_runs (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  capability TEXT,
  state TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  latency_ms INTEGER,
  failure_reason TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE learning_artifacts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  source_event_id TEXT,
  content_json TEXT NOT NULL,
  provenance_json TEXT NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'candidate',
  evaluation_score REAL,
  policy_version TEXT NOT NULL,
  expires_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

These tables should be written through one canonical coordinator store. They must not replace Economic Request, memory, notification, payment, or agent-goal tables.

## Rollout order

1. Add event and run telemetry in shadow mode; no autonomous side effects.
2. Add read-only capabilities such as request state projection and provider search.
3. Add deferred recheck and internal notification capabilities.
4. Add user-confirmation continuation.
5. Add selected low-risk autonomous actions with explicit feature flags.
6. Add teacher/evaluation artifacts and retrieval improvements.
7. Only after measured gains, evaluate local adapter fine-tuning.

Success should be measured by lower hosted-token usage, lower latency, fewer repeated clarification questions, fewer invalid tool choices, stable or improved task completion, zero false payment/delivery/completion claims, and no increase in user complaints or unsafe autonomous actions.

## Current repository wiring and verification

The repository-side coordinator is now connected at canonical persistence boundaries rather than at UI or provider-adapter guesses. `canonicalChatTurnService` emits `chat.turn.completed` after the assistant turn is persisted. `skillFlows` emits `economic_request.state_changed` after Economic Request creation, requirement updates, and lifecycle transitions. `economicParticipants` emits `provider.offer.received` only after the request owner is checked, the seller is verified, and the offer is persisted. `pushNotifications` emits `notification.action_required` for internal queue insertion and terminal delivery-state changes; this is an internal notification continuation and is not evidence of FCM or any other external delivery. `livingMemoryEngine` emits `memory.context.retrieved` with bounded counts, tiers, sources, and token estimates, never raw prompts or memory text. `paymentRoutes` emits `payment.webhook.verified` only after webhook signature verification, idempotency, request ownership, quote amount/currency matching, canonical payment transition, and escrow lock success.

The current implemented event taxonomy is: `agent.goal.due`, `chat.turn.completed`, `memory.context.retrieved`, `economic_request.state_changed`, `provider.offer.received`, `notification.action_required`, and `payment.webhook.verified`. All new events use persisted-state provenance except the verified payment event, which uses `verified_external` provenance because it is gated by a verified provider webhook and canonical reconciliation. None of these events grants the coordinator permission to invent stock, delivery, payment settlement, inventory, provider availability, channel delivery, or fulfilment. The event stream is telemetry and resumability infrastructure; canonical services remain the only owners of state and truth. Persisted `economic_request.state_changed`, `provider.offer.received`, and `payment.webhook.verified` events are now handed to the coordinator for one bounded continuation pass. The dispatcher is asynchronous, guarded by event type, and suppressed when the coordinator itself persists the event, preventing recursive execution. The continuation still uses only the existing bounded capabilities and never replaces the canonical owner.

The coordinator remains local-first and deterministic (`rules-v1`) with teacher/evaluation disabled unless explicitly enabled. External activation is a separate deployment step requiring provider credentials, privacy and retention decisions, quota review, callback verification, and runtime evidence. A passing repository test must therefore be described as repository-side readiness, not as live provider connectivity.

The deferred Request service also emits `economic_request.state_changed` after open-intention creation, state transitions, and bounded recheck scheduling. This keeps unavailable work resumable and observable without claiming that a provider, quote, dispatch, inventory item, or fulfilment result exists.

Candidate learning artifacts now have a protected, explicit approval boundary at `POST /api/admin/coordinator/learning/:id/approve`. The route is disabled unless `KURUKOO_COORDINATOR_PROMOTION_ENABLED=true`, requires administrator authentication, validates the candidate status and policy version, records operator provenance, and marks the artifact `approved`. Approval does not activate runtime policy; a separate canary and runtime activation decision remains required.

The durable coordinator store now aggregates operator-safe telemetry: event totals by type and producer, continuation run totals by state, latest bounded failure text, learning-artifact counts by approval status, and explicit runtime gate values. Protected admin stats expose this aggregation without exposing payloads, secrets, prompts, or personal memory text.

The targeted coordinator, agent-runtime, notification-queue, and TypeScript checks pass. The broad `npm run test:routes` suite passes, including economic lifecycle, multi-party request, provider entity, execution boundary, native assistance, development authentication, order, admin, SEO, task, and notification regressions.

> A coordinator event means that a canonical Kurukoo owner recorded a state transition or bounded observation. It does not mean that an external action occurred unless the event provenance explicitly says `verified_external` and the corresponding canonical reconciliation succeeded.
