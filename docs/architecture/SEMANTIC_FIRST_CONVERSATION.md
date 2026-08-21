# Kurukoo semantic-first conversation architecture

Kurukoo now treats the LLM as the primary semantic interpreter for conversational generation while keeping canonical system services authoritative for actions and state.

## Flow

`user turn -> semanticConversationInterpreter -> conversationTurnContract -> conversational generation -> canonical outcome / governed capability`

The semantic interpreter determines what the user appears to mean: speech act, conversation mode, goal, topic shift, references, missing information, capability hint, and whether the user explicitly authorized an action.

## The model does not own execution

Semantic `explicitAuthorization` is only an interpretation signal. It is never sufficient to execute anything.

Canonical services remain authoritative for:

- authentication and identity
- consent and confirmation
- safety and security interruptions
- Economic Requests
- provider discovery and verification
- availability and evidence
- payment and subscriptions
- notifications and reminders
- memory persistence
- Points/referrals/QR state
- agent goals and autonomous runtime
- irreversible actions
- idempotency and audit state

## Deterministic fallback

When the semantic LLM call fails or returns invalid JSON, the interpreter falls back to the existing bounded deterministic conversation classification. This preserves availability without making regex/rule classification the primary semantic path when an LLM is available.

## Conversation quality

The semantic interpretation is injected into `ConversationTurnContract` and `conversationalGenerationService`. The generated response remains subject to Kurukoo's existing quality checks, action-posture repair, strict repair and canonical outcome presentation rules.

## Important distinction

Exploration is not authorization. A problem statement is not an action request. A topic pivot does not erase an existing goal. A reference is not resolved by guessing when multiple canonical objects remain plausible.

## Regression coverage

`scripts/test-semantic-first-conversation.ts` verifies the key boundary cases: exploratory language that mentions booking, explicit authorization to act, and a topic pivot while preserving the prior goal.
