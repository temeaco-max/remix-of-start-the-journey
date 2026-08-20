# Kurukoo Platform Convergence Audit — 20 August 2026

This is the current repository-level convergence record. It supersedes older point-in-time audit counts where those counts no longer match the converged runtime catalogue.

## Canonical platform shape

User → canonical Chat turn → interaction priority/context arbitration → conversation act + FastText signal → converged skill/behaviour → Memory Profile context → SmolLM2/Mistral inference when needed → capability registry → canonical domain service → canonical state/evidence → Chat/notification/channel continuation.

Economic outcomes additionally pass through the Economic Request lifecycle and the Commercial Ledger. Agents use the existing agent runtime and may be Kurukoo-owned or user-delegated representatives. Skills, agents and channels do not create second mutation authorities.

## Current catalogue

The runtime skill catalogue is now the converged catalogue exposed by `skillCatalogueConvergence` and `skillBehaviourConvergence`, currently 239 skills including local-market extensions and device/service specialisations. The original core catalogue remains an input to the convergence layer rather than the final catalogue authority.

## AI/training convergence

The SmolLM2 training-universe generator now reads the converged catalogue and canonical execution contracts. The previous `kurukoo-core-v1` cached corpus remains historical/stale until the new generator is executed; it must not be described as representing all current skills.

The candidate corpus remains synthetic and requires curation/evaluation before model training or promotion. Training data is not runtime authority.

FastText remains a cheap classifier/signal. Deterministic conversation acts handle basic dialogue before classifier uncertainty. Skill routing is reconciled against the converged catalogue, and ambiguity may escalate to SmolLM2/Mistral.

## Skill completeness

Each converged skill must expose behaviour instructions, requirements, capabilities, Memory Profile policy, truth boundaries, completion evidence and failure/recovery semantics. `skillExecutionContract` is the canonical execution contract and is used by runtime behaviour and outcome-completeness auditing.

Device/repair skills share the device taxonomy and repair behaviour rather than embedding every device model into separate chat implementations.

## Runtime proving

`/health` and `/readyz` expose runtime state. `scripts/runtime-smoke.ts` provides the deployed HTTP smoke path. The live host must be supplied through `KURUKOO_BASE_URL`; no historical preview URL is treated as the current deployment.

## External activation boundary

The repository must remain truthful about dependencies that cannot be created by code alone: payment/escrow PSP activation, real provider/identity networks, FCM/APNs, WhatsApp/Telegram live sessions, phone-number masking, object storage/malware scanning, WebRTC relays, MQTT/device operations, durable production database/queue infrastructure, and physical-device validation.

A development/sandbox simulation may be used for bounded regression only and must not be promoted to a production operational claim.

## Audit command

Run:

```bash
npx tsx scripts/audit-platform-convergence.ts
```

This verifies canonical owner placement, catalogue completeness, skill execution contracts, core routing regressions and AI/integration runtime snapshots, then writes `data/audits/platform-convergence.json`.
