# Kurukoo Agent Operating Model

**Status:** Canonical consolidation boundary for the existing Agent foundations.

This document does not introduce a second agent runtime, capability registry, request lifecycle, execution engine, identity system, notification system, Memory system, or external-agent protocol. It connects the existing owners into one governed operating model.

## 1. User experience

There is one user-facing Kurukoo Agent at `/chat`. The user should not need to choose among specialist assistants merely because the work crosses domains.

```text
User
  ↓
Conversation / context arbitration
  ↓
Kurukoo Agent
  ↓
Agent Run / Goal
  ↓
Capability selection
  ↓
Policy + authorization + confirmation
  ↓
Canonical executor / domain owner
  ↓
Participant / provider / bounded external agent
  ↓
Evidence + outcome
  ↓
Notification / brief / conversation continuation
```

## 2. Existing owners remain authoritative

| Concern | Existing owner |
|---|---|
| Conversation turn | `canonicalChatTurnService` |
| Context selection | `contextArbitration` |
| Agent goals/runs | `agentRuntime` |
| Agent tools | `agentToolRegistry` |
| Capability definitions | `capabilityRegistry` + `universalCapabilityProtocol` |
| Capability execution | `canonicalCapabilityExecutor` |
| Economic Request | existing Economic Request owner |
| Physical/external execution | `executionConnector` / canonical execution boundary |
| External agent participant | `externalAgentContract` + `externalAgentCoordination` |
| Memory | `memoryProfile` / Living Memory boundary |
| Notifications | `pushNotifications` / notification queue |
| Evidence | provider/execution evidence boundaries |
| Identity/authorization | existing identity and policy boundaries |

The operating-model facade in `agentOperatingModel.ts` is a read-only composition boundary over these owners. It must not become another source of truth.

## 3. Agent Card

The canonical user-facing agent is represented by `KurukooAgentCard` for orchestration/discovery purposes. The card describes purpose, roles, capabilities, tools, interfaces and guardrails. It does not grant authority.

The card must explicitly communicate:

- one user-facing Agent;
- canonical state remains outside the Agent;
- external execution requires human approval;
- recursive external delegation remains disabled;
- MCP/A2A/HTTP/webhook are interface options, not automatic activation;
- provider/external capabilities remain subject to activation and evidence gates.

## 4. Capability model

Capabilities continue to use `UniversalCapabilityDescriptor`, `CapabilityActionContract`, the capability registry and the existing execution protocol.

A capability is not authority. A declared capability is not evidence that external execution is available.

The canonical chain is:

```text
capability declaration
→ action contract
→ context/object binding
→ policy/authorization
→ canonical executor
→ idempotency
→ execution/evidence
→ outcome
```

## 5. Agent Run

The existing `AgentGoal` and `AgentGoalEvent` records remain the durable/semantic owner of Agent work. `getAgentRunSummary()` is a read projection over those records; it must not introduce a second run store.

Every run should remain traceable to:

- owner
- conversation when present
- objective
- Economic Request when present
- capability/tool actions
- idempotency keys
- approvals
- evidence
- final outcome

## 6. Delegation

Internal specialization may exist behind the one user-facing Agent. External agent coordination must continue through the existing external-agent participant contract and canonical execution/evidence boundaries.

Delegation must carry structured references rather than relying on free-form identifiers in model text. At minimum, a future delegated task must preserve:

- owner
- request/goal
- participant
- capability
- allowed actions
- authorization
- expiry
- correlation id
- idempotency key
- evidence requirements

Recursive external delegation remains disabled until an explicitly governed future protocol is introduced.

## 7. Risk and policy

The Agent proposes/coordinates; canonical policy and execution owners decide whether an action may execute.

The Agent must never bypass:

- identity ownership
- capability action contracts
- human confirmation
- payment boundaries
- safety policy
- request ownership
- idempotency
- evidence requirements
- external activation state

## 8. Knowledge vs capability

Kurukoo keeps these distinct:

- **Knowledge/context:** what the system can reference or remember.
- **Capability/skill:** what the system may do.
- **Request/goal:** what the user wants achieved.
- **Authorization/policy:** what may be done.
- **Execution/participant:** who or what performs it.
- **Evidence/outcome:** what proves what happened.

No LLM response may substitute for one of these canonical boundaries.

## 9. External interfaces

The operating model is protocol-neutral. Future adapters may expose or consume capabilities using MCP, A2A, HTTP, webhooks or other approved interfaces.

Protocol support does not imply activation. Each external participant still requires its own authentication, authorization, privacy, cost, reliability and evidence contract.

## 10. End-to-end completion definition

The Agent operating model is considered repository-side complete only when:

1. one user-facing Agent is the clear conversation surface;
2. capability definitions and action contracts are canonical;
3. Agent goals/runs are traceable through existing Agent Runtime records;
4. capability execution goes through one canonical executor;
5. Economic Requests remain the canonical economic lifecycle;
6. physical/external execution remains inside the execution/evidence boundary;
7. external agents are participants, not alternate Kurukoo authorities;
8. authorization, policy, idempotency and evidence remain explicit;
9. notifications/briefs/context continuation reuse existing owners;
10. there is no duplicate Agent runtime, capability registry, request lifecycle or external-agent identity system.

Runtime and real-world activation remain separate evidence gates.
