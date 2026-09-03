---
name: kurukoo-ai
description: Use when working with Kurukoo's AI layer including model selection, prompt engineering, agent behavior, memory management, conversation flow, or classifier decisions. Triggers on AI provider changes, prompt template modifications, conversation routing, memory continuity, or agent orchestration. Preserves the assistant-first experience and canonical conversation model.
license: MIT
metadata:
  author: temeaco-max
  version: '1.0.0'
---

# Kurukoo AI Guide

Kurukoo uses AI to interpret, reason, communicate and coordinate. Agents reuse the same canonical Kurukoo capabilities and tools rather than becoming separate products.

## When to Use

- Modifying AI provider configurations or model selection
- Changing prompt templates or conversation flows
- Working with memory and continuity systems
- Adding or modifying classifier/routing logic
- Agent orchestration and coordination
- Understanding conversation-to-action flows

## Model Selection Principles

### Use the Cheapest Sufficient Model

Prefer smaller/cheaper models when possible:

| Task Type | Model | Provider |
|-----------|-------|----------|
| Simple classification | SmolLM2 | Local |
| Basic routing | Llama 3.2 | Local/Remote |
| Conversation understanding | Claude | Remote |
| Complex reasoning | Claude 3.5 | Remote |

**Rule**: Never use a larger or more expensive model when a smaller model is sufficient. Never repeat expensive inference when result can be reused.

## Conversation Flow

### User Input Processing

```typescript
interface ConversationContext {
  phone: string;
  conversationId?: string;
  prompt: string;
  contextId?: string;
  action?: string;
}

// Flow: User input → Context enrichment → Model → Action
async function processUserInput(ctx: ConversationContext) {
  const enriched = await enrichContext(ctx);
  const response = await model.generate(enriched);
  return executeCanonicalAction(response);
}
```

## Memory System

### Memory Continuity

Memory is for approved identity, preferences, context, request continuity, goals, and user-approved history.

```typescript
interface MemoryEntry {
  phone: string;
  context: Record<string, unknown>;
  timestamp: Date;
  source: 'user' | 'assistant' | 'system';
}
```

**Rule**: Memory is NOT evidence of current price, availability, verification, payment, stock, fulfilment, or provider status.

| Memory Can Provide | Memory Cannot Provide |
|--------------------|----------------------|
| User preferences | Real-time prices |
| Past conversation context | Current stock levels |
| Goals and objectives | Payment status |
| Relationship history | Delivery status |

## Agent Behavior

### Agent Reuse Pattern

```typescript
// Good - reuse canonical tools
const agent = {
  capabilities: ['inspect', 'diagnose', 'explain', 'monitor', 'configure', 'remind'],
  tools: canonicalKurukooTools
};

// Bad - create parallel agent framework
const agent = {
  customTools: [...], // Don't create custom tools
  separateFramework: true // Don't separate from canonical
};
```

**Rule**: Use an agent when ongoing reasoning, monitoring, diagnosis, coordination, instruction-following, or background continuity provides real value. Do not invoke an agent merely because one exists.

### Direct Help Before Escalation

```typescript
async function assistUser(request) {
  if (canInspect(request)) return inspect(request);
  if (canDiagnose(request)) return diagnose(request);
  if (canResolve(request)) return resolve(request);
  return escalate(request, { context: gatherContext(request) });
}
```

**Rule**: When human intervention is necessary, carry forward the useful context already gathered.

## Classifier Guidelines

### When to Use Classifiers

Do not use a classifier simply because it is available. Classification and routing should solve an actual product problem.

```typescript
// Good - classifier solves specific routing problem
if (conversation.includes('appointment')) return routeToAppointments();

// Bad - classifier used because it exists
if (classifier.predict(conversation)) return classifier.result;
```

**Rule**: Normal conversational interaction should not be forced through a classification mechanism that is inappropriate for the task.