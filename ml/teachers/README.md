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

## Admission boundary

Teacher output remains untrusted candidate material. The teacher generator marks outputs as unreviewed, and no teacher response is admitted to training merely because it is fluent or passes a heuristic. The canonical admission predicate is:

```text
reviewed == true AND accepted == true
```

`ml/curate_candidate_corpus.py` enforces this predicate, rejects production or personal data, deduplicates example identifiers, records rejection reasons and hashes, and produces an accepted corpus only when explicit approvals already exist. A missing teacher key, quota, privacy decision or provider connection therefore leaves the teacher tier unavailable; it does not fabricate candidates or block the deterministic synthetic generator.
