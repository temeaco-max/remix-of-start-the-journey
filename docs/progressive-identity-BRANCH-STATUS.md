# feature/progressive-identity — publish status

**Branch is on GitHub:** `feature/progressive-identity`

## Already published on this branch (via connected GitHub)

- `docs/progressive-identity.md`
- `src/services/progressiveIdentityService.ts`
- `src/services/guestSessionMigration.ts` (em_* merge rules)
- `views/auth-challenge-complete.ejs`

## Full implementation (local workspace + patch)

The complete progressive-identity commit also includes:

- `src/services/authChallengeService.ts` (magic link, hashed tokens, returnPath allowlist)
- `src/routes/authRoutes.ts` (additive identity / magic-link / push-approval routes; OTP untouched)
- `src/routes/publicRoutes.ts` (login identity flags + complete route)
- `views/login.ejs` (No account · Email link · Phone code)
- `src/services/conversationalAuthService.ts` (soft-fail to magic link)
- `src/services/pilotReadiness.ts` (`progressiveIdentity` readiness)
- `src/services/skillFlows.ts` (`assertIdentityAllows` on economic request create)
- `public/js/kurukoo-primary-chat.js` (`progressive_identity` cards)
- `public/css/kurukoo-auth.css`
- `.env.example`, `README.md`, `CONTROLLED_PILOT.md`

Apply the full patch on top of this branch (or on main):

```bash
git fetch origin feature/progressive-identity
git checkout feature/progressive-identity
# If you have progressive-identity.patch from the Grok artifacts:
git am progressive-identity.patch
# or merge from a local clone that has the full commit
git push origin feature/progressive-identity
```

Design constraints (already in published services):

- Phone remains primary channel identity once proven
- `em_*` is provisional and cannot pass economic/payment gates
- OTP routes remain unchanged
- Magic-link tokens: single-use, hashed at rest, short TTL, purpose-bound, returnPath allowlisted

Compare: https://github.com/temeaco-max/kurukoo/compare/main...feature/progressive-identity
