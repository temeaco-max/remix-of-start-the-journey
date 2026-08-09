# Kurukoo Memory Engine — Technical Design Document
**Version:** 1.0
**Date:** 2026-07-31
**Status:** Draft for engineering review
**Owner:** Kurukoo Platform Team
**Blueprint Reference:** §4.3 (Memory Lifecycle & Context Selection)
---

## Overview

This document specifies the technical design for Kurukoo's Memory Engine upgrade, based on the Living Memory Engine pattern (selective retrieval + consolidation lifecycle). The goal is to replace unbounded context sends to the LLM with bounded, diverse working context selection, and to implement continuous memory lifecycle management.

**Core principles:**
- Memory is not a log. It is a selective retrieval system.
- The AI never sees the full conversation history. It sees only what matters now.
- Memories decay, reinforce, merge, and crystallize automatically.
- Every AI decision is auditable.

---

## 1. Current State

### 1.1. Existing Storage

| Table | Current Content | Gap |
|-------|----------------|-----|
| `memory_profiles` | `behavior_patterns` (JSON), `inferred_roles` (JSON), `preferences` (JSON), `wallet_balance_pence` | No `open_intentions`, no memory lifecycle metadata (`access_count`, `relevance_score`, `last_accessed_at`) |
| `messages` | Full conversation transcript, `thread_id`, `created_at` | No tier classification, no decay, no relevance scoring |
| `user_behavior_signals` | Implicit feedback (views, clicks, accepts, declines) | Not integrated into memory retrieval |
| `temp_sessions` | Session state for active conversations | Session-scoped only, no persistence across sessions |

### 1.2. Current AI Context Flow

```
User message → AI Router → Full transcript or simple truncation → LLM (FastText/Groq)
```

**Problem:** As conversations grow, token costs increase linearly. Truncation loses important context from earlier in the conversation.

---

## 2. Target State

### 2.1. Memory Tiers

```
Stable Self-Knowledge (permanent)
    ↓
Episodic Memories (90-day TTL, decayable)
    ↓
Open Intentions (7-30 day TTL, prospective memory)
    ↓
Recent Tail (session-scoped, last 10 messages)
```

### 2.2. Working Context Selection Flow

```
User message
    ↓
AI Router (intent classification)
    ↓
MMR Retrieval Engine
    ├── Query: current message + inferred intent
    ├── Search: all four memory tiers
    ├── Re-rank: MMR (relevance + diversity)
    └── Select: top K items (max 3 per tier)
    ↓
Bounded Working Context (≤1,024 or 2,048 tokens)
    ↓
LLM (FastText or Groq)
    ↓
Response + Audit Log
```

---

## 3. Database Schema Changes

### 3.1. `memory_profiles` Additions

```sql
-- Add open_intentions column (JSON array)
ALTER TABLE memory_profiles ADD COLUMN open_intentions JSON DEFAULT '[]';

-- Add memory lifecycle metadata
ALTER TABLE memory_profiles ADD COLUMN memory_last_consolidated_at TIMESTAMP;
ALTER TABLE memory_profiles ADD COLUMN memory_health_score REAL DEFAULT 1.0;

-- Index for open_intentions queries
CREATE INDEX idx_memory_profiles_open_intentions
  ON memory_profiles ((json_extract(open_intentions, '$[0].expires_at')));
```

### 3.2. `messages` Additions

```sql
-- Add memory tier classification
ALTER TABLE messages ADD COLUMN memory_tier TEXT DEFAULT 'episodic';
  -- Values: 'stable', 'episodic', 'open_intention', 'recent_tail'

-- Add memory lifecycle metadata
ALTER TABLE messages ADD COLUMN access_count INTEGER DEFAULT 0;
ALTER TABLE messages ADD COLUMN relevance_score REAL DEFAULT 0.5;
ALTER TABLE messages ADD COLUMN last_accessed_at TIMESTAMP;
ALTER TABLE messages ADD COLUMN memory_status TEXT DEFAULT 'active';
  -- Values: 'active', 'dormant', 'pruned'

-- Index for memory retrieval
CREATE INDEX idx_messages_memory_tier
  ON messages (memory_tier, thread_id, created_at);
CREATE INDEX idx_messages_memory_status
  ON messages (memory_status, last_accessed_at);
```

### 3.3. New `ai_audit_log` Table

```sql
CREATE TABLE ai_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  request_text TEXT NOT NULL,
  intent_class TEXT,
  intent_confidence REAL,
  working_context JSON NOT NULL,  -- assembled context sent to LLM
  available_memory JSON NOT NULL,    -- all candidates retrieved
  selected_memory JSON NOT NULL,     -- items selected for working context
  selection_scores JSON,            -- relevance scores per selected item
  llm_response TEXT,
  token_count INTEGER,
  cost_pence INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_audit_log_thread
  ON ai_audit_log (thread_id, created_at);
CREATE INDEX idx_ai_audit_log_user
  ON ai_audit_log (user_phone, created_at);
```

