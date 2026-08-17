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
