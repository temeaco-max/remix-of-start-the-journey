---
name: kurukoo-runtime
description: Use when working with Kurukoo's runtime behavior, Express route handlers, API endpoints, session management, authentication middleware, task state transitions, or economic dispatch routes. Triggers on modifying route handlers in src/routes/, adding API endpoints, changing authentication logic, or updating task state transitions. Preserves runtime stability and canonical state management.
license: MIT
metadata:
  author: temeaco-max
  version: '1.0.0'
---

# Kurukoo Runtime Guide

Kurukoo's runtime handles authenticated sessions, API endpoints, task state transitions, and economic actions. All runtime behavior follows canonical patterns.

## When to Use

- Modifying Express route handlers in `src/routes/`
- Adding or changing API endpoints
- Updating session management or authentication
- Handling task state transitions (available → in_progress → completed)
- Working with economic dispatch routes
- Managing authentication middleware

## API Handler Pattern

All API handlers follow this canonical pattern:

```typescript
router.get('/api/{endpoint}', optionalAuthenticateUser, async (req: express.Request, res: express.Response) => {
  try {
    const phone = req.user?.phone;
    if (!phone) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const result = await executeLogic(phone, req.params, req.body);
    return res.json({ success: true, data: result });
  } catch (error) {
    if (error.status === 409) {
      return res.status(409).json({ success: false, error: error.message });
    }
    console.error('API error:', error);
    return res.status(500).json({ success: false, error: 'Unexpected error' });
  }
});
```

## Session Management

All authenticated routes use `optionalAuthenticateUser`:

```typescript
router.get('/chat/:conversationId', optionalAuthenticateUser, (req: AuthRequest, res) => {
  if (!req.user?.phone) {
    return res.redirect(302, '/login');
  }
  res.sendFile(path.join(process.cwd(), 'public', 'chat', 'index.html'));
});
```

## Task State Transitions

The canonical task state machine follows these transitions:

```
available → in_progress → completed
     ↘           ↙
      cancelled → expired → blocked
```

### State Definitions

| Status | Meaning | Transitions To |
|--------|---------|----------------|
| `available` | Task not accepted | `in_progress`, `cancelled`, `expired`, `blocked`, `rejected` |
| `in_progress` | Task accepted, being worked on | `completed`, `cancelled`, `expired`, `blocked`, `rejected` |
| `completed` | Task finished successfully | None (terminal state) |
| `approved` | Task approved by system | None (terminal state) |
| `cancelled` | User cancelled | `available` |
| `expired` | Time limit reached | `available` |
| `blocked` | External block | `available` |
| `rejected` | Quality rejection | `available` |

### Transition Validation

All state transitions must check `getRowsModified` to prevent stale actions:

```typescript
if (rowsModified === 0) {
  throw new TaskStateConflictError('Task state has changed, please reload');
}
```

## Runtime Stability Rules

### 1. Error Status Codes

| Code | Meaning | Handling |
|------|---------|----------|
| 400 | Bad Request | Client error, don't retry |
| 401 | Unauthorized | Re-authenticate user |
| 403 | Forbidden | Show access denied |
| 409 | Conflict | State mismatch, retry after reload |
| 429 | Too Many Requests | Rate limit, exponential backoff |
| 500 | Internal Server | Log and show generic error |
| 503 | Service Unavailable | Retry with backoff |

### 2. Rate Limiting

All API endpoints should implement rate limiting:

```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});

router.use('/api/', apiLimiter);
```

### 3. Credentials Handling

Always include credentials for state-changing operations:

```typescript
await fetch(url, {
  credentials: 'same-origin',
  headers: { 'Content-Type': 'application/json' }
});
```

## Runtime Migration Checklist

- [ ] Update route handlers with canonical pattern
- [ ] Add authentication middleware where needed
- [ ] Validate phone numbers for protected endpoints
- [ ] Implement proper error status codes
- [ ] Add rate limiting to `/api/` routes
- [ ] Use `credentials: 'same-origin'` for fetches
- [ ] Add test contracts for new endpoints
- [ ] Verify no breaking changes to existing APIs