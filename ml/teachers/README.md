# Teacher Models

Teachers are offline evaluators and data generators. They do not execute Kurukoo capabilities and are never production dependencies.

The existing teacher entrypoints support a provider pool of Gemini, Mistral, Groq, OpenRouter, Hugging Face and OpenAI where the relevant API is configured. `auto` mode uses the configured ordered pool and, by default, prefers the earlier/free-or-low-cost entries before paid fallbacks. **Free-first is a routing preference, not a claim that a provider or model is free**: each provider's account quota, rate limits, model availability, billing terms and regional availability remain authoritative.

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

## Cost-aware provider selection

The existing `ml/teachers/generate_trajectory_candidates.py` and `scripts/run-trajectory-teacher.py` support:

```bash
KURUKOO_TEACHER_PROVIDER=auto \
KURUKOO_TEACHER_PROVIDERS=gemini,mistral,groq,openrouter,huggingface,openai \
KURUKOO_TEACHER_FREE_FIRST=true \
python3 ml/teachers/generate_trajectory_candidates.py
```

Provider-specific model environment variables are available in `.env.example`. OpenRouter can use a model explicitly marked free by OpenRouter when such a model is available; Hugging Face uses its OpenAI-compatible router when configured. These are availability choices, not guarantees, and a failed/limited provider falls through to the next configured provider.

The selection belongs inside the existing teacher scripts. No new production AI router, teacher service or parallel runtime has been introduced.

## Candidate trajectory generation

`generate_trajectory_candidates.py` generates natural assistant turns for synthetic Kurukoo scenarios. It preserves the original user/assistant/system roles, records the actual teacher provider/model selected, records provider fallback attempts, and marks every result as candidate-only and unreviewed.

The generator does not mutate canonical state and cannot authorize or execute a capability. Generated examples must be evaluated/curated before entering a student-model training set.

All teacher outputs must carry provider/model/version/provenance metadata and remain untrusted until validation and curation.

## Admission boundary

Teacher output remains untrusted candidate material. The teacher generator marks outputs as unreviewed, and no teacher response is admitted to training merely because it is fluent or passes a heuristic. The canonical admission predicate is:

```text
reviewed == true AND accepted == true
```

`ml/curate_candidate_corpus.py` enforces this predicate, rejects production or personal data, deduplicates example identifiers, records rejection reasons and hashes, and produces an accepted corpus only when explicit approvals already exist. A missing teacher key, quota, privacy decision or provider connection therefore leaves the teacher tier unavailable; it does not fabricate candidates or block the deterministic synthetic generator.

## Human curation and rewrite lineage

Teacher output is imported into the existing Admin Control Room queue at `/admin/curation.html`; it is not automatically accepted. Reviewers see the complete trajectory, provenance, teacher score, and flagged failure dimensions, then record an explicit accept, reject, rewrite, or second-review decision with notes. A rewrite is a new candidate linked to the original through `rewrite_of` and `original_id`; it must return to `pending` and receive a separate review. Provider identity, model identity, confidence, and teacher agreement are evidence for prioritisation only, never acceptance authority.
