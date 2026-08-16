# Kurukoo ML Workspace

This directory contains the **offline** Kurukoo model-training, scenario-generation, evaluation, export and registry tooling.

It is intentionally separate from the production TypeScript runtime. Production loads versioned model artifacts through the existing AI/model boundary; it does not train models.

## Structure

```text
ml/
├── README.md
├── pyproject.toml
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
