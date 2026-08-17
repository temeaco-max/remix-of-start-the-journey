# Evaluation

Evaluation is a release gate, not a post-hoc test file collection.

Required suites:

- ontology/terminology;
- intent;
- context arbitration;
- interleaving/resumption;
- Mikel-class ambiguity;
- clarification naturalness;
- capability selection;
- Economic Request continuity;
- memory boundaries;
- agent lifecycle;
- notification/reminder continuity;
- truthfulness/external-boundary claims;
- safety/policy;
- adversarial prompts;
- regression against the current production baseline;
- latency/RAM/CPU profile.

Every promoted model must include a machine-readable evaluation result and a human-readable release summary.

## Head-to-head proving contract

The benchmark must run the same Kurukoo context contract, recent conversation, goal state, relevant memory, active contexts, capability vocabulary and truth boundaries for every available tier. The intended comparison is:

| Tier | Current status |
|---|---|
| Base SmolLM2-1.7B-Instruct | Measured locally on the critical conversational benchmark |
| Kurukoo-trained SmolLM2 adapter | Not available; training is blocked until explicit curation produces accepted rows |
| Mistral teacher/reference | Configured in the local environment but not independently verified; benchmark status was unavailable and no teacher result was admitted |
| Gemini teacher/reference | Configured in the local environment but not independently verified; no teacher result was admitted |
| Deterministic/template baseline | Available as the truthful fallback boundary |

The local baseline benchmark measured the cached q4 1.7B model on the twelve critical natural-language cases, including conversation, exploration, action transition, interruption, correction, relative references, dialect, and multi-context resumption. Observed wall-clock latency ranged from approximately 5.8 seconds to 47.0 seconds under the local CPU runtime and a 48-token cap. These are baseline measurements for this environment, not a claim of cloud performance or trained-model improvement.

The candidate promotion gate requires golden, adversarial, long-horizon, capability-proposal, natural-conversation, safety and resource evaluation. A candidate must improve Kurukoo-relevant behavior over the base without unacceptable regression in truthfulness, context retention, identity preservation, action discipline, premature-action rate or safety. No candidate is promoted automatically.
