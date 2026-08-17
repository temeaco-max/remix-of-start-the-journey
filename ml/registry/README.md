# Model Registry

The registry records candidate, shadow, canary, active and retired Kurukoo model versions.

Each version must reference:

- immutable model artifact;
- base model revision;
- dataset version;
- training run;
- evaluation results;
- resource benchmark;
- runtime compatibility;
- promotion history;
- rollback predecessor.

Only one production model should be active for a given runtime role unless an explicit routing policy says otherwise.

## Promotion gate

A trained adapter may enter the registry only as a candidate after artifact verification and evaluation. The registry must record the base model revision, adapter hash, accepted dataset hash, training run, evaluation results, resource benchmark, runtime compatibility, approval status and rollback predecessor.

The current proving run has no candidate artifact because the accepted corpus is empty. Therefore the registry remains unchanged: there is no candidate, shadow, canary or active Kurukoo-trained adapter. The production baseline remains the configured SmolLM2-1.7B runtime plus the canonical deterministic safeguards.

Promotion is explicit and human-reviewed:

```text
candidate → shadow → canary → active
                    ↘ rejected/retired
```

Artifact verification can return `eligible_for_registry_review`, but it cannot approve, promote or activate a model.
