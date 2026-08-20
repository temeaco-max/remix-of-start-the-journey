# Training

Initial training target: `HuggingFaceTB/SmolLM2-1.7B-Instruct` using LoRA/QLoRA.

Training must be reproducible and staged. Each run records:

- base model revision;
- dataset version;
- training configuration;
- random seed;
- code revision;
- adapter configuration;
- hardware/runtime profile;
- resulting artifact hashes;
- evaluation references.

The trainer must support resuming, checkpointing and exporting adapters. A later export stage may merge and/or quantize the adapter for local production inference.

No production user data may enter training without the repository's privacy/redaction policy being satisfied.

## Current proving run

The current base target is `HuggingFaceTB/SmolLM2-1.7B-Instruct` with QLoRA requested when CUDA is available. The trainer is now pointed at `ml/datasets/kurukoo-accepted-v1.jsonl`, not the uncurated core training split. It fails closed unless every row explicitly carries `reviewed=true` and `accepted=true`.

On the current regenerated synthetic inputs, the curation result was:

| Measure | Result |
|---|---:|
| Rows examined | 25,506 |
| Explicitly accepted rows | 0 |
| Rejected because `reviewed` was not true | 25,506 |
| Training status | Blocked before model loading |
| Adapter produced | No |
| Production runtime changed | No |

This is a measured gate result, not a training failure caused by hardware. Once a human-approved accepted corpus exists, the opt-in trainer records base model, dataset SHA-256, sequence length, epochs, batch size, gradient accumulation, learning rate, quantization request, seed, output path and candidate-only status. It does not promote or activate an adapter.

## Curation admission and composition gate

The Admin Control Room prepares the corpus but never starts a training job. The curation store records candidates, explicit reviewer decisions, rewrite lineage, and audit events. `ml/curate_candidate_corpus.py` admits a row only when `reviewed is True` and `accepted is True`, then applies the quality thresholds and configurable composition minimums. The default minimums require at least one non-unknown value for skill, actor, market, locale, scenario type, natural conversation, adversarial cases, and long-horizon cases. Missing coverage produces `blocked_coverage_requirements`; zero accepted rows produces `blocked_no_explicitly_accepted_examples`.

The generated manifest includes the accepted dataset SHA-256, composition counts, minimum requirements, and exact coverage failures. This manifest is a preparation and audit artifact. It does not authorize model loading, artifact promotion, shadow deployment, canary rollout, or production activation.

## Current catalogue truth

The original canonical catalogue contains 205 base skills across 46 families. Kurukoo has since expanded the active converged conversational catalogue to **239 skills**, including local-market extensions and device/repair specialisations. Runtime behaviour contracts, FastText routing hints and the current SmolLM2 training-universe generator are sourced from the converged catalogue. Historical proving runs below intentionally retain their original 205-skill counts and should not be interpreted as the current runtime catalogue size.

## Whole-system proving pass — 17 August 2026

The existing proving machinery passed without reducing the original configured scenario space. The historical provider-outcome scenario laboratory output retained 24,000 scenarios across 205 base skills, 46 families, 7 market configurations, 10 channels and 20 lifecycle variants, with an average of 39.30 turns. The trajectory harness passed horizons 5, 10, 20, 40, 80 and 81 with 119 turns and zero failures. The conversation trajectory evaluator passed 1,003 trajectories, 12,040 turns, 3,007 relative references and 4,343 hard cases with zero failures.

The current training-universe generation is no longer limited to that historical 205-skill base set: it resolves the 239-skill converged catalogue, associated behaviour packs and execution contracts. New catalogue extensions therefore enter training/evaluation generation rather than remaining runtime-only additions.

The accepted-corpus gate remains fail-closed. No generated scenario, teacher candidate, or score has been promoted into an accepted training corpus by inference. No Kurukoo adapter is promoted or activated without the explicit curation, evaluation and runtime gates. Hosted Mistral/Gemini/Groq availability and account limits are checked through their configured activation/runtime boundaries and are never inferred from repository tests alone.
