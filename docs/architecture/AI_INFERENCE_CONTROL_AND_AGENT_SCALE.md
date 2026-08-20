# AI inference control and agent scale

## Canonical decision

Kurukoo controls consumer agent inference. Users do not need to bring model keys to operate normal Kurukoo agents. Cline is an administrator-only engineering/operator integration and is not exposed as a consumer inference provider.

## Routing policy

The canonical conversational generator now uses `aiInferencePolicy.ts`: low-complexity greetings and support use the lowest-cost configured/local path; planning, agent execution and higher-authority work can escalate to Mistral when configured; canonical services remain authoritative.

## Self-hosted inference

Kurukoo's existing SmolLM2/model-registry path remains the intended low-cost inference foundation. The architecture is deliberately model-replaceable: a future Kurukoo-hosted model can replace or complement SmolLM2 without changing skill instructions, agent identity, capabilities or commercial contracts. The system must be evaluated by throughput, latency, memory footprint, quality, safety and total cost before promoting a larger open-weight model such as a Qwen-family or later model.

## Scaling target

For large populations, scale inference workers and queues rather than creating a separate runtime per user. Shared instruction packs, structured memory, context retrieval, response caching, quotas and model routing reduce repeated prompt work. One million users does not require one million bespoke conversational implementations.

## Billing

Users are billed for Kurukoo agent/service capabilities, not for ownership of a particular underlying model. Provider inference cost is an internal Kurukoo cost. Commercial pricing can incorporate model cost, tool execution, external provider cost and service margin through the canonical commercial ledger.
