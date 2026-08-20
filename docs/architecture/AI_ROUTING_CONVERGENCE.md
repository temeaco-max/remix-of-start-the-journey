# Kurukoo AI Routing Convergence

## Canonical order

```text
conversation-act rules
    -> FastText cheap signal
    -> 239-skill catalogue / behaviour resolution
    -> SmolLM2 bounded semantic interpretation
    -> Mistral escalation when complexity or authority warrants it
    -> canonical capabilities/services
```

FastText is not the conversational authority and cannot mutate canonical state.

## FastText responsibilities

FastText is used for inexpensive routing signals:

- conversation acts;
- common support intents;
- domain/skill hints;
- high-volume low-complexity routing.

Skill hint labels are namespaced as `skill_route_*` so they cannot collide with ordinary product intents. The canonical catalogue reconciles the label to a real skill before behaviour is selected.

Greetings, confirmations, thanks, corrections, clarification, status and cancellation patterns that are deterministic are handled before the model so an absent/weak binary cannot turn them into `unknown`.

## AI escalation

SmolLM2 is preferred for routine semantic interpretation, support and skill intake.
Mistral is preferred when configured for complex planning, multi-step coordination, negotiation, disputes, high-stakes work, ambiguous routing or other higher-value reasoning.

The model selection policy is a cost/quality governor. It is not a permission layer.

## Skill behaviour

The 239-skill catalogue supplies the behaviour contract. FastText may provide a hint, but the canonical skill behaviour registry and catalogue remain the authority for requirements, memory policy, capabilities, evidence and recovery.

## Memory

Memory is injected only when relevant. Current explicit user context outranks durable profile facts. Memory provenance and internal identifiers are never exposed to the user.

## Training

`npm run fasttext:build` now regenerates skill-hint examples from the converged skill catalogue before training, so the FastText corpus follows catalogue additions automatically instead of relying on a manually maintained subset.
