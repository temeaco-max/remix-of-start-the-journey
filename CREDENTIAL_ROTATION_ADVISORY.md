# Credential Rotation Advisory

**Date:** 2026-08-29
**Authority:** SECURITY_AUDIT_STATUS.md — Remaining Security Work, Item 1
**Status:** PENDING OWNER ACTION

## Background

A historical revision of `.env.example` (now removed from the current tree) exposed
credential types for the following providers in reachable Git history:

- GitHub (personal access tokens / OAuth)
- Google Gemini API keys
- Hugging Face API keys/tokens
- Groq API keys
- (potentially) other AI, communication, and payment provider credentials

While the current repository tree is clean (no hardcoded secrets), Git history
retains the exposed values. Secret scanning in CI only catches new commits; it
cannot revoke historical values.

## Required Owner Actions

### 1. Revoke and rotate ALL potentially exposed credentials

For each provider listed below, the owner must:

1. Revoke the old key/secret from the provider's dashboard
2. Generate a new key/secret
3. Deploy the new secret to the production environment
4. Verify the new credential works (test a small operation)
5. Verify the old credential no longer works

### Providers requiring rotation

| Provider | Credential Type | Required Action |
|---|---|---|
| GitHub | `GITHUB_TOKEN` (PAT) | Revoke old PAT, generate new with appropriate scopes |
| Google | `GEMINI_API_KEY` | Revoke from Google Cloud Console, regenerate |
| Hugging Face | `HF_API_KEY` / `HUGGINGFACE_API_KEY` | Revoke from Hugging Face, regenerate |
| Groq | `GROQ_API_KEY` | Revoke from Groq console, regenerate |
| Mistral | `MISTRAL_API_KEY` | Revoke from Mistral console, regenerate |
| OpenRouter | `OPENROUTER_API_KEY` | Revoke from OpenRouter, regenerate |
| OpenAI | `OPENAI_API_KEY` | Revoke from OpenAI, regenerate |
| WhatsApp | `WHATSAPP_TOKEN`, `WHATSAPP_APP_SECRET` | Regenerate in Meta Business Dashboard |
| Firebase | `FIREBASE_*` service account | Rotate service account key |
| Stripe | `STRIPE_SECRET_KEY` | Revoke from Stripe Dashboard, generate new |
| Africa's Talking | `AFRICASTALKING_API_KEY` | Regoke from ATRC dashboard, regenerate |

### 2. Review provider audit logs

For each provider, review the audit logs for any suspicious activity that may
have used the exposed credentials. Look for:
- Unusual API call patterns
- Unauthorized access to resources
- Unexpected charges or billing activity
- Suspicious IP addresses or geographic locations

### 3. Verify no secrets in CI/CD configuration

Check that:
- GitHub Actions secrets are up to date with the new credentials
- No old credentials are cached in any CI environment
- All workflow files use `${{ secrets.VARIABLE_NAME }}` syntax, not hardcoded values

## Important Notes

- **Do not** attempt a Git history rewrite. Rewriting public history was
  available for this repo but has been made private. Rewriting is still not
  recommended as it disrupts existing clones and references.
- **Rotation is mandatory** regardless of whether the exposed values appear
  to have been used maliciously.
- **Do not** reuse or test with the historical credential values.
- After rotation is complete, delete this document (or mark it as RESOLVED).

## Verification

After rotation:
1. All new credentials are deployed to the production environment
2. All old credentials are revoked and confirmed inactive
3. CI/CD pipelines are updated and passing
4. No hardcoded credentials remain in any branch
5. `npm run audit:security` passes without credential-related findings

## References

- `SECURITY_AUDIT_STATUS.md` — Full security audit status
- `.env.example` — Current template (placeholders only, no real credentials)
- `_test_provider_secret_readiness.test.ts` — Test that verifies credential readiness
