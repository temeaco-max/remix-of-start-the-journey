# Kurukoo Autonomous-System Red-Team Audit

**Audit mode:** Read-only source and runtime-contract audit before remediation
**Audit baseline:** `6cdb8e0 — Harden runtime observability and secure renderers`
**Historical branch snapshot:** `develop`
**Current canonical branch:** `main`
**Scope:** Repository correctness, Chat preservation, autonomous runtime, workers, policy tools, evidence, connectors, notifications, advertising, commerce, authentication, authorization, security, SEO/CMS, responsiveness, and deployment readiness.

## Executive assessment

Kurukoo is a **strong bounded agentic web platform**, but it is not yet an “ultra-autonomous” production machine in the unrestricted sense. The current architecture correctly prioritizes consent, owner scoping, evidence, explicit feature flags, payment confirmation, and fail-closed external integrations. That is the correct mandate-aligned direction.

The read-only audit gives the current system an estimated **7.2/10 autonomous deployment maturity**:

| Area | State | Assessment |
|---|---|---|
| Chat-centered user experience | Ready | Central surfaces, composer, inspector, background continuation, and protected message behavior are contract-covered. |
| TypeScript correctness | Ready | `npm run lint` passed with no type errors. |
| CSS system | Ready | CSS audit found no exact duplicate top-level blocks, duplicate core tokens, server-template inline styles, or server-template inline handlers. |
| Route/service composition | Strong | 308 route declarations were detected; one canonical Chat/router boundary is present. |
| Authentication and authorization | Strong | Economic routes, notifications, runtime status, and owner-scoped goals use explicit authentication boundaries. |
| Autonomous goal persistence | Strong | Goals, plans, events, idempotency keys, retries, cooldowns, cancellation, and expiry fields exist. |
| Autonomous tool safety | Strong but narrow | Four policy-declared tools exist; high-risk actions are denied and request ownership is enforced. |
| Worker lifecycle | Partial | Background execution is flag-gated and overlap-protected, but health, last-run state, graceful shutdown, and operator control are limited. |
| External connector autonomy | Partial | Connector evidence and provider authorization exist, but most real adapters remain unconfigured or provider-gated. |
| Notification delivery | Partial | Durable internal inbox and deduplication exist; external FCM/email delivery remains unconfigured. |
| Product/order autonomy | Partial | Economic Request, offer, payment, escrow, delivery, and dispute boundaries exist; complete catalog/stock/dispatch/fulfilment automation is not universally verified. |
| Advertising/CMS | Strong | Admin-managed campaigns and approved image/disclosure governance are present. |
| SEO/content | Strong | Public sitemap and CMS/content route contracts are present and tested. |
| Deployability | Partial | Production JWT fail-closed behavior exists, but live provider credentials, webhook configuration, KYC, payment, affiliate, and agent runtime activation remain deployment prerequisites. |

> “Ultra autonomy” is interpreted here as **maximum safe, evidence-based autonomy inside explicit user permissions and provider contracts**, not unrestricted access, silent purchasing, arbitrary tool execution, or bypassing consent.

## Repository correctness

The repository baseline was clean before remediation. The historical snapshot commit was `6cdb8e0` on the former `develop` branch; the current canonical branch is `main`. The tracked-file inventory contained 412 files: 188 TypeScript files, 21 JavaScript files, 32 EJS templates, 30 HTML files, 13 CSS files, and 47 Markdown files. The protected Chat files had no uncommitted modifications at audit start.

TypeScript correctness passed through `npm run lint`. The CSS-system audit passed and reported 353,698 production CSS bytes, no exact duplicate top-level CSS blocks, no duplicate core design tokens, no inline style attributes in server-rendered frontend templates, and no inline event handlers in server-rendered frontend templates.

The security-boundary audit passed, including the economic authorization checks. Service composition reported 81 services, one canonical Chat/router boundary, authenticated identity use, Chat streaming, Chat history, a channel router mounted at the composition root, email webhook presence, and raw webhook capture. It also reported 183 canonical skills without explicit database flows; the code intentionally uses category/default fallback flows for these skills, which is a correctness and product-coverage risk rather than an authorization failure.

## Autonomous runtime findings

### Existing strengths

`src/services/agentRuntime.ts` implements persistent `agent_goals` and `agent_goal_events` tables, plan JSON, risk levels, confirmation flags, expiry, priorities, status transitions, owner scoping, event evidence, unique idempotency keys, cooldowns, bounded action counts, concurrency limits, retry limits, cancellation, and notification preference checks.

