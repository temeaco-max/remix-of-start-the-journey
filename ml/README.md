# Kurukoo ML Workspace

This directory contains the **offline** Kurukoo model-training, scenario-generation, evaluation, export and registry tooling.

It is intentionally separate from the production TypeScript runtime. Production loads versioned model artifacts through the existing AI/model boundary; it does not train models.

## Structure

```text
ml/
├── README.md
├── pyproject.toml
├── requirements-smollm2.txt
├── train_smollm2_qlora.py
├── verify_smollm2_artifact.py
├── config/
│   ├── training.yaml
│   └── model-registry.json
├── schemas/
│   ├── scenario.schema.json
│   ├── training-example.schema.json
│   ├── evaluation-result.schema.json
│   └── model-manifest.schema.json
├── prompts/
│   ├── ontology.md
│   ├── arbitration.md
│   ├── clarification.md
│   ├── critique.md
│   └── scenario-generation.md
├── scenarios/
│   └── README.md
├── datasets/
│   └── README.md
├── teachers/
│   └── README.md
├── training/
│   └── README.md
├── evaluation/
│   └── README.md
├── export/
│   └── README.md
└── registry/
    └── README.md
```

## Rules

1. No secrets or raw production user data are committed here.
2. Dataset versions are immutable.
3. Synthetic scenarios are not automatically trusted training data.
4. Teacher output is candidate material only.
5. Model promotion requires evaluation.
6. Production state remains outside the model.
7. Training is opt-in and must never run as part of application startup.
8. A trained adapter must match the dataset SHA-256 recorded at training time.
9. Artifact verification never performs registry promotion or production activation.

## Local SmolLM2 training

Prepare the guarded training job without training:

```bash
python3 ml/train_smollm2_qlora.py
```

Install the optional environment first:

```bash
python3 -m venv .venv-smollm2
. .venv-smollm2/bin/activate
pip install -r ml/requirements-smollm2.txt
```

A real LoRA/QLoRA run requires explicit opt-in:

```bash
KURUKOO_ENABLE_TRAINING=true \
KURUKOO_SMOLLM2_BASE_MODEL=HuggingFaceTB/SmolLM2-1.7B-Instruct \
python3 ml/train_smollm2_qlora.py
```

The runtime writes a candidate artifact manifest and never promotes the resulting adapter automatically.

Useful controls include:

```text
KURUKOO_TRAIN_MAX_LENGTH
KURUKOO_TRAIN_EPOCHS
KURUKOO_TRAIN_BATCH_SIZE
KURUKOO_TRAIN_GRAD_ACCUM
KURUKOO_TRAIN_LR
KURUKOO_TRAIN_4BIT
KURUKOO_TRAIN_SEED
```

## Verify a trained candidate

```bash
python3 ml/verify_smollm2_artifact.py
```

To additionally enforce conversational evaluation thresholds:

```bash
KURUKOO_SMOLLM2_EVAL_SUMMARY=data/scenario-lab/teacher-evaluation-summary.json \
python3 ml/verify_smollm2_artifact.py
```

The verifier checks artifact presence, adapter/tokenizer files, dataset hash, candidate-only flags and optional evaluation thresholds. It returns `eligible_for_registry_review` only; the existing model registry remains the sole promotion boundary.

## Training/evaluation flow

```text
canonical Kurukoo ontology
    ↓
ml:generate-universe
    ↓
synthetic candidate dataset
    ↓
teacher evaluation / human curation
    ↓
local LoRA/QLoRA training
    ↓
artifact verification
    ↓
existing model registry review
    ↓
shadow → canary → production
```

The teacher and student are not allowed to mutate canonical Kurukoo state, invent provider/payment/evidence facts, or silently change runtime policy.

## Actual student-model proving status

The current proving workflow is explicit and fail-closed:

```text
canonical generators
    ↓
synthetic candidate corpora
    ↓
teacher generation/critique (untrusted)
    ↓
explicit review=true AND accepted=true
    ↓
ml/curate_candidate_corpus.py
    ↓
QLoRA training
    ↓
artifact verification
    ↓
head-to-head evaluation
    ↓
candidate → shadow → canary → active
```

Run curation with:

```bash
npm run ml:curate
```

The curator never assigns approval. On the current regenerated corpus, all 25,506 rows were synthetic but unreviewed, so the accepted corpus contains zero rows and training is correctly blocked. This is intentional: generated data is not automatically trusted training data.

The 17 August 2026 structural scenario run generated 24,000 provider-outcome trajectories across 205 skills and 46 families, with 943,188 turns and horizons 5, 10, 20, 40, 80 and 81. Structural coverage passed, but this is not a model-quality or promotion result. The actual cached SmolLM2-1.7B baseline was also probed on the critical conversational benchmark; its measured outputs remain advisory and are not promoted as Kurukoo-trained behavior.

A real training run requires an explicitly curated non-empty accepted corpus and `KURUKOO_ENABLE_TRAINING=true`. The trainer now rejects uncurated rows, records the accepted dataset hash and training parameters, and never changes production runtime selection.

No Kurukoo-trained adapter has been produced or promoted in the current run.

## Control Room curation workflow

The canonical human-in-the-loop surface is `/admin/curation.html`, backed by the protected `/api/admin/curation/*` routes. The queue imports teacher candidates into the existing SQL.js database as `pending` records and exposes trajectory content, skill/family, actor, market, locale, channel, lifecycle, scenario variant, teacher/provider metadata, candidate score, failure dimensions, provenance, and review status. Queue ordering prioritises difficult or incomplete candidates; it does not convert a score into approval.

A candidate can enter the accepted corpus only when a reviewer has explicitly recorded both `reviewed=true` and `accepted=true`. The available decisions are `accept`, `reject`, `rewrite`, and `second_review`. Rewrites create a new pending candidate with `rewrite_of`, `original_id`, an incremented version, the original provenance, rejection reason, and audit lineage; the original candidate is never silently replaced. Reviewer identity, timestamp, decision, reason, notes, candidate version, and optional dataset version are persisted in the curation audit table.

The accepted-corpus gate now fails closed for empty accepted data and for missing configurable composition coverage. The default coverage dimensions are skill, actor, market, locale, scenario type, natural conversation, adversarial cases, and long-horizon cases. Override minimums for an offline run with `--coverage '{"skill":2,"actor":1}'` or `KURUKOO_MIN_COVERAGE_JSON`. This gate prepares a corpus; it never launches training from the admin UI. Training remains an explicit offline operation and model promotion remains a separate registry decision.

The current state remains truthful: the repository-side queue and review lifecycle are ready, but no candidate is accepted merely because it was generated or scored. Until a human-curated corpus satisfies the configured coverage minimums, the accepted corpus and student-model training remain blocked.
