# Kurukoo Current Product Truth

## Canonical definition

**Kurukoo is a conversational operating system for coordinating everyday intentions with people, services, products, places and bounded agents.**

Kurukoo can help directly, preserve context, discover options, coordinate participants, prepare an Economic Request or continue work over time. External fulfilment remains conditional on availability, authorization, evidence, configured providers and real-world confirmation. This is the canonical product definition for current documentation and product copy.

### Supporting model

- **Conversation** — primary interface and continuity layer.
- **Native Assistance** — reminders, safety/check-ins, memory, organisation, explanations and other actions Kurukoo performs directly.
- **Network Fulfilment** — matching a need to an appropriate provider, seller, business, contributor or other participant.
- **Economic Request** — the shared lifecycle for economic coordination where matching, quote, payment, fulfilment or completion is required.
- **Memory Profile** — the canonical identity/profile state for a person.
- **Presence** — consent-based availability/location state used by Nearby/Pulse and matching where appropriate.
- **Agents** — bounded autonomous goals that use existing Kurukoo tools and authorities.
- **External Execution** — authorised third-party actions through configured adapters.

## Terminology policy

| Term | Current use |
|---|---|
| Conversational operating system | Canonical current product description when explaining the whole system. |
| Conversational fulfilment network | Supporting description for the network and real-world coordination layer. |
| Personal assistance platform | Canonical supporting product description. |
| Everyday utility platform | Descriptive category only; not the canonical identity. |
| Economic OS | Internal architecture term only. |
| Multi-agent network | Product/architecture term for bounded cooperating agents using shared canonical services; never implies autonomous external execution without evidence. |
| Orchestration network | Internal/product architecture term; may be used when describing coordination mechanics. |
| Marketplace | Do not use as the primary product definition; Kurukoo includes network coordination beyond marketplace listings. |
| Chatbot | Do not use as the product definition; Chat is the interface to a broader system. |

## Current architecture rule

Kurukoo should remain one system rather than a collection of vertical applications:

```text
User
  → Conversation
  → Intent / FastText / AI
  → Canonical Skill
  → Native Assistance OR Economic Request OR another canonical capability
  → Shared Memory / Presence / Network / Agent / Notification services
  → truthful result
  → continued conversation
```

Category-specific behaviour belongs in configuration, skill metadata and shared capability services. It must not create a separate economic engine unless a genuinely new architectural boundary is proven.

## Deployment truth

The repository is currently a single-process `sql.js` launch architecture. Real external execution remains provider-dependent. The following are not automatically live merely because repository adapters exist:

- WhatsApp / Telegram / SMS / USSD / voice delivery
- FCM delivery
- real payment settlement / regulated escrow
- real provider identity verification
- routable private-number masking
- production dispatch
- production object storage / malware scanning
- WebRTC relay infrastructure
- MQTT/IoT broker infrastructure

Repository-side implementation should be completed and feature-flagged where possible, but the UI and Chat must never represent an unavailable external action as completed.

## PWA truth

The PWA is the reference application experience for future native iOS and Android clients.

The public web and the installed application are related but distinct:

- **Public web:** discovery, SEO, resources, marketing and public network surfaces.
- **Installed app:** conversation-first personal workspace, requests, reminders, saved items, notifications, Discover, tasks, Points, safety, memory and account state.

Future native clients should inherit the PWA's product interaction model and design system rather than creating a separate product language. The Chat composer also retains an unsent draft only in the current browser session, keyed to the active conversation, so backgrounding or a temporary disconnect does not erase text. Drafts are cleared when submitted and are not promoted into Memory or server persistence.

## Memory truth

The Memory Profile is canonical user state. Working memory is selective and bounded. A value must have truthful provenance; unknown remains unknown. Authenticated users can review active fact-level context through the canonical memory boundary and revoke their own retained facts; revoked facts leave active retrieval and remain auditable without exposing source references in the self-service response.

Memory-related concepts:

- stable self-knowledge
- preferences
- skills / roles
- episodic context
- open intentions
- recent conversation context

Memory retrieval and lifecycle may evolve as long as the implementation and Blueprint agree on the same actual launch architecture and cost model.

## Feature-flag truth

Feature flags are deployment controls, not substitutes for external readiness. A feature may be implemented while remaining disabled because its provider, infrastructure, market or risk prerequisites are missing.

The canonical registry is `src/services/featureFlags.ts`.

## Conversational intelligence truth