`src/services/agentToolRegistry.ts` declares a narrow tool set: request-state reads, bounded memory reads, reminder reads, and an explicitly deployment-gated economic re-check. Tools reject anonymous identities, enforce request ownership, declare risk and authorization, and return evidence strings. High-risk actions are not available.

`src/startup/backgroundServices.ts` activates the worker only when both `KURUKOO_AGENT_ENABLED` and `KURUKOO_AGENT_AUTONOMOUS` are true. It prevents overlapping cycles and processes due goals and deferred intentions through the existing canonical request flow.

### Gaps requiring remediation

| Severity | Gap | Evidence | Consequence |
|---|---|---|---|
| High | User pause/resume service functions are not exposed through authenticated routes | `pauseAgentGoal()` and `resumeAgentGoal()` exist, but `src/routes/agentRouter.ts` exposes list, detail, cancel, and timeline only. | Users cannot fully control an active autonomous goal from the API or UI. |
| High | Worker observability is incomplete | Runtime status reports flags and numeric limits, but not last cycle, current cycle, due-goal count, last error, or worker health. | Operators cannot distinguish “enabled but idle,” “blocked by providers,” and “worker unhealthy.” |
| High | Worker lifecycle is not graceful | `setInterval` timers are created in `startBackgroundServices()` without a retained handle or shutdown method. | Deploys and restarts cannot explicitly stop or drain autonomous work. |
| Medium | Autonomous plans are mostly inspection plans | `buildGoalPlan()` creates a request inspection step and optional confirmation wait; execution primarily reads request state. | The system is bounded and safe, but not yet a general autonomous coordinator across all supported skill/service flows. |
| Medium | Tool-plan state is not fully synchronized | Goal events contain evidence, but plan step statuses/currentStep are not consistently persisted after execution. | Operator and user views can underrepresent actual runtime progress. |
| Medium | Notification delivery is durable internally but external delivery is not live by default | `sendFcmPush()` persists an internal notification and warns when external FCM is absent. | Autonomous updates do not reach users outside the web session until providers are configured. |
| Medium | Connector evidence is available in execution services but not summarized in runtime readiness | Provider connector authorization and evidence exist in `executionConnector.ts`; readiness focuses mostly on environment presence. | Operators lack one consolidated “can this action run now?” evidence view. |
| Medium | Worker cycles have no persistent run ledger | Cycle state exists only in memory (`cycleRunning`). | Post-restart auditability and incident diagnosis are limited. |

## Advertising and CMS findings

Advertising governance is materially strong. Admin campaign creation requires approved image assets and disclosure metadata, public rendering filters for approval, schedule, active state, and valid imagery, and placeholder/dummy assets are rejected. The remaining production limitation is external advertiser and delivery configuration; the repository cannot safely claim a live campaign marketplace without those provider and billing boundaries.

CMS/content and SEO routes are present and tested. The main remaining risk is coverage depth: many canonical skills rely on category/default flows rather than explicit database-backed flow definitions. This should be treated as a controlled fallback, not silently marketed as fully specialized behavior.

## Security and identity findings

The security audit passed its static invariants, including rejection of URL-based JWT/admin tokens, demo phone identities in production paths, browser localStorage auth, legacy route boundaries, unauthenticated Economic Request mutations, and unsafe dynamic renderers in the protected Chat client and Request Hub.

The production JWT fallback is fail-closed for missing or short secrets. Notifications are owner-scoped, deduplicated, and read-state protected. Runtime status is admin-only. No evidence was found in the read-only audit that the existing Chat surface bypasses authenticated identity or creates anonymous persistent records.

## Protected Chat contract

The Chat shell is a protected interface contract and currently includes central workspace routing, context-aware header, adaptive inspector, in-place background execution, Tasks Topics activity, proactive suggestions, Connect, Top up, Subscription, Cart review, message styling, shared Ask actions, and responsive behavior. No Chat changes are authorized merely to increase autonomy. Any remediation must preserve the existing composer, surfaces, right rail, message actions, typography, and navigation choreography.

## Correctness conclusion before remediation

The repository is **type-correct and structurally coherent**, with strong authorization and safety boundaries. The key correctness gaps are not broad syntax failures; they are operational completeness gaps: user control endpoints, worker health and shutdown, persistent cycle observability, synchronized plan progress, and consolidated connector-evidence readiness.

The next implementation phase should address those gaps without weakening consent or exposing high-risk tools. Full autonomous production deployment remains conditional on real external credentials, verified callbacks/webhooks, payment/KYC/affiliate providers, notification delivery, connector evidence, and an explicit operator activation decision.


## Remediation tranche — durable worker auditability

