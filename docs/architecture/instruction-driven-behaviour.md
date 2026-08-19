# Instruction-Driven Behaviour Architecture

Kurukoo uses one conversational orchestration runtime with composable behaviour instructions rather than a bespoke chat implementation per skill.

## Runtime composition

```text
user turn
  -> conversation intelligence / context arbitration
  -> conversation act
  -> skill/support/safety inference
  -> behaviour instruction composition
  -> AI reasoning (SmolLM2/Mistral/other configured provider)
  -> canonical capabilities/services
  -> canonical state + evidence
  -> conversational continuation
```

## Instruction layers

- Global Kurukoo conversation behaviour
- Support/Guide behaviour
- Safety behaviour
- Skill-specific behaviour
- First-class agent behaviour
- Agent-specific operating instructions

Instructions define role, mission, question strategy, requirements, optional context, capability boundaries, authority, completion and recovery. They do not grant authority to the model.

## Skill-specific behaviour

The same runtime handles different interaction patterns. A painter can require property/scope/location and optionally collect interior/exterior, preparation, materials and inspection/quote details. An okada rider prioritizes origin/destination/time and then a nearby acceptance opportunity. A pepper/produce seller prioritizes product, quantity, availability and pickup/delivery. A shoe maker first distinguishes repair, alteration and custom work before collecting the details needed for that branch.

The instruction layer is intentionally additive to `skillFlows.ts`: existing requirements/capabilities remain canonical, while behavioural overrides express how the conversation should collect and sequence information.

## Support is not an economic skill

Greetings, thanks, farewells, corrections, how-to questions, device/account help and status requests are treated as conversation acts/support behaviours. They must not be forced into an economic workflow.

## First-class AI agents

Agents remain bounded actors with skills/tools/authority. Their instructions are composed with global and skill instructions. Kurukoo-owned agents can therefore act as providers for supported skills without creating a second provider architecture.

Prayer Companion is the reference implementation: it is a Kurukoo-owned provider, registered under the canonical `prayer_partner` skill, uses the shared instruction substrate, retains its domain-specific spiritual guardrails, and continues to use the existing agent runtime and canonical prayer capabilities.

## Truth boundary

Instructions guide model behaviour. They never authorize mutations. Canonical services remain authoritative for identity, permissions, payment, provider availability, execution, notifications, memory persistence, safety and evidence.