Conversation is not required to map every turn to a skill. The existing `canonicalChatTurnService` remains the sole turn authority: it assembles the bounded working context, asks the existing Brain/context-arbitration boundary to select or preserve context, and passes that decision into `intentRouter` and `unifiedAiEngine`. Natural dialogue may remain dialogue; canonical services still own all state mutation and consequential actions.

The conversational model boundary is provider-neutral. Deterministic rules and high-confidence FastText aliases remain authoritative for safety, identity, exact controls and canonical actions. Simple dialogue uses the local SmolLM2 path or a bounded cache. Ambiguous, interrupted, multi-context or low-confidence fallback turns are eligible for the same unified model boundary with bounded context; when a stronger hosted provider is not configured, the system attempts local SmolLM2 and then returns a truthful template fallback. No hosted provider is implied by the fallback.

Working prompts receive only bounded recent conversation, selected context, preserved concurrent context identifiers, relevant memory, pending fields and current channel/identity hints. Internal labels, provenance markers, prompts, routing metadata and private memory are never user-facing. Model output is sanitized for protocol delimiters, internal labels and repeated lines before it reaches Web, WhatsApp, Telegram or first-class agent responses.

First-class agents reuse `aiAgentService`, `internalCoordinator`, `agentRuntime` and `unifiedAiEngine`; no second Brain, router, memory system, provider system or agent runtime exists. Agents may communicate naturally through their configured persona, but quotas, ownership, permissions, points, confirmations, tool authorization, execution evidence and cancellation remain canonical and deterministic.

Local proving configuration:

```bash
PORT=3001 KURUKOO_SMOLLM2_LOCAL=true KURUKOO_AI_HOSTED_PROVIDER=none \
KURUKOO_AGENT_ENABLED=true KURUKOO_AGENT_AUTONOMOUS=true npm run dev
```

Open `http://127.0.0.1:3001/chat/`. The local model is the configured SmolLM2 checkpoint (`SMOLLM2_MODEL`, default `HuggingFaceTB/SmolLM2-1.7B-Instruct`). The current proving run used the cached q4 `HuggingFaceTB/SmolLM2-1.7B-Instruct` checkpoint; no Kurukoo-trained adapter is active. No provider API key is required for local inference. If local inference is unavailable, the same canonical path falls back to bounded truthful Kurukoo templates. Hosted model use requires its own configured key, privacy/retention decision, quota review and independent provider validation; no external capability is represented as live without evidence.

The focused human-style regression is `npm run test:conversational-intelligence`. It covers ordinary dialogue, emotional language, incomplete phone troubleshooting, interruption, correction, context clarification, action transition, bounded memory, and prompt-injection resistance. This test demonstrates repository behaviour; it is not a substitute for human quality review or external-provider validation.


## Universal capability/action protocol truth

Natural language is the primary user interface. The AI coordinates canonical Kurukoo capabilities, while canonical domain services remain authoritative for state, authorization, consent, execution and evidence.

The shared protocol is implemented by `src/services/universalCapabilityProtocol.ts` and exposed through the existing Chat API at `GET /api/chat/capabilities`. It projects the existing skill catalog and bounded agent tools into one machine-readable descriptor. The descriptor includes owner, mode, permissions, risk, consent and confirmation requirements, inputs, lifecycle, facts, evidence, activation, external dependency, next-action and recovery metadata.

Action proposals are advisory and never mutate state directly. Exact context/object actions re-enter `canonicalChatTurnService`, which preserves owner-scoped identity and fails closed for unsupported, stale, foreign, missing or unauthorized objects. Structured results are streamed through the existing Chat SSE channel as `capability_result` and remain compatible with existing cards and continuation actions.

The result contract distinguishes accepted, waiting, needs-user, confirmation-required, blocked, failed, completed, externally-pending and unavailable-external-dependency. A result may be explained naturally, but no model or channel may invent completion, provider availability, payment, evidence, inventory, price or external delivery. Recovery preserves the canonical object and offers retry, resume, cancel, wait or escalation through the existing canonical owner.

## Student-model proving truth — 17 August 2026

The canonical synthetic generators were rerun locally. The provider-outcome laboratory produced 24,000 synthetic trajectories across 205 skills and 46 families, covering 10 channels, 7 market/locale combinations, 6 actor types, linked-device and QR continuation, provider outcomes, reminders, subscriptions, agents, memory, notifications, products/orders/cart, safety, consent, payment boundaries, failures, recovery, relative references and multi-context horizons 5, 10, 20, 40, 80 and 81. The laboratory contained 943,188 turns. Its structural benchmark passed with multi-turn rate 1.0, arbitration-pattern rate 1.0, forbidden-claim boundary rate 1.0 and adversarial coverage 0.9495. These are corpus/contract measurements, not model-quality claims.