The next completion tranche added a durable `agent_worker_runs` ledger to the existing autonomous runtime schema. Successful and failed worker cycles now persist bounded start/completion timestamps, due-goal and updated-goal counts, status, and a sanitized error field. Administrators can inspect recent records through the admin-only `GET /api/agent/runs` endpoint, while the existing `GET /api/agent/status` endpoint continues to expose current in-memory health. This closes the previous post-restart auditability gap without creating a second runtime or exposing user data.

The implementation was compiled and verified with the autonomous runtime regression, Chat DOM-safety contract, production guard regression, and repository diff checks. The updated maturity assessment is **7.6/10**: worker lifecycle and auditability are now strong, while provider configuration, external delivery, payment/KYC/affiliate activation, and explicit skill-flow depth remain deployment prerequisites rather than code defects.


## Post-ledger verification

The full `npm run test:routes` suite passed after the durable worker-ledger change. This covered composition, public routes and runtime contracts, Chat workspace routing, voice, QR, autonomous runtime, payment boundaries, channel parity and usage, network Chat, Topics, attachments, fresh databases, pilot readiness, discovery, presence, content, trust, disputes, circles, orders, admin/SEO, tasks, provider entities, multi-party requests, execution boundaries, native assistance, authentication, development guards, and economic lifecycle behavior.


## Deterministic failure-hardening tranche

The platform now treats missing or invalid security and AI prerequisites as explicit states rather than normal fallback paths. Production memory encryption requires `MEMORY_ENCRYPTION_KEY`; OTP signing requires the production JWT secret; QR signing requires `QR_CONTEXT_SECRET` or JWT configuration; cryptographic failures no longer return plaintext; malformed encrypted profile payloads no longer become empty objects; and development JWT fallback material is now ephemeral per process rather than a shared hardcoded secret.

The Gemini adapter no longer generates synthetic dispatch, pricing, booking, payment, or provider claims when the API is unavailable. It now exposes typed `GeminiProviderError` failures for missing configuration, failed requests, empty responses, and invalid prompts. Deterministic intent classification and canonical domain flows remain responsible for supported local routing, while provider-dependent generation fails visibly and safely.

This tranche passed build, lint, QR integration, authentication, autonomous runtime, Chat DOM-safety, production guard, AI smoke, and the complete route/lifecycle suite. The remaining fallback audit items are intentionally lower-priority legacy or development-only paths and should be migrated under the same contract rather than hidden behind broad catches.


## Red-team core-wiring tranche

The canonical Chat authority now handles authenticated natural-language `pause that`, `resume that`, `cancel that`, `stop following`, and `stop checking` commands directly against the owner-scoped autonomous goal for the current conversation. These commands no longer fall through into ordinary intent routing, and their persisted state is covered by a dedicated regression scenario.

Economic commission lookup now fails with a typed configuration error when no active commission exists or the stored rate is invalid; it no longer silently applies an arbitrary numeric fee. The behavioral-chat matrix is also registered under both the implementation script name and its documented matrix name, removing a verification-command wiring defect discovered during red-team execution.


## Live acceptance repair

The controlled development Chat reset now removes only the configured test actor's profile before canonical profile upsert. This prevents stale ciphertext created under a previous development key from blocking isolated acceptance runs, while preserving fail-closed decryption for all ordinary and production identities. The full 16-turn live HTTP/SSE acceptance sequence was replayed successfully with 32 persisted messages after the repair. Adjacent development-auth, fresh-database, conversation-first-authentication, and public-runtime regressions also passed.


## Continuous red-team tranche — live quality and Chat shell

The live-user quality harness now has an explicit readiness preflight: it requires the admin boundary to report `KURUKOO_AGENT_ENABLED=true` before exercising autonomous goal controls, while allowing `KURUKOO_AGENT_AUTONOMOUS=false` for a safe persistence-and-control test. This prevents a disabled runtime from producing misleading “no active autonomous objective” results.

The controlled development operator launch now supports `KURUKOO_TEST_RESET_OPERATOR_ON_LAUNCH=true` outside production. When enabled, it removes only the canonical operator's stale encrypted profile before recreating the isolated operator profile. Production behavior remains unchanged and memory decryption remains fail-closed.

The full live-user matrix passed across general, contextual reasoning, service correction, memory, reminder, autonomous control, and commercial conversations. It verified persisted conversation histories, truthful deferred provider state, natural-language pause/resume/cancel, and disclosed advertising behavior. A browser replay also found and fixed the Chat More-menu CSS defect that caused native `hidden` content to remain visible; the expanded/collapsed state is now covered by a static DOM-safety regression.
