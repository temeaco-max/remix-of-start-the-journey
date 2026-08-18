# Progressive identity — branch status

Branch: `feature/progressive-identity`

The branch now contains the reconciled progressive-identity implementation on top of current `main`.

## Integrated

- Existing OTP routes remain intact.
- Magic-link challenge service is additive to OTP.
- Provisional `em_*` identities are explicitly lower trust.
- Push approval is restricted to existing non-provisional identities.
- `/api/auth/identity` and `/api/auth/identity/me` expose readiness/tier state.
- `/api/auth/request-magic-link`, `/api/auth/complete-challenge`, and `/api/auth/request-push-approval` are wired.
- Public `/auth/challenge/complete` renders the existing challenge completion page.
- Existing login surface offers Guest Chat, email magic link, and phone code without introducing a new auth UI system.
- Economic Request/storefront/known-offer entry points enforce `assertIdentityAllows` before economic actions.
- Guest and provisional identities cannot pass economic, payment, provider-action or equivalent high-trust entry gates.
- Progressive identity contract tests are in CI.

## Security constraints

- Magic-link tokens are high-entropy, HMAC-hashed at rest, short-lived, purpose-bound and single-use.
- `returnPath` is restricted to internal paths.
- Debug completion URLs are disabled in production.
- Email continuity never marks a phone as phone-verified.
- OTP delivery remains governed by the existing SMS adapter; Africa's Talking (or another configured SMS provider) is still required for real phone verification in production.
- Local/test authentication can continue through the existing development test identity and email magic-link debug path without real SMS delivery.

## Current status

This branch is a review candidate for PR #34. It must pass repository CI before merging to `main`.