The explicit teacher-candidate curator examined 25,506 synthetic rows from the current core and provider-outcome inputs. It admitted zero rows because every row lacked `reviewed=true`; no teacher-generated or deterministic candidate was silently trusted. Consequently, the accepted corpus is empty and the real QLoRA training entrypoint fails closed before model loading. No Kurukoo-trained adapter, candidate registry entry, shadow deployment, canary deployment or production promotion exists.

The current base SmolLM2-1.7B q4 runtime was measured locally on the twelve critical conversational benchmark turns. Observed wall-clock latency ranged from approximately 5.8 seconds to 47.0 seconds with a 48-token generation cap. The benchmark exposed advisory-model weaknesses including overly generic action responses, occasional provider/assistant framing, and unsupported location/provider examples. These outputs reinforce the canonical rule that SmolLM2 remains advisory and that context arbitration, truth boundaries, canonical capability proposals and canonical services own consequential behavior.

The student-model programme therefore remains at: regenerated corpus, explicit curation gate, guarded training entrypoint, measured base baseline, and promotion registry boundary. It has not reached trained-candidate, improved, production-ready or promoted status.

## Cloud Run and teacher-proving update — 17 August 2026

The teacher-candidate generator now consumes the current scenario-lab schema, falls back to the canonical `userMessage` when a trajectory field is absent, and performs deterministic stratified sampling across skill, family, actor, channel, market and locale before filling its requested budget. Teacher output remains candidate-only and cannot mutate canonical state or authorize training.

A local Mistral candidate-generation attempt was made through the configured provider boundary, but the runtime did not expose `MISTRAL_API_KEY`; zero teacher candidates were generated and no rows were accepted. This is an exact provider-configuration boundary, not a model-quality result. The accepted corpus remains empty and QLoRA training remains correctly blocked.

Cloud Run proving preparation now exists within the existing application architecture. `Dockerfile` uses the current Node build and `npm start` entrypoint. `deploy/cloud-run/service.yaml` declares one bounded instance with a 4 GiB memory limit, one-request concurrency, a 300-second timeout and the existing `/health` boundary. SmolLM2 cache state is explicitly ephemeral under `/tmp`, while persistent user/application state remains outside the container filesystem. Local SmolLM2 is disabled by default in the Cloud Run descriptor and must be explicitly enabled only after measuring startup, memory and inference behavior on the selected Cloud Run configuration. This is a repository-side proving path, not proof of a live Cloud Run deployment.


## Cross-topic continuation correction — 17 August 2026

Live acceptance exposed and corrected a universal arbitration defect: when an open cleaner request had a pending location field, the later statement “My phone is acting weird” was previously treated as a name/location clarification. The arbiter now treats standalone problem descriptions as conversation-only topic switches when they protect an active request, while leaving them as ordinary general conversation when no request is active. A subsequent explicit “I need someone to fix it” is a new Economic Request, not a recency-based continuation of the cleaner request. “Actually leave that for now,” a reminder switch, “go back to the phone,” relative price language and final confirmation were then verified through the real Chat SSE path. Missing job/location and verified quote/evidence gates continued to block external execution truthfully.


## Human-curated student-model workflow — 17 August 2026

The repository now includes the canonical human-in-the-loop curation workflow within the existing Admin Control Room. `/admin/curation.html` is a protected administrative review surface; its `/api/admin/curation/*` routes require the existing admin authentication boundary. Teacher candidates are imported as pending, untrusted records with trajectory, provenance, metadata, score and failure dimensions. Reviewers can inspect the complete candidate, record accept/reject/second-review decisions, or submit a rewrite that creates a new linked pending version without replacing the original.

The acceptance predicate remains explicit: `reviewed=true AND accepted=true`. Scores, teacher confidence, provider identity, fluency, or generation source never imply acceptance. Reviewer identity, timestamp, decision, reason, notes, candidate version and optional dataset version are recorded for audit. The offline curator additionally fails closed when accepted rows do not meet the configured minimum composition across skill, actor, market, locale, scenario type, natural conversation, adversarial cases and long-horizon cases. The admin surface prepares data only; it never launches training or promotes a model.

The current truthful state is that the review workflow is repository-side ready, while the accepted corpus remains empty until a human reviewer explicitly accepts suitable candidates and the resulting corpus meets coverage requirements. No Kurukoo-trained adapter or production model activation is claimed.


