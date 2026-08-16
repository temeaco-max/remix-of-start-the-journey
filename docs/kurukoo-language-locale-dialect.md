# Kurukoo Language, Locale & Dialect Foundation

**Status:** architectural foundation

SmolLM2 is a semantic interpreter for Kurukoo, not the sole source of localisation truth. Language, locale, dialect and channel presentation must be layered.

## Layers

1. **Locale configuration** — legal wording, units, currencies, dates, availability, feature flags, channel constraints and approved terminology.
2. **Language/dialect interpretation** — training and evaluation examples covering spelling variation, code-switching, slang, colloquialisms, local names, abbreviations, phonetic spellings and channel-specific shorthand.
3. **Kurukoo ontology** — canonical intents, skills, entities, actors, lifecycle states and actions remain language-neutral.
4. **Response rendering** — the same semantic response is rendered into the user's selected language/dialect and channel capabilities.

## Training rule

Every canonical skill and skill flow should receive representative language variants, not just English standard-language prompts. Coverage should include consumer, provider, business, contributor and agent actors; web/PWA, WhatsApp, Telegram, SMS, USSD, email, voice and linked-device contexts where applicable; normal, ambiguous, interrupted, corrective, unavailable and recovery scenarios.

Training data must be versioned and provenance-labelled. Synthetic examples may expand coverage but must be reviewed/criticised before promotion into trusted training sets.

## Runtime rule

SmolLM2 may infer semantic meaning from dialectal input, but canonical entities and policy identifiers remain locale-neutral. The model should output structured semantic proposals; deterministic validation and canonical services decide whether the interpretation is valid.

## UI rule

Do not translate internal capability names literally into user-facing language. User-facing copy should be short, natural, culturally appropriate and action-oriented. Channel constraints determine presentation, not the underlying meaning.

## Evolution

New dialect examples should be added to the training/evaluation corpus without changing canonical skill IDs or creating dialect-specific business logic unless a jurisdiction genuinely requires different policy or fulfilment semantics.
