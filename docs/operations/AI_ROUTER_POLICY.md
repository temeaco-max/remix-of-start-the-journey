# Kurukoo AI router policy

The unified AI gateway remains the sole provider execution boundary. `src/services/aiInferencePolicy.ts` decides which tier should handle a request.

Order of preference:

1. Deterministic rules / FastText for simple conversation acts and policy decisions.
2. Local SmolLM2 for low-cost routine semantic work.
3. Healthy free/low-cost hosted capacity, when enabled and configured: Groq, Gemini or OpenRouter.
4. Paid hosted reasoning such as Mistral for high-stakes, planning, agent-execution or complex requests when cheaper capacity is unavailable or unsuitable.
5. Existing provider fallback/health logic remains authoritative if a selected provider fails.

`KURUKOO_AI_FREE_FIRST=true` enables the free-first policy (default). Free tiers are treated as finite capacity; Kurukoo must never assume a provider's free quota is unlimited or guaranteed.

Provider health, quotas, cost telemetry and agent budgets continue to influence the final execution path in the existing unified AI service.