## Real teacher curation proof — 17 August 2026

The existing teacher pipeline generated a bounded two-row batch through the configured OpenAI-compatible endpoint using catalog model `claude-haiku-4-5`; Mistral and Gemini credential variables were absent in the proving environment. The adapter was corrected to honor `OPENAI_API_BASE` and to parse provider-formatted JSON without changing the candidate-only boundary. Both generated rows were imported into the protected curation queue with their scenario IDs, skills, families, actors, markets, channels, lifecycle variants, teacher provider/model, trajectory and provenance preserved.

The real review lifecycle was exercised: one candidate was judged in need of a rewrite and produced a new pending version linked by rewrite lineage; the other received a first review, a second review and an explicit acceptance with reviewer quality scores. The accepted-corpus export contained one explicit accepted row, but the existing curator rejected it for insufficient quality evidence in the composed training record and reported missing coverage for additional skills, locales, scenario types, natural/adversarial/long-horizon cases. Training therefore remained blocked correctly. No model artifact was trained, promoted or activated.


## Emergency interrupt truth — 17 August 2026

Emergency handling is a first-class interruptive branch in the canonical Chat turn. It is evaluated before guest onboarding, authentication, Economic Requests, provider discovery, reminders, agents, memory, products, notifications and ordinary conversation. A guest can say that they need an ambulance, police or fire help and receive the emergency state, verified directory route and dial option without being asked for name, phone or OTP first. Ordinary guest economic actions still follow the existing authentication requirement.

The current authoritative directory record is Nigeria nationwide 112 for ambulance, police and fire, sourced from the Nigerian Communications Commission. Chat displays service, approximate/unknown location, dial state, fallback guidance and the fact that Kurukoo is not an emergency responder. A browser `tel:112` action is available where the device supports it. No connection, ringing, dispatch, responder acceptance, ambulance availability, diagnosis or police authority is claimed. Actual telephony/provider evidence remains external.

The red-team regression covers emergency ambiguity, ambulance, police, fire, unconscious person, assault, unknown location, no account, interruption of an existing request, cancellation and ordinary-auth preservation. The local simulation proves canonical Chat behavior and truthful unavailable external execution; it does not prove a real emergency call.

## Interaction-policy convergence — 17 August 2026
The canonical Chat turn now resolves the existing interaction policy before guest authentication, onboarding, context arbitration, generic intent routing and model-generated conversation. The resolved policy is persisted in assistant message metadata and returned in the canonical turn result, making priority, interruption, guest access, authentication timing and resumability observable at the existing Chat boundary.

Critical emergency handling remains guest-accessible for initial help while ordinary guest account-owned actions retain their authentication boundary. Security interruptions now provide immediate protective guidance for stolen or lost phones, account-access reports and unrecognized payments without mutating account ownership, issuing refunds, cancelling payments or claiming recovery. Those mutations remain authenticated, exact-owner and explicitly confirmed actions.

The registered `emergency` universal capability is also the canonical descriptor for the existing `safety/emergency_dispatch` executor alias. Payment, remote/device, memory and public-attribution policy profiles continue to fail closed on missing identity, confirmation or external evidence. Public actions require a separate draft/review/commit boundary.

The interaction-policy matrix passed against 227 canonical capability policies, guest and authenticated emergency flows, security interruption, payment and remote external boundaries, memory provenance, reminder interruption semantics and public commit semantics. The full all-domains, routes, security, PWA, public, build, lint and strict CSS validation suites passed. Browser verification showed the emergency card without onboarding and a clean guest security-interruption card without a name, phone or OTP gate. External telephony, payment, device, channel and provider activation remain unclaimed until independently evidenced.


## Readiness telemetry and Cloud Run contract — 17 August 2026

The health boundary now exposes canonical pilot-readiness items for Web, WhatsApp, Telegram, SMS, USSD, FCM, Voice, Voice TTS, Voice transcription, SmolLM2, payment and the bounded agent runtime. Existing credential-presence compatibility fields remain available, but readiness state and explanatory notes are the authoritative interpretation; a configured secret alone does not mean a provider is live, available, connected or externally verified.

The direct Cloud Run proving profile is 4 vCPU, 4 GiB memory, one-request concurrency, a 300-second timeout, three-instance maximum and an ephemeral `/tmp/huggingface` model cache. User/application state is not treated as durable container state. The current SQL.js deployment is intentionally constrained to one application worker; increasing `KURUKOO_WORKERS` requires an approved multi-process persistence and distributed-limiting boundary rather than an environment-only change.
