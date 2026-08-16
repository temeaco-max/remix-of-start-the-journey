# Kurukoo agent build rules

Reference `/BLUEPRINT.md` for the canonical architecture, schema, capabilities and product intent.

Also follow `/docs/architecture/KURUKOO_BUILD_CONVERGENCE_CONTRACT.md` as the locked implementation direction.

## Non-negotiable build principles

- `main` is the canonical integration branch for the platform OS build. Do not create a new product architecture on a parallel branch.
- Build for outcomes, not feature accumulation.
- Connect existing capabilities before creating new ones.
- Repair or repurpose existing systems before replacing them.
- Create a new subsystem only when a genuine architectural capability gap has been established.
- Treat Chat as the universal conversational control surface over canonical services, not as a second backend.
- Preserve one canonical identity, conversation, memory, presence, economic lifecycle, policy boundary and action protocol.
- AI may interpret, reason, communicate and coordinate, but canonical services own authority, mutation, execution and evidence.
- Never claim external activation, availability, payment, fulfilment or evidence that has not actually been established.
- Do not use tests or documentation as substitutes for implementation. Tests are evidence of behaviour; implementation must make the behaviour real.
- When a gap is found, implement the missing connection or capability in the existing architecture rather than adding an isolated feature merely to satisfy the scenario.
- Every change must be checked against the whole Kurukoo system, not only the local file or feature being edited.
- When existing work is on another branch, reconcile it into `main`; preserve useful implementation, discard duplicates/superseded architecture, and avoid long-lived divergence.
