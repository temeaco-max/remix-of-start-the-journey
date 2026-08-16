# Scenario Generation

The scenario generator creates a combinatorial universe of Kurukoo interactions rather than blindly producing a flat conversation dump.

It must draw from canonical repository definitions where possible: skills, intents, Economic Request states, agent states, memory boundaries, notifications, reminders, provider/network state, products and channel capability.

The generator must support:

- single-turn and multi-turn conversations;
- interleaving multiple long-lived contexts;
- ambiguous utterances;
- corrections and topic switches;
- delayed answers;
- interruptions and resumption;
- unavailable external integrations;
- truthfulness and safety boundaries;
- adversarial and malformed inputs;
- normal and high-complexity transaction journeys.

The initial design target is a scenario universe above 100M possible combinations. The materialised training corpus must be selected through validation, deduplication, balancing and quality scoring.
