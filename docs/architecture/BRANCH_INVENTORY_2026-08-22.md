# Kurukoo Branch Inventory — 22 August 2026

**Authority:** Evidence only. `main` remains the only canonical integration branch.

This inventory compares every non-`main` branch with current `main` and records the disposition. `ahead_by` means the branch has commit lineage not reachable from current `main`; it does **not** by itself mean the code is uniquely valuable, because equivalent changes may already have landed through another merge/squash path.

## Disposition rules

- **DELETE — no unique work:** branch is behind/equivalent to `main`, or its work is explicitly superseded/merged elsewhere.
- **DELETE — unique lineage, content already reconciled:** branch has commits/files not reachable by SHA, but the useful implementation is already represented on `main` through another merge/convergence path.
- **PRESERVE / reconciled:** genuinely useful content was independently reviewed and copied/recomposed into canonical `main`; the historical branch itself remains disposable.
- **REVIEW:** unique content exists and has not been safely incorporated; do not merge blindly.

## Inventory

| Branch | vs `main` | Disposition | Reason |
|---|---:|---|---|
| `activation-convergence-2026-08-19` | +5 / -711 | DELETE — reconciled | Telegram activation/security work is already represented on `main`/later activation convergence. |
| `agent/end-to-end-convergence-2026-08-19` | +3 / -624 | DELETE — reconciled | Linked-device security test work is represented on current `main`. |
| `capabilities` | +39 / -878 | DELETE — superseded | Capability foundations are already canonical; old PR #36 was superseded. |
| `chore/truth-verification-consolidation` | +16 / -3 | DELETE — superseded | Older version of the now-merged truth consolidation. |
| `chore/truth-verification-consolidation-v2` | +14 / -3 | DELETE — merged | PR #70 merged its useful content into `main`. |
| `convergence-final-2026-08-19` | +6 / -752 | DELETE — historical | Historical convergence/test refinements; no open PR and no current architecture authority. |
| `develop` | +48 / -979 | DELETE — historical | Permanent development branch conflicts with the canonical-main policy; current mobile/visual work is already represented on `main`. |
| `docs/kurukoo-os-agent-foundation` | +2 / -4 | PRESERVE / reconciled | Its unique Agent/voice/future-capability foundation was reviewed and recomposed as `docs/architecture/KURUKOO_OS_AGENT_FOUNDATION.md` on `main`. |
| `feat/activation-and-provider-convergence` | +1 / -729 | DELETE — reconciled | Owner-activation workflow already exists on `main`. |
| `feat/activation-mistral-channel-live` | 0 / -703 | DELETE — behind | No unique commits beyond `main`. |
| `feat/admin-platform-convergence` | 0 / -765 | DELETE — behind | Admin convergence already landed. |
| `feat/backend-admin-end-to-end-hardening` | 0 / -743 | DELETE — behind | Backend/Admin hardening already landed. |
| `feat/client-architecture-convergence` | +42 / -820 | DELETE — superseded | Old client/ML convergence path; later canonical client convergence is on `main`. |
| `feat/client-convergence-with-mobile` | +43 / -820 | DELETE — superseded | Same historical client/mobile convergence line; current mobile tree is already on `main`. |
| `feat/e2e-convergence-current-main` | +41 / -627 | DELETE — superseded | Migration/saved/admin/notification changes are already represented on current `main`. |
| `feat/final-screen-refinement` | +8 / -610 | DELETE — superseded | Historical screen refinement; later visual convergence superseded it. |
| `feat/production-scale-readiness-convergence` | 0 / -737 | DELETE — behind | Scale readiness is already on `main`. |
| `feat/visual-refinement-final-pass` | 0 / -346 | DELETE — behind | Merged visual refinement history. |
| `feat/web-end-to-end-convergence` | +19 / -754 | DELETE — superseded | Older web convergence path; current web visual layers are on `main`. |
| `feat/web-frontend-convergence` | +36 / -714 | DELETE — superseded | Older frontend convergence; useful surfaces are represented through later current-main work. |
| `feat/web-visual-convergence` | 0 / -765 | DELETE — behind | Superseded visual branch. |
| `feature/kurukoo-os-weave-current` | +6 / -8 | DELETE — merged | PR #68 merged Quick Ride into `main`. |
| `feature/kurukoo-student-v1-training` | +116 / -818 | DELETE — superseded after review | Training foundation files are already represented on current `main`; do not merge the stale branch wholesale. |
| `feature/platform-convergence-frames` | +109 / -267 | DELETE — superseded | Visual/OS/mobile convergence was incorporated through later merged PRs; canonical ownership documents are already on `main`. |
| `feature/progressive-identity` | 0 / -844 | DELETE — behind | Progressive identity is already canonical. |
| `feature/ride-communication-economy-finalization` | 0 / -343 | DELETE — behind | Old ride branch; current Quick Ride is canonical on `main`. |
| `feature/ride-communication-economy-finalization-v2` | 0 / -343 | DELETE — behind | Duplicate historical ride branch. |
| `feature/ride-communication-economy-finalization-v3` | 0 / -343 | DELETE — behind | Duplicate historical ride branch. |
| `feature/ride-communication-economy-finalization-v4` | 0 / -343 | DELETE — behind | Duplicate historical ride branch. |
| `feature/ride-communication-economy-finalization-v5` | 0 / -343 | DELETE — behind | Duplicate historical ride branch. |
| `feature/ride-completion-on-convergence` | +14 / -282 | REVIEW → mostly superseded | Contains an old dispatch-lead settlement proposal not present on `main`; it was reviewed and **not merged** because its confirmation semantics should not be imported blindly. Useful policy concepts are now represented by canonical communication policy. |
| `feature/ride-final` | +4 / -343 | REVIEW → mostly superseded | Contains old provider communication policy/settlement files. The useful contextual communication policy was recomposed safely into `main`; old implementation remains unmerged. |
| `feature/web-app-visual-convergence` | +8 / -390 | DELETE — superseded | Historical app-shell visual refinement; current shell is on `main`. |
| `feature/web-mobile-visual-convergence` | 0 / -269 | DELETE — behind | Merged visual convergence history. |
| `fix/ai-provider-resolution-and-smollm2-truth` | +6 / -822 | DELETE — reconciled | Main already has the provider-resolution architecture and current SmolLM2 truth boundaries; its useful behaviour is represented by current routing/failover contracts. |
| `fix/conversational-identity-slot-boundary` | +6 / -822 | DELETE — reconciled | Main already contains the progressive identity/auth entry contract and tests. |
| `fix/live-activation-security-and-provider` | 0 / -703 | DELETE — behind | Activation hardening already landed. |
| `fix/native-intelligence-learning-pipeline` | +19 / -881 | DELETE — superseded | Prayer/learning work was incorporated through later convergence; current `main` owns the implementation. |
| `fix/security-test-jwt-fixtures-current-main` | 0 / -731 | DELETE — behind | Security fixture work already landed. |
| `hardening/pilot-production-boundary` | +2 / -942 | PRESERVE / reconciled | Its production-boundary guidance was reviewed and recomposed as `docs/deployment/PRODUCTION_IMPLEMENTATION_BOUNDARY.md`; `scaleTransition` is already on `main`. |
| `integration/kurukoo-os-final` | 0 / -392 | DELETE — behind | Historical integration branch. |
| `integration/kurukoo-os-final-trigger` | +1 / -393 | DELETE — obsolete | Contains only a temporary merge workflow; no permanent product authority. |
| `integration/near-completion` | +24 / -403 | DELETE — superseded | Historical convergence branch; later `main` superseded it. |
| `integration/near-completion-final-candidate` | +3 / -395 | DELETE — superseded | Historical release candidate. |
| `integration/near-completion-rebased` | +3 / -401 | DELETE — superseded | Historical rebased candidate. |
| `integration/near-completion-rebased-final` | +3 / -396 | DELETE — superseded | Historical rebased candidate. |
| `integration/visual-force-convergence` | 0 / -8 | DELETE — behind | Visual convergence base is already incorporated. |
| `security/gitleaks-test-fixtures-2026-08-19` | +3 / -754 | PRESERVE / reconciled | Its precise synthetic-fixture Gitleaks allowlist was reviewed and copied to canonical `.gitleaks.toml`; branch itself is disposable. |
| `staging/revamped-admin-final` | +194 / -744 | DELETE — superseded | Historical staging/admin tree; current Admin/control-plane architecture is on `main`. |

## Result

No non-`main` branch is approved for direct merge as a whole.

The only genuinely useful unique material found during this inventory was **small, composable policy/documentation/security content**, which has been recomposed into `main` rather than merging stale branches wholesale.

In particular:

- Agent/voice/future capability foundation → `docs/architecture/KURUKOO_OS_AGENT_FOUNDATION.md`.
- Provider communication affordance policy → `src/services/providerCommunicationPolicy.ts`.
- Production implementation boundary → `docs/deployment/PRODUCTION_IMPLEMENTATION_BOUNDARY.md`.
- Precise synthetic-fixture secret-scan allowlist → `.gitleaks.toml`.

The historical implementation branches must not become parallel authorities.

## Deletion rule

After confirming no open PR depends on a branch and that any unique useful material is represented on `main`, delete the branch ref. GitHub's branch-management model explicitly supports deleting branches that are no longer needed after merged/closed work; branch comparison should be used to review changed commits/files before deletion. 

If an automation surface cannot delete a remote ref, do **not** force-reset it or claim deletion. Record the exact branch as pending GitHub maintenance and perform the deletion through GitHub's branch UI/API with repository-owner write access.