---

## 4. MMR Retrieval Engine

### 4.1. Algorithm

```typescript
function mmrRetrieve(query: string, tiers: MemoryTier[], k: number = 8): MemoryItem[] {
  // 1. Retrieve candidates from all tiers
  const candidates = tiers.flatMap(tier => tier.search(query));
  
  // 2. Calculate relevance scores (cosine similarity or keyword match)
  const scored = candidates.map(item => ({
    ...item,
    relevance: cosineSimilarity(query, item.embedding || item.text),
  }));
  
  // 3. MMR re-ranking
  const selected: MemoryItem[] = [];
  const remaining = [...scored].sort((a, b) => b.relevance - a.relevance);
  
  while (selected.length < k && remaining.length > 0) {
    // Pick item with highest relevance to query
    const next = remaining.shift()!;
    
    // Penalize similarity to already-selected items (diversity)
    const maxSimilarity = selected.reduce((max, s) => {
      const sim = cosineSimilarity(next.embedding || next.text, s.embedding || s.text);
      return Math.max(max, sim);
    }, 0);
    
    next.mmrScore = next.relevance - 0.7 * maxSimilarity;  // λ = 0.7
    selected.push(next);
    
    // Re-sort remaining by MMR score
    remaining.sort((a, b) => b.mmrScore - a.mmrScore);
  }
  
  // 4. Enforce per-tier limit (max 3 per tier)
  const tierCounts = new Map<string, number>();
  const bounded = selected.filter(item => {
    const count = tierCounts.get(item.tier) || 0;
    if (count >= 3) return false;
    tierCounts.set(item.tier, count + 1);
    return true;
  });
  
  return bounded;
}
```

### 4.2. Token Budget Enforcement

```typescript
function assembleWorkingContext(selected: MemoryItem[], route: IntentRoute): string {
  const maxTokens = route === 'fasttext' ? 1024 : 2048;
  const context: string[] = [];
  let tokenCount = 0;
  
  for (const item of selected) {
    const itemTokens = estimateTokens(item.text);
    if (tokenCount + itemTokens > maxTokens) break;
    context.push(formatMemoryItem(item));
    tokenCount += itemTokens;
  }
  
  return context.join('\n\n');
}
```

---

## 5. Memory Lifecycle Cron Jobs

### 5.1. Daily Decay Job

```typescript
async function dailyDecay() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  // Reduce relevance for inactive memories
  await db.exec(`
    UPDATE messages
    SET relevance_score = relevance_score * 0.9,
        access_count = access_count,
        memory_status = CASE
          WHEN relevance_score * 0.9 < 0.1 THEN 'dormant'
          ELSE memory_status
        END
    WHERE last_accessed_at < ?
      AND memory_status = 'active'
  `, [thirtyDaysAgo.toISOString()]);
  
  // Update memory health score
  await db.exec(`
    UPDATE memory_profiles
    SET memory_health_score = (
      SELECT AVG(relevance_score) FROM messages
      WHERE thread_id IN (SELECT thread_id FROM messages WHERE user_phone = memory_profiles.phone)
    )
  `);
}
```

### 5.2. Weekly Pruning Job

```typescript
async function weeklyPrune() {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  
  // Delete dormant episodic memories older than 90 days
  await db.exec(`
    DELETE FROM messages
    WHERE memory_tier = 'episodic'
      AND memory_status = 'dormant'
      AND created_at < ?
  `, [ninetyDaysAgo.toISOString()]);
  
  // Prune expired open intentions
  await db.exec(`
    UPDATE memory_profiles
    SET open_intentions = json_filter(open_intentions, 'expires_at > now()')
    WHERE json_length(open_intentions) > 0
  `);
}
```

### 5.3. Crystallize Job (Pattern Detection)

```typescript
async function crystallizePatterns() {
  // Find behaviors observed 5+ times in last 30 days
  const patterns = await db.exec(`
    SELECT user_phone, json_extract(value, '$.skill') as skill,
           COUNT(*) as observation_count
    FROM memory_profiles, json_elements(behavior_patterns)
    WHERE created_at > datetime('now', '-30 days')
    GROUP BY user_phone, skill
    HAVING observation_count >= 5
  `);
  
  for (const pattern of patterns) {
    // Promote from inferred to explicit skill
    await db.exec(`
      UPDATE skills
      SET source = 'explicit', confidence = 1.0
      WHERE phone = ? AND skill = ?
    `, [pattern.user_phone, pattern.skill]);
    
    // Log crystallization event
    await db.exec(`
      INSERT INTO ai_audit_log (thread_id, user_phone, request_text, intent_class)
      VALUES (?, ?, ?, 'crystallize')
    `, [`crystallize-${pattern.user_phone}`, pattern.user_phone, `Promoted ${pattern.skill} to explicit skill`]);
  }
}
```

