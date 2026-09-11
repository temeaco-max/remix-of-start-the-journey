# Frontend ↔ Backend Vertical Build Rule

Canonical frontend: `temeaco-max/remix-of-start-the-journey`

Canonical backend: `temeaco-max/kurukoo`

Integration branch: `main`

Every product capability is built as one vertical slice:

1. User intent can be expressed naturally.
2. Frontend renders understanding, progress, choice, consent, waiting and completion states.
3. Frontend calls a canonical backend boundary; it does not invent business state locally.
4. Backend persists request, participant, execution and evidence state through canonical services.
5. Execution occurs only within authorization, safety and evidence boundaries.
6. Work and Activity expose the canonical state.
7. Completion claims have truthful evidence where evidence is expected.
8. Failure, missing input, external dependency and escalation are first-class states.
9. Tests prove the backend behaviour and relevant frontend interaction.

## Outcome verticals

Implementation is outcome-led rather than page-led:

- conversational assistance;
- discovery and selection;
- provider/business coordination;
- product and commerce outcomes;
- reminders and follow-up;
- digital/browser execution;
- physical execution;
- hybrid execution;
- cross-border execution;
- memory and continuity;
- trust, consent and evidence;
- payments and transaction state;
- messaging and external channels;
- agents and bounded autonomy;
- resources, topics and opportunities that lead into action.

Existing components, routes, services, skills and engines should be reused before parallel implementations are introduced.

## Definition of done

A feature is complete only when a real user can enter the goal, the canonical backend can process the supported path, and the frontend can truthfully show the resulting outcome or the exact reason it cannot proceed.
