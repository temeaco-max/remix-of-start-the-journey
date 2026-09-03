---
name: kurukoo-security
description: Use when implementing authentication, authorization, privacy controls, security boundaries, consent management, or auditability in Kurukoo. Triggers on login flows, session validation, identity verification, consent UI, security policy updates, or privacy-related changes. Preserves genuine safeguards and security boundaries.
license: MIT
metadata:
  author: temeaco-max
  version: '1.0.0'
---

# Kurukoo Security Guide

Kurukoo preserves genuine safeguards including authentication, authorization, identity boundaries, privacy, consent, security, safety policies, auditability, legal constraints, and evidence requirements.

## When to Use

- Implementing or modifying authentication flows
- Updating authorization or session validation
- Adding privacy controls or consent management
- Working with security policies
- Implementing audit logging
- Handling identity verification

## Authentication Principles

### Preserve All Safeguards

Retain authentication, authorization, identity boundaries, privacy, consent, security, safety policies, auditability, legal constraints.

### Session Validation

Use `optionalAuthenticateUser` for anonymous access, check `req.user?.phone`.

```typescript
router.get('/public', optionalAuthenticateUser, (req, res) => {
  if (!req.user?.phone) {
    return res.status(401).json({ success: false, error: 'Auth required' });
  }
  res.send('Welcome');
});
```

### Phone Validation

Validate phone numbers with E.164 format: `/^\+?[1-9]\d{1,14}$/`

## Authorization

### Owner-Scoped Access

Always scope database queries by phone:

```typescript
const resource = await db.query(
  'SELECT * FROM resources WHERE id = ? AND phone = ?',
  [resourceId, phone]
);
```

## Privacy Controls

### Data Minimization

Only request/store necessary data. Don't collect unnecessary data.

### Consent Management

Record explicit consent for data processing, marketing, and third-party sharing.

## Audit Logging

### Log Security Events

Log authentication events, authorization failures, data access/modification, and payment operations.

## Security Boundaries

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';
const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 5, message: 'Too many attempts' });
```

### Input Validation

Validate all user inputs and sanitize before database insertion.

## Security Checklist

- All authenticated routes use `authenticateUser` or validate `req.user?.phone`
- All database queries are owner-scoped by phone
- Phone numbers are validated with E.164 format
- Consent is explicitly recorded for data processing
- Security events are logged to audit trail
- Rate limiting is applied to authentication endpoints
- Input validation on all user inputs
- Data minimization principles followed
- Genuine safeguards are not removed for speed