---

## 6. Open Intentions API

### 6.1. Create Open Intention

```typescript
interface OpenIntention {
  id: string;
  intent: string;
  context: string;
  created_at: string;
  expires_at: string;
  ttl_days: number;
  resolution: 'pending' | 'resolved' | 'abandoned' | 'expired';
  resolution_note?: string;
  reminder_count: number;
  max_reminders: number;
}

async function createOpenIntention(
  phone: string,
  intent: string,
  context: string,
  ttlDays: number = 7
): Promise<OpenIntention> {
  const profile = await getMemoryProfile(phone);
  const intentions = profile.open_intentions || [];
  
  // Enforce max 5 open intentions per user
  if (intentions.length >= 5) {
    throw new Error('Maximum open intentions reached (5)');
  }
  
  const newIntention: OpenIntention = {
    id: crypto.randomUUID(),
    intent,
    context,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString(),
    ttl_days: ttlDays,
    resolution: 'pending',
    reminder_count: 0,
    max_reminders: 3,
  };
  
  intentions.push(newIntention);
  await db.exec(`
    UPDATE memory_profiles
    SET open_intentions = ?
    WHERE phone = ?
  `, [JSON.stringify(intentions), phone]);
  
  return newIntention;
}
```

### 6.2. Resolve Open Intention

```typescript
async function resolveOpenIntention(
  phone: string,
  intentionId: string,
  resolution: 'resolved' | 'abandoned' | 'expired',
  note?: string
): Promise<void> {
  const profile = await getMemoryProfile(phone);
  const intentions = profile.open_intentions || [];
  
  const index = intentions.findIndex(i => i.id === intentionId);
  if (index === -1) throw new Error('Intention not found');
  
  intentions[index] = {
    ...intentions[index],
    resolution,
    resolution_note: note,
    expires_at: resolution === 'expired' ? new Date().toISOString() : intentions[index].expires_at,
  };
  
  await db.exec(`
    UPDATE memory_profiles
    SET open_intentions = ?
    WHERE phone = ?
  `, [JSON.stringify(intentions), phone]);
  
  // Log to audit trail
  await logToAiAuditLog(phone, `Resolved open intention: ${intentionId} → ${resolution}`, 'open_intention_resolved');
}
```

---

## 7. Working Context Inspector (Admin Console)

### 7.1. Data Model

```typescript
interface WorkingContextInspector {
  requestId: string;
  threadId: string;
  userPhone: string;
  timestamp: Date;
  query: string;
  intentClass: string;
  intentConfidence: number;
  availableMemory: Array<{
    tier: string;
    text: string;
    relevanceScore: number;
    source: string;
    created_at: string;
  }>;
  selectedMemory: Array<{
    tier: string;
    text: string;
    mmrScore: number;
    relevanceScore: number;
    source: string;
  }>;
  workingContext: string;
  tokenCount: number;
  llmResponse: string;
}
```

### 7.2. Admin API Endpoint

```
GET /api/admin/ai/working-context?thread_id={threadId}&request_id={requestId}
```

**Response:**
```json
{
  "request_id": "uuid",
  "thread_id": "thread_123",
  "user_phone": "+234801234567",
  "timestamp": "2026-07-31T10:00:00Z",
  "query": "I need a plumber",
  "intent_class": "find_worker",
  "intent_confidence": 0.92,
  "available_memory": [
    {
      "tier": "stable",
      "text": "User is a phone repairer",
      "relevance_score": 0.3,
      "source": "inferred_roles",
      "created_at": "2026-07-15T08:00:00Z"
    },
    {
      "tier": "episodic",
      "text": "User asked for a plumber last Tuesday",
      "relevance_score": 0.85,
      "source": "messages",
      "created_at": "2026-07-28T14:00:00Z"
    }
    ...
  ],
  "selected_memory": [
    {
      "tier": "episodic",
      "text": "User asked for a plumber last Tuesday",
      "mmr_score": 0.82,
      "relevance_score": 0.85,
      "source": "messages"
    }
  ],
  "working_context": "User asked for a plumber last Tuesday. Context: Lagos, Ikeja.",
  "token_count": 45,
  "llm_response": "I found 3 plumbers near you in Ikeja..."
}
```

### 7.3. Frontend Display (Admin Console)

- **Left panel:** Available memory pool (all retrieved items, color-coded by tier, sorted by relevance)
- **Right panel:** Selected working context (items that were actually sent to the LLM, with MMR scores)
- **Bottom panel:** Assembled working context text (exactly what the LLM saw)
- **Toggle:** Show/hide items that were NOT selected (and why — low relevance, diversity penalty, tier limit)

