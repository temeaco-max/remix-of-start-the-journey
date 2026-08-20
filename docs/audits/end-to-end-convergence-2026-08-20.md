# Kurukoo End-to-End Repository Convergence — 2026-08-20

## Scope
This audit reconciles the current `main` implementation against the product/architecture direction developed through the repository history: canonical conversation, Memory Profile, instruction-driven behaviour, 239-skill catalogue, first-class AI agents, delegated representation, commercial ledger, FastText/SmolLM2/Mistral routing, compound fulfilment, cross-platform UI, channels, and deployment readiness.

## Repository-side convergence now present

- Canonical Chat remains the shared conversation owner across Web/PWA and external channels.
- Conversation acts are deterministic for common chat behaviour; FastText is a cheap signal, not the authority.
- Skill routing can consume the converged catalogue and namespaced FastText skill hints.
- Skill behaviour is instruction-driven and memory-aware.
- Every converged skill now has a canonical execution contract describing mode, requirements, capabilities, truth boundary, memory policy, completion evidence and failure modes.
- Device/repair behaviour is taxonomy-aware rather than brand-flat.
- Bin-day behaviour explicitly requires authoritative schedule information before creating a dynamic reminder.
- First-class AI agents and user-delegated representation share the agent/capability architecture.
- Commercial value is represented through the shared commercial ledger and settlement model.
- Cline is admin-only and not part of consumer inference.
- Mistral is a hosted reasoning boundary; SmolLM2/local inference is the lower-cost path.
- Compound fulfilment legs support coordinated multi-step outcomes such as collection → repair → return.
- Web/PWA and native visual authorities remain separated while sharing semantic state language.
- Existing repository scenario labs/audits remain synthetic/deterministic and do not claim real providers or external infrastructure.

## P1 gaps deliberately left as external activation

These are not missing product architecture and should not be “implemented” with simulation:

- real PSP/payment contracts, settlement and regulated escrow;
- real provider identity/verification adapters and evidence expiry/revocation;
- real FCM/APNs delivery and receipts;
- real inventory/catalogue connectors where local data is unavailable;
- physical iOS/Android validation of microphone, playback, QR camera and first-launch persistence;
- production PostgreSQL/Redis/object storage when actual workload or deployment topology justifies migration;
- GitHub branch protection and credential rotation, which require repository-owner authority;
- upstream dependency fixes such as the documented `sharp` advisory path.

## New executable checks

- `scripts/audit-skill-execution-contracts.ts`
- `scripts/test-skill-execution-contracts.ts`
- `scripts/test-economic-category-convergence.ts`

These checks are repository-side evidence gates; they do not promote external activation states.

## Rule
Do not create another per-skill chatbot, per-agent billing engine, or model-specific behaviour layer. Continue extending the shared instruction, skill, capability, agent, commercial and evidence authorities.
