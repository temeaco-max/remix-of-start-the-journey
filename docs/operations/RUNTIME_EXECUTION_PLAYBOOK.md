# Kurukoo Live Runtime Execution Playbook

This is the canonical operational path for proving the deployed system, separate from repository-only tests.

## 1. Required environment

Set `KURUKOO_BASE_URL` to the current deployed HTTPS origin. Do not reuse an expired preview URL.

Optional credentials for authenticated probes must be supplied by the deployment/operator environment and never committed.

## 2. Public smoke

Run:

```bash
KURUKOO_BASE_URL=https://<live-host> npx tsx scripts/runtime-smoke.ts
```

The smoke harness checks:

- `/health`
- `/readyz`
- `/`
- `/chat`
- `/pricing`
- `/help`
- `/about`

It then validates the JSON health contract, database state, capability runtime snapshot and external integration status.

`/readyz` may legitimately return `503` when a declared production dependency is not activated; this is a readiness signal, not a successful deployment claim.

## 3. Canonical Chat execution

Use the deployed Chat UI or the existing canonical SSE endpoint. Exercise at minimum:

1. `hello`
2. a support request such as `How do I unlink my phone?`
3. a Memory Profile-aware request
4. `remind me when my bins go out`
5. an existing-skill request such as phone repair
6. an ambiguous request that should escalate to model reasoning
7. an explicit Economic Request with provider/quote/payment boundaries
8. a cancellation and a resume/continuation

Observe that every turn remains on the canonical conversation owner and that model output does not mutate state directly.

## 4. Economic execution

Run the existing local/sandbox contracts first:

```bash
npm run test:local-repair-outcome
npm run test:economic-lifecycle
npm run test:checkout-confirmation
npm run test:dispute-lifecycle
```

Production rehearsal must use real configured payment credentials and verify authorization, capture/escrow, refund, dispute, webhook idempotency and settlement reconciliation before the payment surface is marked operational.

## 5. Channel execution

Run the current channel contracts and only then exercise live credentials:

```bash
npm run test:whatsapp-webhook-boundary
npm run test:whatsapp-linked-device
npm run test:telegram-linked-session-chat
npm run test:fcm-boundary
npm run test:voice
```

A connected channel is not considered operational until inbound, outbound, identity mapping, canonical Chat continuity and failure/retry behaviour are evidenced.

## 6. Agent execution

Use:

```bash
npm run test:agent-runtime
npm run test:agent-control
npm run test:ai-capability-execution
npm run test:interaction-policy
```

For delegated agents, verify the represented party, authority policy, instruction composition, commercial beneficiary, approval thresholds, cancellation and evidence are preserved through execution.

## 7. Skill execution

Before declaring a skill usable in production, run:

```bash
npm run test:skill-flows
npm run test:skill-mode-routing
npm run test:outcome-completeness
npx tsx scripts/test-skill-outcome-convergence.ts
npx tsx scripts/test-skill-execution-contracts.ts
npx tsx scripts/test-economic-category-convergence.ts
```

Then execute at least one real scenario for each newly activated local provider/service family.

## 8. Defect triage rule

When live execution exposes a failure, classify it as one of:

- routing / conversation act
- skill behaviour / missing requirement
- Memory Profile/context
- model/inference
- capability/canonical state
- provider/discovery
- payment/commercial ledger
- channel delivery
- notification
- external integration
- UI/state projection
- deployment/infrastructure

Fix the canonical owner. Do not patch a downstream surface to hide an upstream authority defect.

## 9. Completion rule

Kurukoo is broadly runtime-complete only when:

- the deployed version is identified and reachable;
- `/health` is healthy;
- `/readyz` reflects the intended production dependency state;
- canonical Chat works across representative conversation trajectories;
- skill behaviour and Memory Profile remain intact;
- Economic Requests complete truthfully in the enabled payment mode;
- enabled channels complete inbound/outbound round trips;
- first-class and delegated agents respect authority and evidence boundaries;
- provider fulfilment is evidenced for the actual activated markets;
- CI is green on the release head;
- all remaining unchecked items in `todo.md` are either externally activated or explicitly deferred with an owner and evidence requirement.

No simulated result may be promoted to a production operational claim.