---

## 8. Implementation Phases

### Phase 1: Bounded Working Context (Weeks 1-2)

**Goal:** Replace full-context sends with MMR retrieval.

**Tasks:**
1. Implement `MemoryRetriever` class with tier-based search
2. Implement MMR re-ranking algorithm
3. Add token budget enforcement (1,024 / 2,048)
4. Integrate into AI router (§21.1 FastText service, §21.2 Groq service)
5. Add `ai_audit_log` table and logging
6. A/B test: compare response quality (user ratings) and token cost vs. baseline

**Success criteria:**
- Token cost per request reduced by ≥30%
- User satisfaction (ratings) unchanged or improved
- Zero P0 bugs in production for 1 week

### Phase 2: Memory Lifecycle (Weeks 3-4)

**Goal:** Implement decay, reinforcement, pruning, merge, crystallize.

**Tasks:**
1. Add `access_count`, `relevance_score`, `last_accessed_at`, `memory_status` to `messages` table
2. Implement daily decay cron
3. Implement weekly pruning cron
4. Implement crystallize job (pattern detection → promote to explicit skill)
5. Add merge logic (similarity check on new memory creation)
6. Monitor `messages` table size growth rate (should flatten after pruning)

**Success criteria:**
- `messages` table growth rate reduced by ≥50% after 30 days
- No user-visible degradation in AI response quality
- Zero data loss from pruning (all pruned data is truly dormant)

### Phase 3: Open Intentions (Weeks 5-6)

**Goal:** Add prospective memory with TTLs and contextual nudges.

**Tasks:**
1. Add `open_intentions` JSON column to `memory_profiles`
2. Implement `createOpenIntention` and `resolveOpenIntention` functions
3. Integrate with Opportunity Engine (§33) for daily nudge generation
4. Add open intention detection to AI router (incomplete requests, abandoned carts)
5. Include open intentions in working context selection (§4.3.2)

**Success criteria:**
- Maximum 5 open intentions per user enforced
- Nudge acceptance rate ≥15% (user acts on the nudge)
- Zero notification spam complaints

### Phase 4: Working Context Inspector (Weeks 7-8)

**Goal:** Build admin console debug panel for per-request context selection.

**Tasks:**
1. Build `GET /api/admin/ai/working-context` endpoint
2. Build frontend panel in Admin Console (§38)
3. Add filtering by thread_id, user_phone, date range
4. Add export to CSV for offline analysis
5. Add alerting: flag requests where working context is empty or relevance scores are low

**Success criteria:**
- Admin can inspect any AI request's working context in <3 clicks
- Debug time for bad AI responses reduced by ≥50%
- Zero P0 bugs in admin console

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| MMR retrieval degrades response quality | Medium | High | A/B test against baseline; fallback to full context if relevance scores are low |
| Memory pruning removes important data | Low | High | 90-day TTL is conservative; all pruned data is dormant (low access, low relevance); manual recovery via audit log |
| Open intentions become notification spam | Medium | Medium | Hard limit of 5 per user; max 3 reminders per intention; TTL-based expiry |
| Token budget too restrictive for complex requests | Medium | Medium | Configurable budgets per route; fallback to 2,048 for complex intents |
| Crystallize job misclassifies skills | Low | Medium | User override always available (§18); quarterly bias audit |

---

## 10. Open Questions

1. **Embedding strategy:** Should Kurukoo use pre-computed embeddings (e.g., via Groq) or keyword-based retrieval for MMR? Embeddings are more accurate but require an embedding service. Keyword-based is simpler but less precise.
2. **Relevance scoring:** Should `relevance_score` be binary (0/1) or continuous (0.0-1.0)? Continuous allows finer-grained decay but is harder to tune.
3. **Open intention detection:** Should the AI explicitly tag open intentions, or should the system infer them from conversation patterns (e.g., user says "maybe later" or message ends without confirmation)?
4. **Memory tier assignment:** Should the AI router assign tiers, or should a background job classify memories after the fact?
5. **Cross-device sync:** Should open intentions and memory profiles sync across WhatsApp, USSD, and PWA sessions in real time, or is eventual consistency acceptable?

---

## 11. References

- **Living Memory Engine (Devpost):** https://devpost.com/software/living-memory-engine — Context-composition engine with MMR retrieval, memory lifecycle, and explainability
- **Blueprint §4.3:** Memory Lifecycle & Context Selection — this document's source of truth
- **Blueprint §31:** AI Agents — prospective memory integration
- **Blueprint §38:** Admin Console — Working Context inspector
- **Blueprint §41:** Privacy & Security — auditability requirements

---

*Last updated: 2026-07-31*
