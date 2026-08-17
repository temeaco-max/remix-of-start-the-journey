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
