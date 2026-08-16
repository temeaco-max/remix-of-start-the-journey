# Teacher Models

Teachers are offline evaluators and data generators. They do not execute Kurukoo capabilities.

The interface supports provider adapters for stronger development models, including Mistral, Gemini and OpenAI-compatible teachers where permitted by their APIs/quotas. No teacher is a production dependency.

Teacher tasks:

- label intent;
- select candidate capability;
- identify candidate context owner;
- draft clarification;
- critique response;
- extract requirements/entities;
- generate counterexamples;
- generate multi-turn candidate trajectories;
- assess truthfulness and policy adherence;
- explain why a candidate arbitration decision is wrong.

## Candidate trajectory generation

`generate_trajectory_candidates.py` uses a configured teacher model to generate natural assistant turns for synthetic Kurukoo scenarios. It preserves the original user/assistant/system roles, records the teacher provider/model, and marks every result as candidate-only and unreviewed.

Example with Mistral:

```bash
KURUKOO_TEACHER_PROVIDER=mistral \
KURUKOO_TEACHER_MODEL=mistral-small-latest \
KURUKOO_TEACHER_LIMIT=100 \
python3 ml/teachers/generate_trajectory_candidates.py
```

The generator does not mutate canonical state and cannot authorize or execute a capability. Generated examples must be evaluated/curated before entering a student-model training set.

All teacher outputs must carry provider/model/version/provenance metadata and remain untrusted until validation and curation.
