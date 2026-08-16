# Teacher Models

Teachers are offline evaluators and data generators. They do not execute Kurukoo capabilities.

The interface must support provider adapters for the stronger models available during development (including Mistral, Gemini and Groq where permitted by their APIs/quotas) without making any one provider a production dependency.

Teacher tasks:

- label intent;
- select candidate capability;
- identify candidate context owner;
- draft clarification;
- critique response;
- extract requirements/entities;
- generate counterexamples;
- assess truthfulness and policy adherence;
- explain why a candidate arbitration decision is wrong.

All teacher outputs must carry provider/model/version/provenance metadata and remain untrusted until validation and curation.
